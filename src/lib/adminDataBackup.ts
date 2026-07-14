/**
 * Admin complete data backup → multi-sheet .xlsx
 * Works under admin RLS session. Excludes secrets (password hashes, push keys, proof data-URLs).
 */

import type {
  Branch,
  BoothBooking,
  Event,
  LoyaltyReward,
  LoyaltyVoucher,
  MenuCategory,
  MerchCategory,
  MerchProduct,
  Order,
  OrderItem,
  Product,
  PromoCode,
  Table,
  User,
} from '../types/domain';
import {
  computeAdminOrderInsights,
  computeBranchBreakdown,
  computeCategorySales,
  computeChannelBreakdown,
  computePaymentMethodBreakdown,
  computeRevenueSeries,
  computeTopProducts,
} from './adminDashboardStats';
import { formatChannelLabel } from './adminOrderStats';
import { supabase } from './supabase/client';
import { orderingRepo } from './supabase/repositories/ordering';
import { loyaltyRepo } from './supabase/repositories/loyalty';
import { promoRepo } from './supabase/repositories/promo';
import { auditRepo } from './supabase/repositories/audit';
import { blogRepo } from './supabase/repositories/blog';

export type SheetRows = { name: string; rows: Record<string, unknown>[] };

const PAGE = 500;
const MAX_RETRIES = 3;

export type BackupProgress = {
  stage: string;
  detail?: string;
  loaded?: number;
};

export type BackupDownloadResult = {
  filename: string;
  sheetCount: number;
  orderCount: number;
  itemCount: number;
  warnings: string[];
};

function money(n: number): number {
  return Math.round((Number(n) || 0) * 100) / 100;
}

function yieldUi(): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, 0);
  });
}

async function withRetry<T>(label: string, run: () => Promise<T>): Promise<T> {
  let last: unknown;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      return await run();
    } catch (err) {
      last = err;
      if (attempt >= MAX_RETRIES) break;
      await new Promise((r) => window.setTimeout(r, 250 * attempt));
    }
  }
  const message = last instanceof Error ? last.message : String(last);
  throw new Error(`${label} failed after ${MAX_RETRIES} attempts: ${message}`);
}

