import type {
  Branch,
  MenuCategory,
  Order,
  OrderItem,
  OrderStatus,
  PaymentStatus,
  Product,
  Table,
  User,
} from '../../../types/domain';
import type { AppSettings } from '../../../store/settingsStore';

/** Public-safe order status returned by the kk_track_order RPC (guest-readable). */
export type TrackedOrderStatus = {
  id: string;
  shortCode: string;
  channel: Order['channel'];
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  guestName?: string;
  total: number;
  createdAt: string;
  updatedAt: string;
};
import { settingsFromDbRow, siteConfigFromSettings, type SiteConfigJson } from '../../settingsSync';
import { supabase } from '../client';
import { authRepo } from './auth';
import { profileBranchId } from '../../roles';

function mapBranch(row: any): Branch {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    address: row.address,
    city: row.city,
    status: row.status,
    hours: row.hours ?? [],
    heroImage: row.hero_image ?? undefined,
    lat: row.lat ?? undefined,
    lng: row.lng ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapCategory(row: any): MenuCategory {
  return {
    id: row.id,
    branchId: row.branch_id,
    name: row.name,
    order: row.sort_order,
    visible: row.visible,
  };
}

function mapProduct(row: any): Product {
  return {
    id: row.id,
    categoryId: row.category_id,
    branchId: row.branch_id,
    name: row.name,
    description: row.description ?? undefined,
    basePrice: Number(row.base_price ?? 0),
    image: row.image ?? undefined,
    temperature: row.temperature,
    sizes: row.sizes ?? [],
    milks: row.milks ?? [],
    tags: row.tags ?? [],
    customFields: row.custom_fields ?? [],
    visible: row.visible,
    order: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapTable(row: any): Table {
  return {
    id: row.id,
    branchId: row.branch_id,
    code: row.code,
    label: row.label,
    qrPayload: row.qr_payload,
    active: row.active,
  };
}

function mapOrderItem(row: any): OrderItem {
  return {
    id: row.id,
    productId: row.product_id ?? '',
    productNameSnapshot: row.product_name_snapshot,
    itemType: row.item_type ?? undefined,
    sizeId: row.size_id ?? undefined,
    sizeLabelSnapshot: row.size_label_snapshot ?? undefined,
    milkId: row.milk_id ?? undefined,
    milkLabelSnapshot: row.milk_label_snapshot ?? undefined,
    temperature: row.temperature ?? undefined,
    merchVariants: row.merch_variants ?? [],
    notes: row.notes ?? undefined,
    unitPrice: Number(row.unit_price ?? 0),
    qty: row.qty ?? 0,
    lineTotal: Number(row.line_total ?? 0),
  };
}

function mapOrder(row: any): Order {
  return {
    id: row.id,
    shortCode: row.short_code,
    channel: row.channel,
    branchId: row.branch_id,
    tableId: row.table_id ?? undefined,
    customerId: row.customer_id ?? undefined,
    guestName: row.guest_name ?? undefined,
    staffId: row.staff_id ?? undefined,
    paymentMethod: row.payment_method ?? undefined,
    paymentProofImage: row.payment_proof_image ?? undefined,
    paymentProofUploadedAt: row.payment_proof_uploaded_at ?? undefined,
    paymentStatus: row.payment_status,
    status: row.status,
    items: (row.kk_order_items ?? []).map(mapOrderItem),
    subtotal: Number(row.subtotal ?? 0),
    modifiersTotal: Number(row.modifiers_total ?? 0),
    tax: Number(row.tax ?? 0),
    total: Number(row.total ?? 0),
    loyaltyStampsAwarded: row.loyalty_stamps_awarded ?? undefined,
    loyaltyVoucherId: row.loyalty_voucher_id ?? undefined,
    loyaltyVoucherCode: row.loyalty_voucher_code ?? undefined,
    loyaltyDiscountTotal: row.loyalty_discount_total ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapUser(row: any): User {
  const role = row.role as User['role'];
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role,
    branchId: role === 'admin' ? undefined : (row.branch_id ?? undefined),
    loyaltyStamps: row.loyalty_stamps ?? undefined,
    createdAt: row.created_at,
  };
}

function mapSettings(row: Record<string, unknown>): Partial<AppSettings> {
  return settingsFromDbRow({
    tax_rate: row.tax_rate as number | string | null,
    gcash_qr_image: row.gcash_qr_image as string | null,
    order_hours: (row.order_hours ?? {}) as SiteConfigJson,
  });
}

export const orderingRepo = {
  async fetchBranches(): Promise<Branch[]> {
    if (!supabase) return [];
    const { data, error } = await supabase.from('kk_branches').select('*').order('name');
    if (error) throw error;
    return (data ?? []).map(mapBranch);
  },
  async upsertBranch(input: Branch) {
    if (!supabase) return;
    const { error } = await supabase.from('kk_branches').upsert({
      id: input.id,
      slug: input.slug,
      name: input.name,
      address: input.address,
      city: input.city,
      status: input.status,
      hours: input.hours,
      hero_image: input.heroImage ?? null,
      lat: input.lat ?? null,
      lng: input.lng ?? null,
    });
    if (error) throw error;
  },
  async fetchMenu(): Promise<{ categories: MenuCategory[]; products: Product[] }> {
    if (!supabase) return { categories: [], products: [] };
    const [catRes, prodRes] = await Promise.all([
      supabase.from('kk_menu_categories').select('*').order('sort_order'),
      supabase.from('kk_products').select('*').order('sort_order'),
    ]);
    if (catRes.error) throw catRes.error;
    if (prodRes.error) throw prodRes.error;
    return {
      categories: (catRes.data ?? []).map(mapCategory),
      products: (prodRes.data ?? []).map(mapProduct),
    };
  },
  async upsertCategory(c: MenuCategory) {
    if (!supabase) return;
    const { error } = await supabase.from('kk_menu_categories').upsert({
      id: c.id,
      branch_id: c.branchId ?? null,
      name: c.name,
      sort_order: c.order,
      visible: c.visible,
    });
    if (error) throw error;
  },
  async upsertProduct(p: Product) {
    if (!supabase) return;
    const { error } = await supabase.from('kk_products').upsert({
      id: p.id,
      category_id: p.categoryId,
      branch_id: p.branchId ?? null,
      name: p.name,
      description: p.description ?? null,
      base_price: p.basePrice,
      image: p.image ?? null,
      temperature: p.temperature,
      sizes: p.sizes ?? [],
      milks: p.milks ?? [],
      tags: p.tags ?? [],
      custom_fields: p.customFields ?? [],
      visible: p.visible,
      sort_order: p.order,
    });
    if (error) throw error;
  },
  async fetchTables(): Promise<Table[]> {
    if (!supabase) return [];
    const { data, error } = await supabase.from('kk_tables').select('*').order('label');
    if (error) throw error;
    return (data ?? []).map(mapTable);
  },
  async upsertTable(t: Table) {
    if (!supabase) return;
    const { error } = await supabase.from('kk_tables').upsert({
      id: t.id,
      branch_id: t.branchId,
      code: t.code,
      label: t.label,
      qr_payload: t.qrPayload,
      active: t.active,
    });
    if (error) throw error;
  },
  async deleteTable(id: string) {
    if (!supabase) return;
    const { error } = await supabase.from('kk_tables').delete().eq('id', id);
    if (error) throw error;
  },
  async fetchOrders(): Promise<Order[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('kk_orders')
      .select('*, kk_order_items(*)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapOrder);
  },
  async insertOrder(o: Order) {
    if (!supabase) return;
    const { error } = await supabase.from('kk_orders').insert({
      id: o.id,
      short_code: o.shortCode,
      channel: o.channel,
      branch_id: o.branchId,
      table_id: o.tableId ?? null,
      customer_id: o.customerId ?? null,
      guest_name: o.guestName ?? null,
      staff_id: o.staffId ?? null,
      payment_method: o.paymentMethod ?? null,
      payment_proof_image: o.paymentProofImage ?? null,
      payment_proof_uploaded_at: o.paymentProofUploadedAt ?? null,
      payment_status: o.paymentStatus,
      status: o.status,
      subtotal: o.subtotal,
      modifiers_total: o.modifiersTotal,
      tax: o.tax ?? 0,
      total: o.total,
      loyalty_stamps_awarded: o.loyaltyStampsAwarded ?? null,
      loyalty_voucher_id: o.loyaltyVoucherId ?? null,
      loyalty_voucher_code: o.loyaltyVoucherCode ?? null,
      loyalty_discount_total: o.loyaltyDiscountTotal ?? null,
    });
    if (error) throw error;
    const items = o.items.map((it) => ({
      id: it.id,
      order_id: o.id,
      product_id: it.productId ?? null,
      product_name_snapshot: it.productNameSnapshot,
      item_type: it.itemType ?? null,
      size_id: it.sizeId ?? null,
      size_label_snapshot: it.sizeLabelSnapshot ?? null,
      milk_id: it.milkId ?? null,
      milk_label_snapshot: it.milkLabelSnapshot ?? null,
      temperature: it.temperature ?? null,
      merch_variants: it.merchVariants ?? [],
      notes: it.notes ?? null,
      unit_price: it.unitPrice,
      qty: it.qty,
      line_total: it.lineTotal,
    }));
    if (items.length) {
      const itemRes = await supabase.from('kk_order_items').insert(items);
      if (itemRes.error) throw itemRes.error;
    }
  },
  /**
   * Capability-based status lookup for a single order by its (unguessable) id.
   * Works for guests/anon since it calls the SECURITY DEFINER `kk_track_order`
   * RPC — see supabase/migrations/0001_kk_track_order.sql.
   */
  async trackOrder(id: string): Promise<TrackedOrderStatus | null> {
    if (!supabase) return null;
    const { data, error } = await supabase.rpc('kk_track_order', { order_id: id });
    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) return null;
    return {
      id: row.id,
      shortCode: row.short_code,
      channel: row.channel,
      status: row.status,
      paymentStatus: row.payment_status,
      guestName: row.guest_name ?? undefined,
      total: Number(row.total ?? 0),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },
  async patchOrder(id: string, patch: Partial<Order>) {
    if (!supabase) return;
    const dbPatch: any = {};
    if (patch.status) dbPatch.status = patch.status;
    if (patch.paymentStatus) dbPatch.payment_status = patch.paymentStatus;
    if (patch.paymentProofImage !== undefined) dbPatch.payment_proof_image = patch.paymentProofImage ?? null;
    if (patch.paymentProofUploadedAt !== undefined) dbPatch.payment_proof_uploaded_at = patch.paymentProofUploadedAt ?? null;
    if (patch.loyaltyStampsAwarded !== undefined) dbPatch.loyalty_stamps_awarded = patch.loyaltyStampsAwarded ?? null;
    if (patch.staffId !== undefined) dbPatch.staff_id = patch.staffId ?? null;
    const { error } = await supabase.from('kk_orders').update(dbPatch).eq('id', id);
    if (error) throw error;
  },
  async uploadPaymentProof(orderId: string, file: File): Promise<string> {
    if (!supabase) throw new Error('Supabase is not configured.');
    const session = await authRepo.session();
    const userId = session?.user?.id;
    if (!userId) throw new Error('Sign in required for payment proof upload.');
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `${userId}/${orderId}-${Date.now()}.${ext}`;
    const upload = await supabase.storage.from('kado-payment-proofs').upload(path, file, {
      upsert: true,
      contentType: file.type || 'image/jpeg',
    });
    if (upload.error) throw upload.error;
    const signed = await supabase.storage.from('kado-payment-proofs').createSignedUrl(path, 60 * 60 * 24 * 14);
    if (signed.error) throw signed.error;
    return signed.data.signedUrl;
  },
  async fetchUsers(): Promise<User[]> {
    if (!supabase) return [];
    const { data, error } = await supabase.from('kk_profiles').select('*').order('created_at');
    if (error) throw error;
    return (data ?? []).map(mapUser);
  },
  async upsertUser(u: User) {
    if (!supabase) return;
    const { error } = await supabase.from('kk_profiles').upsert({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      branch_id: profileBranchId(u),
      loyalty_stamps: u.role === 'customer' ? (u.loyaltyStamps ?? 0) : 0,
    });
    if (error) throw error;
  },
  async deleteUser(id: string) {
    if (!supabase) return;
    const { error } = await supabase.from('kk_profiles').delete().eq('id', id);
    if (error) throw error;
  },
  /** Fetch a single profile row by ID (used when the local store may not have it). */
  async fetchUserById(id: string): Promise<User | null> {
    if (!supabase) return null;
    const { data, error } = await supabase.from('kk_profiles').select('*').eq('id', id).maybeSingle();
    if (error || !data) return null;
    return mapUser(data as Parameters<typeof mapUser>[0]);
  },
  /** Pure UPDATE of a customer's stamp balance — works for staff/barista (no INSERT needed). */
  async updateUserStamps(id: string, stamps: number) {
    if (!supabase) return;
    const { error } = await supabase.from('kk_profiles').update({ loyalty_stamps: stamps }).eq('id', id);
    if (error) throw error;
  },
  async fetchSettings(): Promise<Partial<AppSettings> | null> {
    if (!supabase) return null;
    const { data, error } = await supabase.from('kk_app_settings').select('*').eq('id', true).maybeSingle();
    if (error || !data) return null;
    return mapSettings(data);
  },
  async upsertSettings(settings: AppSettings) {
    if (!supabase) return;
    const { error } = await supabase.from('kk_app_settings').upsert({
      id: true,
      tax_rate: settings.taxRate ?? 0,
      gcash_qr_image: settings.gcashQrImage || null,
      order_hours: siteConfigFromSettings(settings),
    });
    if (error) throw error;
  },
};