function isoDay(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

function mapOrderItem(row: Record<string, unknown>): OrderItem {
  return {
    id: String(row.id),
    productId: String(row.product_id ?? ''),
    productNameSnapshot: String(row.product_name_snapshot ?? ''),
    itemType: (row.item_type as OrderItem['itemType']) ?? undefined,
    sizeId: (row.size_id as string) ?? undefined,
    sizeLabelSnapshot: (row.size_label_snapshot as string) ?? undefined,
    milkId: (row.milk_id as string) ?? undefined,
    milkLabelSnapshot: (row.milk_label_snapshot as string) ?? undefined,
    temperature: (row.temperature as OrderItem['temperature']) ?? undefined,
    merchVariants: Array.isArray(row.merch_variants) ? row.merch_variants : [],
    notes: (row.notes as string) ?? undefined,
    unitPrice: Number(row.unit_price ?? 0),
    qty: Number(row.qty ?? 0),
    lineTotal: Number(row.line_total ?? 0),
  };
}

function mapOrderRow(row: Record<string, unknown>): Order & {
  promoCode?: string;
  promoDiscountTotal?: number;
} {
  const items = Array.isArray(row.kk_order_items)
    ? (row.kk_order_items as Record<string, unknown>[]).map(mapOrderItem)
    : [];
  return {
    id: String(row.id),
    shortCode: String(row.short_code ?? ''),
    channel: row.channel as Order['channel'],
    branchId: String(row.branch_id),
    tableId: (row.table_id as string) ?? undefined,
    customerId: (row.customer_id as string) ?? undefined,
    guestName: (row.guest_name as string) ?? undefined,
    staffId: (row.staff_id as string) ?? undefined,
    paymentMethod: (row.payment_method as Order['paymentMethod']) ?? undefined,
    paymentStatus: row.payment_status as Order['paymentStatus'],
    status: row.status as Order['status'],
    items,
    subtotal: Number(row.subtotal ?? 0),
    modifiersTotal: Number(row.modifiers_total ?? 0),
    tax: Number(row.tax ?? 0),
    total: Number(row.total ?? 0),
    loyaltyStampsAwarded: row.loyalty_stamps_awarded != null ? Number(row.loyalty_stamps_awarded) : undefined,
    loyaltyVoucherId: (row.loyalty_voucher_id as string) ?? undefined,
    loyaltyVoucherCode: (row.loyalty_voucher_code as string) ?? undefined,
    loyaltyDiscountTotal:
      row.loyalty_discount_total != null ? Number(row.loyalty_discount_total) : undefined,
    guestAction: (row.guest_action as Order['guestAction']) ?? undefined,
    guestActionReason: (row.guest_action_reason as string) ?? undefined,
    guestActionNote: (row.guest_action_note as string) ?? undefined,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    promoCode: (row.promo_code as string) ?? undefined,
    promoDiscountTotal: row.promo_discount_total != null ? Number(row.promo_discount_total) : undefined,
  };
}

async function fetchAll(
  table: string,
  select: string,
  orderCol: string,
  onProgress?: (loaded: number) => void,
): Promise<Record<string, unknown>[]> {
  if (!supabase) throw new Error('Supabase is not configured.');
  const out: Record<string, unknown>[] = [];
  for (let from = 0; ; from += PAGE) {
    const batch = await withRetry(`${table} page ${from}`, async () => {
      const { data, error } = await supabase!
        .from(table)
        .select(select)
        // Stable multi-key order avoids duplicate/skip when timestamps collide.
        .order(orderCol, { ascending: false })
        .order('id', { ascending: false })
        .range(from, from + PAGE - 1);
      if (error) throw error;
      return (data ?? []) as unknown as Record<string, unknown>[];
    });
    out.push(...batch);
    onProgress?.(out.length);
    if (typeof window !== 'undefined') await yieldUi();
    if (batch.length < PAGE) break;
  }
  return out;
}

/** Attach line items to parent orders without a nested PostgREST join (safer at scale). */
export function mergeOrdersWithItems(
  orderRows: Record<string, unknown>[],
  itemRows: Record<string, unknown>[],
): Array<Order & { promoCode?: string; promoDiscountTotal?: number }> {
  const byOrder = new Map<string, Record<string, unknown>[]>();
  for (const item of itemRows) {
    const orderId = String(item.order_id ?? '');
    if (!orderId) continue;
    const list = byOrder.get(orderId);
    if (list) list.push(item);
    else byOrder.set(orderId, [item]);
  }
  return orderRows.map((row) =>
    mapOrderRow({
      ...row,
      kk_order_items: byOrder.get(String(row.id)) ?? [],
    }),
  );
}

async function assertAdminSession(): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured.');
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!user) throw new Error('Sign in as an admin to download the backup.');

  const { data: profile, error } = await supabase
    .from('kk_profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  if (error) throw error;
  if (!profile || profile.role !== 'admin') {
    throw new Error('Admin role required. Only administrators can download the full data backup.');
  }
}

export type AdminBackupInput = {
  generatedAt: string;
  branches: Branch[];
  categories: MenuCategory[];
  products: Product[];
  orders: Array<Order & { promoCode?: string; promoDiscountTotal?: number }>;
  users: User[];
  tables: Table[];
  merchCategories: MerchCategory[];
  merchProducts: MerchProduct[];
  events: Event[];
  eventRegistrations: Record<string, unknown>[];
  bookings: BoothBooking[];
  loyaltyRewards: LoyaltyReward[];
  loyaltyVouchers: LoyaltyVoucher[];
  promoCodes: PromoCode[];
  promoClaims: Record<string, unknown>[];
  payments: Record<string, unknown>[];
  auditLogs: Awaited<ReturnType<typeof auditRepo.fetch>>;
  careers: Record<string, unknown>[];
  blogPosts: Awaited<ReturnType<typeof blogRepo.fetchAll>>;
};

/** Pure sheet assembly — unit-testable without Excel or network. */
export function buildAdminBackupSheets(input: AdminBackupInput): SheetRows[] {
  const branchName = new Map(input.branches.map((b) => [b.id, b.name]));
  const nameOf = (id: string) => branchName.get(id) ?? id;

  const insights = computeAdminOrderInsights(input.orders);
  const byBranch = computeBranchBreakdown(input.orders, nameOf);
  const byChannel = computeChannelBreakdown(input.orders);
  const byPay = computePaymentMethodBreakdown(input.orders);
  const byCat = computeCategorySales(input.orders, input.categories, input.products);
  const daily = computeRevenueSeries(input.orders, 'all');
  const top = computeTopProducts(input.orders, input.categories, input.products, { limit: 500 });

  return [
    {
      name: 'Summary',
      rows: [
        { metric: 'Generated at (UTC)', value: input.generatedAt },
        { metric: 'Branches', value: input.branches.length },
        { metric: 'Menu products', value: input.products.length },
        { metric: 'Tables', value: input.tables.length },
        { metric: 'Profiles (all roles)', value: input.users.length },
        { metric: 'Customers', value: input.users.filter((u) => u.role === 'customer').length },
        {
          metric: 'Internal accounts',
          value: input.users.filter((u) => u.role !== 'customer').length,
        },
        { metric: 'Orders (all statuses)', value: insights.orderCount },
        { metric: 'Completed orders', value: insights.completedCount },
        { metric: 'Cancelled orders', value: insights.cancelledCount },
        { metric: 'Active pipeline orders', value: insights.activeCount },
        { metric: 'Net sales (excl. cancelled) PHP', value: money(insights.netSales) },
        { metric: 'Collected revenue (paid) PHP', value: money(insights.collectedRevenue) },
        { metric: 'Avg ticket PHP', value: money(insights.avgTicket) },
        { metric: 'Line items sold (qty)', value: insights.itemCount },
        { metric: 'Awaiting payment', value: insights.awaitingPaymentCount },
        { metric: 'Booth bookings', value: input.bookings.length },
        { metric: 'Events', value: input.events.length },
        { metric: 'Event registrations', value: input.eventRegistrations.length },
        { metric: 'Loyalty vouchers issued', value: input.loyaltyVouchers.length },
        { metric: 'Promo codes', value: input.promoCodes.length },
        { metric: 'Payment transactions', value: input.payments.length },
        { metric: 'Audit log rows (export)', value: input.auditLogs.length },
      ],
    },
    {
      name: 'Sales_By_Branch',
      rows: byBranch.map((b) => ({
        branch: b.name,
        branch_id: b.branchId,
        orders: b.orders,
        revenue_php: money(b.revenue),
        avg_ticket_php: money(b.avgTicket),
        share_pct: money(b.sharePct),
      })),
    },
    {
      name: 'Sales_By_Channel',
      rows: byChannel.map((c) => ({
        channel: c.label,
        orders: c.count,
        revenue_php: money(c.revenue),
      })),
    },
    {
      name: 'Sales_By_Payment',
      rows: byPay.map((p) => ({
        method: p.label,
        orders: p.count,
        revenue_php: money(p.revenue),
      })),
    },
    {
      name: 'Sales_By_Category',
      rows: byCat.map((c) => ({
        category: c.label,
        qty: c.qty,
        revenue_php: money(c.revenue),
      })),
    },
    {
      name: 'Sales_Daily',
      rows: daily.map((d) => ({
        date: d.key,
        label: d.label,
        orders: d.orders,
        revenue_php: money(d.revenue),
      })),
    },
    {
      name: 'Sales_Products',
      rows: top.map((p) => ({
        product: p.name,
        category: p.category,
        qty: p.qty,
        revenue_php: money(p.revenue),
      })),
    },
    {
      name: 'Orders',
      rows: input.orders.map((o) => ({
        id: o.id,
        short_code: o.shortCode,
        channel: formatChannelLabel(o.channel),
        branch: nameOf(o.branchId),
        branch_id: o.branchId,
        table_id: o.tableId ?? '',
        customer_id: o.customerId ?? '',
        guest_name: o.guestName ?? '',
        staff_id: o.staffId ?? '',
        status: o.status,
        payment_method: o.paymentMethod ?? '',
        payment_status: o.paymentStatus,
        subtotal_php: money(o.subtotal),
        modifiers_php: money(o.modifiersTotal),
        tax_php: money(o.tax ?? 0),
        total_php: money(o.total),
        promo_code: o.promoCode ?? '',
        promo_discount_php: money(o.promoDiscountTotal ?? 0),
        loyalty_discount_php: money(o.loyaltyDiscountTotal ?? 0),
        loyalty_voucher_code: o.loyaltyVoucherCode ?? '',
        guest_action: o.guestAction ?? '',
        guest_action_reason: o.guestActionReason ?? '',
        created_at: o.createdAt,
        created_date: isoDay(o.createdAt),
        updated_at: o.updatedAt,
      })),
    },
    {
      name: 'Order_Items',
      rows: input.orders.flatMap((o) =>
        o.items.map((it) => ({
          order_id: o.id,
          order_short_code: o.shortCode,
          order_date: isoDay(o.createdAt),
          branch: nameOf(o.branchId),
          channel: formatChannelLabel(o.channel),
          item_id: it.id,
          product_id: it.productId,
          product_name: it.productNameSnapshot,
          item_type: it.itemType ?? '',
          size: it.sizeLabelSnapshot ?? '',
          milk: it.milkLabelSnapshot ?? '',
          temperature: it.temperature ?? '',
          qty: it.qty,
          unit_price_php: money(it.unitPrice),
          line_total_php: money(it.lineTotal),
          notes: it.notes ?? '',
        })),
      ),
    },
    {
      name: 'Payments',
      rows: input.payments.map((p) => ({
        id: p.id,
        order_id: p.order_id,
        amount_php: p.amount != null ? money(Number(p.amount)) : '',
        method: p.method ?? p.payment_method ?? '',
        status: p.status ?? '',
        created_by: p.created_by ?? '',
        created_at: p.created_at ?? '',
      })),
    },
    {
      name: 'Branches',
      rows: input.branches.map((b) => ({
        id: b.id,
        slug: b.slug,
        name: b.name,
        address: b.address,
        city: b.city,
        status: b.status,
        lat: b.lat ?? '',
        lng: b.lng ?? '',
        created_at: b.createdAt,
      })),
    },
    {
      name: 'Tables',
      rows: input.tables.map((t) => ({
        id: t.id,
        branch: nameOf(t.branchId),
        branch_id: t.branchId,
        code: t.code,
        label: t.label,
        active: t.active,
      })),
    },
    {
      name: 'Menu_Categories',
      rows: input.categories.map((c) => ({
        id: c.id,
        name: c.name,
        sort_order: c.order,
        visible: c.visible,
        branch_id: c.branchId ?? '',
      })),
    },
    {
      name: 'Products',
      rows: input.products.map((p) => ({
        id: p.id,
        category_id: p.categoryId,
        branch_id: p.branchId ?? '',
        name: p.name,
        description: p.description ?? '',
        base_price_php: money(p.basePrice),
        temperature: p.temperature,
        visible: p.visible,
        in_stock: p.inStock !== false,
        sort_order: p.order,
        tags: (p.tags ?? []).join(', '),
        image: p.image ?? '',
      })),
    },
    {
      name: 'Merch_Categories',
      rows: input.merchCategories.map((c) => ({
        id: c.id,
        name: c.name,
        sort_order: c.order,
        visible: c.visible,
      })),
    },
    {
      name: 'Merch_Products',
      rows: input.merchProducts.map((p) => ({
        id: p.id,
        category_id: p.categoryId,
        name: p.name,
        base_price_php: money(p.basePrice),
        visible: p.visible,
      })),
    },
    {
      name: 'Profiles',
      rows: input.users.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        branch_id: u.branchId ?? '',
        phone: u.phone ?? '',
        loyalty_stamps: u.loyaltyStamps ?? 0,
        created_at: u.createdAt,
      })),
    },
    {
      name: 'Booth_Bookings',
      rows: input.bookings.map((b) => ({
        id: b.id,
        short_code: b.shortCode,
        status: b.status,
        booking_kind: b.bookingKind,
        customer_id: b.customerId ?? '',
        contact_name: b.contactName,
        contact_email: b.contactEmail,
        contact_phone: b.contactPhone,
        event_name: b.eventName,
        event_date: b.eventDate,
        guest_count: b.guestCount,
        package: b.packageNameSnapshot,
        payment_status: b.paymentStatus,
        payment_amount_php: b.paymentAmount != null ? money(b.paymentAmount) : '',
        estimate_total_php: money(b.estimateSnapshot?.total ?? 0),
        final_quote_php: b.finalQuote?.total != null ? money(b.finalQuote.total) : '',
        created_at: b.createdAt,
      })),
    },
    {
      name: 'Events',
      rows: input.events.map((e) => ({
        id: e.id,
        title: e.title,
        branch_id: e.branchId ?? '',
        starts_at: e.startsAt,
        ends_at: e.endsAt ?? '',
        visible: e.visible,
        highlight: Boolean(e.highlight),
        signup_enabled: Boolean(e.signupEnabled),
        max_signups: e.maxSignups ?? '',
      })),
    },
    {
      name: 'Event_Registrations',
      rows: input.eventRegistrations.map((r) => ({
        id: r.id,
        event_id: r.event_id,
        customer_id: r.customer_id ?? '',
        contact_name: r.contact_name ?? '',
        contact_email: r.contact_email ?? '',
        contact_phone: r.contact_phone ?? '',
        created_at: r.created_at ?? '',
      })),
    },
    {
      name: 'Loyalty_Rewards',
      rows: input.loyaltyRewards.map((r) => ({
        id: r.id,
        name: r.name,
        type: r.type,
        stamps_required: r.stampsRequired,
        value: r.value ?? '',
        active: r.active,
        branch_id: r.branchId ?? '',
      })),
    },
    {
      name: 'Loyalty_Vouchers',
      rows: input.loyaltyVouchers.map((v) => ({
        id: v.id,
        code: v.code,
        customer_id: v.customerId,
        reward_id: v.rewardId,
        reward_name: v.rewardNameSnapshot,
        status: v.status,
        stamps_spent: v.stampsSpent,
        redeemed_order_id: v.redeemedOrderId ?? '',
        created_at: v.createdAt,
      })),
    },
    {
      name: 'Promo_Codes',
      rows: input.promoCodes.map((p) => ({
        id: p.id,
        code: p.code,
        name: p.name,
        type: p.type,
        value: p.value,
        active: p.active,
        uses: p.uses,
        max_uses: p.maxUses ?? '',
        expires_at: p.expiresAt ?? '',
        branch_id: p.branchId ?? '',
      })),
    },
    {
      name: 'Promo_Claims',
      rows: input.promoClaims.map((c) => ({
        id: c.id,
        promo_code_id: c.promo_code_id,
        customer_id: c.customer_id ?? '',
        order_id: c.order_id ?? '',
        discount_amount_php: c.discount_amount != null ? money(Number(c.discount_amount)) : '',
        claimed_at: c.claimed_at ?? '',
      })),
    },
    {
      name: 'Audit_Logs',
      rows: input.auditLogs.map((a) => ({
        id: a.id,
        action: a.action,
        actor_id: a.actorId ?? '',
        actor_email: a.actorEmail ?? '',
        actor_role: a.actorRole ?? '',
        entity_type: a.entityType,
        entity_id: a.entityId ?? '',
        branch_id: a.branchId ?? '',
        summary: a.summary ?? '',
        created_at: a.createdAt,
      })),
    },
    {
      name: 'Career_Applications',
      rows: input.careers.map((c) => ({
        id: c.id,
        listing_id: c.listing_id,
        listing_title: c.listing_title ?? '',
        contact_name: c.contact_name ?? '',
        contact_email: c.contact_email,
        contact_phone: c.contact_phone ?? '',
        created_at: c.created_at ?? '',
      })),
    },
    {
      name: 'Blog_Posts',
      rows: input.blogPosts.map((p) => ({
        id: p.id,
        slug: p.slug,
        title: p.title,
        category: p.category,
        visible: p.visible,
        published_at: p.publishedAt,
      })),
    },
  ];
}

export async function fetchAdminBackupBundle(
  onProgress?: (progress: BackupProgress) => void,
): Promise<{ bundle: AdminBackupInput; warnings: string[] }> {
  if (!supabase) throw new Error('Supabase is not configured.');
  await assertAdminSession();

  const warnings: string[] = [];
  const report = (stage: string, detail?: string, loaded?: number) => {
    onProgress?.({ stage, detail, loaded });
  };

  report('catalog', 'Loading branches, menu, tables…');
  const [branches, menu, tables, merch, events, users, bookings, rewards, vouchers, promoCodes, blogPosts] =
    await Promise.all([
      orderingRepo.fetchBranches(),
      orderingRepo.fetchMenu(),
      orderingRepo.fetchTables(),
      orderingRepo.fetchMerch(),
      orderingRepo.fetchEvents(),
      orderingRepo.fetchUsers(),
      orderingRepo.fetchBookings(),
      loyaltyRepo.fetchRewards(),
      loyaltyRepo.fetchAllVouchers(),
      promoRepo.fetchAll(),
      blogRepo.fetchAll(),
    ]);

  report('orders', 'Paging orders…');
  const orderRows = await fetchAll('kk_orders', '*', 'created_at', (loaded) =>
    report('orders', `Loaded ${loaded} orders…`, loaded),
  );

  report('order_items', 'Paging order line items…');
  const itemRows = await fetchAll('kk_order_items', '*', 'created_at', (loaded) =>
    report('order_items', `Loaded ${loaded} line items…`, loaded),
  );
  const orders = mergeOrdersWithItems(orderRows, itemRows);

  const softFetch = async (label: string, table: string, select: string, orderCol: string) => {
    try {
      report(label, `Paging ${label}…`);
      return await fetchAll(table, select, orderCol, (loaded) =>
        report(label, `Loaded ${loaded} ${label}…`, loaded),
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      warnings.push(`${label}: ${message}`);
      return [] as Record<string, unknown>[];
    }
  };

  const payments = await softFetch('payments', 'kk_payment_transactions', '*', 'created_at');
  const promoClaims = await softFetch('promo_claims', 'kk_promo_claims', '*', 'claimed_at');
  const eventRegistrations = await softFetch('event_registrations', 'kk_event_registrations', '*', 'created_at');
  const careers = await softFetch(
    'career_applications',
    'kk_career_applications',
    'id, listing_id, listing_title, contact_name, contact_email, contact_phone, created_at',
    'created_at',
  );

  report('audit', 'Paging audit logs…');
  let auditLogs: AdminBackupInput['auditLogs'] = [];
  try {
    const auditRows = await fetchAll('kk_audit_logs', '*', 'created_at', (loaded) =>
      report('audit', `Loaded ${loaded} audit rows…`, loaded),
    );
    auditLogs = auditRows.map((r) => ({
      id: String(r.id),
      actorId: (r.actor_id as string) ?? null,
      actorEmail: (r.actor_email as string) ?? null,
      actorRole: (r.actor_role as string) ?? null,
      action: String(r.action ?? ''),
      entityType: String(r.entity_type ?? ''),
      entityId: (r.entity_id as string) ?? null,
      branchId: (r.branch_id as string) ?? null,
      summary: (r.summary as string) ?? null,
      metadata: (r.metadata as Record<string, unknown>) ?? {},
      createdAt: String(r.created_at ?? ''),
    }));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    warnings.push(`audit_logs: ${message}`);
    auditLogs = await auditRepo.fetch(5000).catch(() => []);
  }

  report('assemble', `Assembling ${orders.length} orders and ${itemRows.length} line items…`);

  return {
    warnings,
    bundle: {
      generatedAt: new Date().toISOString(),
      branches,
      categories: menu.categories,
      products: menu.products,
      tables,
      merchCategories: merch.categories,
      merchProducts: merch.products,
      events,
      users,
      bookings,
      loyaltyRewards: rewards,
      loyaltyVouchers: vouchers,
      promoCodes,
      orders,
      payments,
      promoClaims,
      eventRegistrations,
      careers,
      auditLogs,
      blogPosts,
    },
  };
}

export async function buildAdminBackupWorkbookBlob(
  sheets: SheetRows[],
  onProgress?: (progress: BackupProgress) => void,
): Promise<Blob> {
  onProgress?.({ stage: 'excel', detail: 'Loading Excel engine…' });
  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Kado Kohi Admin';
  workbook.created = new Date();
  workbook.modified = new Date();

  for (let s = 0; s < sheets.length; s += 1) {
    const sheet = sheets[s]!;
    onProgress?.({
      stage: 'excel',
      detail: `Writing sheet ${s + 1}/${sheets.length}: ${sheet.name}`,
      loaded: s + 1,
    });
    if (typeof window !== 'undefined') await yieldUi();

    const ws = workbook.addWorksheet(sheet.name.slice(0, 31), {
      views: [{ state: 'frozen', ySplit: 1 }],
    });
    if (!sheet.rows.length) {
      ws.addRow(['(no rows)']);
      continue;
    }
    const keys = Object.keys(sheet.rows[0]!);
    const header = ws.addRow(keys);
    header.font = { bold: true, color: { argb: 'FFF1DFBA' } };
    header.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF9E181D' },
    };
    header.alignment = { vertical: 'middle' };

    // Batch add rows — much faster than one-by-one for large order history.
    const values = sheet.rows.map((row) => keys.map((k) => row[k] ?? ''));
    ws.addRows(values);

    keys.forEach((key, i) => {
      const col = ws.getColumn(i + 1);
      const sample = String(sheet.rows[0]?.[key] ?? key);
      col.width = Math.min(42, Math.max(12, sample.length + 4, key.length + 2));
      if (key.includes('_php') || key === 'value' || key.endsWith('_pct')) {
        col.numFmt = '#,##0.00';
      }
    });
  }

  onProgress?.({ stage: 'excel', detail: 'Encoding .xlsx file…' });
  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

export function adminBackupFilename(generatedAt = new Date()): string {
  const stamp = generatedAt.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return `kado-kohi-admin-backup-${stamp}.xlsx`;
}

export async function downloadAdminDataBackup(
  onProgress?: (progress: BackupProgress) => void,
): Promise<BackupDownloadResult> {
  const { bundle, warnings } = await fetchAdminBackupBundle(onProgress);
  onProgress?.({ stage: 'sheets', detail: 'Computing sales summaries…' });
  const sheets = buildAdminBackupSheets(bundle);
  const blob = await buildAdminBackupWorkbookBlob(sheets, onProgress);
  const filename = adminBackupFilename(new Date(bundle.generatedAt));

  onProgress?.({ stage: 'download', detail: `Saving ${filename}…` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);

  return {
    filename,
    sheetCount: sheets.length,
    orderCount: bundle.orders.length,
    itemCount: bundle.orders.reduce((n, o) => n + o.items.length, 0),
    warnings,
  };
}
