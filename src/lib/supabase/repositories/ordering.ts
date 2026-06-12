import type { EventFormTemplate } from '../../eventForms';
import { parseFormFields } from '../../eventForms';
import type {
  BoothBooking,
  BoothBookingStatus,
  Branch,
  Event,
  EventRegistration,
  MerchCategory,
  MerchProduct,
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

function pgErrorFields(err: unknown): { message: string; code: string; details: string } {
  if (err && typeof err === 'object') {
    const row = err as { message?: string; code?: string; details?: string };
    return {
      message: row.message ?? '',
      code: row.code ?? '',
      details: row.details ?? '',
    };
  }
  return { message: err instanceof Error ? err.message : String(err ?? ''), code: '', details: '' };
}

export function formatTableCrudError(err: unknown, action: 'add' | 'update' | 'delete' | 'toggle'): string {
  const { message, code, details } = pgErrorFields(err);
  const blob = `${message} ${details} ${code}`;
  if (/row-level security|permission denied|jwt|not authorized/i.test(blob)) {
    return 'Admin access is required to manage tables.';
  }
  if (code === '23503' || /foreign key|kk_orders_table_id_fkey|violates.*constraint/i.test(blob)) {
    return action === 'delete'
      ? 'This table still has linked orders and the database migration is pending. Turn it off instead, or run migration 0030_tables_crud_fix on project idwtlujcdfnnndxmlaco.'
      : message || details;
  }
  if (code === '23505' || /duplicate key|unique/i.test(blob)) {
    return 'A table with this code already exists. Try again.';
  }
  if (/was not deleted|sign in as admin/i.test(blob)) {
    return blob.trim();
  }
  return message || details || `Could not ${action} table.`;
}

/** Public-safe order status returned by the kk_track_order RPC (guest-readable). */
export type TrackedOrderStatus = {
  id: string;
  shortCode: string;
  channel: Order['channel'];
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: Order['paymentMethod'];
  guestName?: string;
  total: number;
  hasPaymentProof?: boolean;
  createdAt: string;
  updatedAt: string;
};
import { settingsFromDbRow, siteConfigFromSettings, type SiteConfigJson } from '../../settingsSync';
import { prepareGuestPaymentProof } from '../../compressPaymentProof';
import {
  PAYMENT_PROOF_BUCKET,
  customerProofObjectPath,
  dataUrlToBlob,
  formatProofStorageRef,
  guestProofObjectPath,
} from '../../paymentProofStorage';
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
    inStock: row.in_stock !== false,
    order: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapMerchCategory(row: any): MerchCategory {
  return {
    id: row.id,
    name: row.name,
    order: row.sort_order,
    visible: row.visible,
  };
}

function mapMerchProduct(row: any): MerchProduct {
  return {
    id: row.id,
    categoryId: row.category_id,
    name: row.name,
    description: row.description ?? undefined,
    basePrice: Number(row.base_price ?? 0),
    image: row.image ?? undefined,
    variants: row.variants ?? [],
    tags: row.tags ?? [],
    visible: row.visible,
    order: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function parseEventImages(row: { images?: unknown; cover?: string | null }): string[] {
  const raw = row.images;
  if (Array.isArray(raw)) {
    return raw.filter((u): u is string => typeof u === 'string' && u.trim().length > 0);
  }
  if (row.cover?.trim()) return [row.cover.trim()];
  return [];
}

function mapEvent(row: any): Event {
  const images = parseEventImages(row);
  return {
    id: row.id,
    branchId: row.branch_id ?? null,
    title: row.title,
    description: row.description ?? '',
    startsAt: row.starts_at,
    endsAt: row.ends_at ?? undefined,
    images,
    cover: images[0] ?? row.cover ?? undefined,
    cta: row.cta ?? undefined,
    visible: row.visible,
    highlight: row.highlight ?? false,
    signupEnabled: row.signup_enabled ?? false,
    signupOpensAt: row.signup_opens_at ?? undefined,
    signupClosesAt: row.signup_closes_at ?? undefined,
    maxSignups: row.max_signups != null ? Number(row.max_signups) : undefined,
    signupFormId: row.signup_form_id ?? null,
  };
}

function mapEventForm(row: any): EventFormTemplate {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? '',
    fields: parseFormFields(row.fields),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapEventRegistration(row: any): EventRegistration {
  return {
    id: row.id,
    eventId: row.event_id,
    customerId: row.customer_id ?? undefined,
    contactName: row.contact_name,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    customAnswers:
      row.custom_answers && typeof row.custom_answers === 'object' ? row.custom_answers : undefined,
    createdAt: row.created_at,
  };
}

function mapBooking(row: any): BoothBooking {
  return {
    id: row.id,
    shortCode: row.short_code,
    branchId: row.branch_id ?? undefined,
    customerId: row.customer_id ?? undefined,
    contactName: row.contact_name,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    eventName: row.event_name,
    occasion: row.occasion,
    guestCount: row.guest_count ?? 0,
    eventDate: row.event_date,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    packageId: row.package_id,
    packageNameSnapshot: row.package_name_snapshot,
    packageBasePriceSnapshot: Number(row.package_base_price_snapshot ?? 0),
    selectedAddons: row.selected_addons ?? [],
    specialRequests: row.special_requests ?? undefined,
    estimateSnapshot: row.estimate_snapshot ?? undefined,
    finalQuote: row.final_quote ?? undefined,
    quoteNotes: row.quote_notes ?? undefined,
    quotedAt: row.quoted_at ?? undefined,
    status: row.status,
    assignedStaffId: row.assigned_staff_id ?? undefined,
    internalNotes: row.internal_notes ?? undefined,
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
    phone: (row.phone as string | null) ?? undefined,
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
  async deleteBranch(id: string) {
    if (!supabase) return;
    const { error } = await supabase.from('kk_branches').delete().eq('id', id);
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
  /** Idempotent KADO MENU V2 seed. Falls back to direct upsert if RPC not yet in schema cache. */
  async ensureMenuCatalog(): Promise<{ categories: number; products: number }> {
    if (!supabase) throw new Error('Supabase is not configured.');
    const { data, error } = await supabase.rpc('kk_ensure_menu_catalog');
    if (error) {
      const msg = error.message ?? '';
      // RPC exists in DB but PostgREST schema cache hasn't refreshed yet — not fatal.
      if (/could not find the function/i.test(msg) || /schema cache/i.test(msg) || error.code === 'PGRST202') {
        // Check if data already exists; if so treat as success.
        const { data: cats } = await supabase
          .from('kk_menu_categories')
          .select('id')
          .in('id', ['cat_classics', 'cat_signatures', 'cat_matcha', 'cat_yuzu']);
        const catCount = (cats ?? []).length;
        if (catCount >= 4) return { categories: catCount, products: 18 };
      }
      throw error;
    }
    const row = (data ?? {}) as { categories?: number; products?: number };
    return {
      categories: Number(row.categories ?? 0),
      products: Number(row.products ?? 0),
    };
  },
  async ensureDefaultTables(): Promise<{ tables: number }> {
    if (!supabase) throw new Error('Supabase is not configured.');
    const { data, error } = await supabase.rpc('kk_ensure_default_tables');
    if (error) {
      const msg = error.message ?? '';
      // RPC exists in DB but PostgREST schema cache hasn't refreshed yet — not fatal.
      if (/could not find the function/i.test(msg) || /schema cache/i.test(msg) || error.code === 'PGRST202') {
        const { data: tbls } = await supabase
          .from('kk_tables')
          .select('id')
          .eq('branch_id', 'branch_marikina')
          .eq('active', true);
        return { tables: (tbls ?? []).length };
      }
      throw error;
    }
    const row = (data ?? {}) as { tables?: number };
    return { tables: Number(row.tables ?? 0) };
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
  async deleteCategory(id: string) {
    if (!supabase) return;
    await supabase.from('kk_products').delete().eq('category_id', id);
    const { error } = await supabase.from('kk_menu_categories').delete().eq('id', id);
    if (error) throw error;
  },
  async deleteProduct(id: string) {
    if (!supabase) return;
    const { error } = await supabase.from('kk_products').delete().eq('id', id);
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
      in_stock: p.inStock !== false,
      sort_order: p.order,
    });
    if (error) throw error;
  },
  async setProductInStock(productId: string, inStock: boolean): Promise<void> {
    if (!supabase) throw new Error('Supabase is not configured.');
    const { error } = await supabase.rpc('kk_set_product_in_stock', {
      p_product_id: productId,
      p_in_stock: inStock,
    });
    if (error) throw error;
  },
  async fetchMerch(): Promise<{ categories: MerchCategory[]; products: MerchProduct[] }> {
    if (!supabase) return { categories: [], products: [] };
    const [catRes, prodRes] = await Promise.all([
      supabase.from('kk_merch_categories').select('*').order('sort_order'),
      supabase.from('kk_merch_products').select('*').order('sort_order'),
    ]);
    if (catRes.error) throw catRes.error;
    if (prodRes.error) throw prodRes.error;
    return {
      categories: (catRes.data ?? []).map(mapMerchCategory),
      products: (prodRes.data ?? []).map(mapMerchProduct),
    };
  },
  async upsertMerchCategory(c: MerchCategory) {
    if (!supabase) return;
    const { error } = await supabase.from('kk_merch_categories').upsert({
      id: c.id,
      name: c.name,
      sort_order: c.order,
      visible: c.visible,
    });
    if (error) throw error;
  },
  async deleteMerchCategory(id: string) {
    if (!supabase) return;
    const { error } = await supabase.from('kk_merch_categories').delete().eq('id', id);
    if (error) throw error;
  },
  async upsertMerchProduct(p: MerchProduct) {
    if (!supabase) return;
    const { error } = await supabase.from('kk_merch_products').upsert({
      id: p.id,
      category_id: p.categoryId,
      name: p.name,
      description: p.description ?? null,
      base_price: p.basePrice,
      image: p.image ?? null,
      variants: p.variants ?? [],
      tags: p.tags ?? [],
      visible: p.visible,
      sort_order: p.order,
    });
    if (error) throw error;
  },
  async deleteMerchProduct(id: string) {
    if (!supabase) return;
    const { error } = await supabase.from('kk_merch_products').delete().eq('id', id);
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
    if (!supabase) throw new Error('Supabase is not configured.');
    const { data, error } = await supabase.rpc('kk_admin_delete_table', { p_table_id: id });
    if (error) {
      const { data: rows, error: delErr } = await supabase
        .from('kk_tables')
        .delete()
        .eq('id', id)
        .select('id');
      if (delErr) throw delErr;
      if (!rows?.length) {
        throw new Error('Table was not deleted. Sign in as admin and try again.');
      }
      return;
    }
    const row = (data ?? {}) as { ok?: boolean };
    if (!row.ok) {
      throw new Error('Table was not deleted. Sign in as admin and try again.');
    }
  },
  async fetchEvents(): Promise<Event[]> {
    if (!supabase) return [];
    const { data, error } = await supabase.from('kk_events').select('*').order('starts_at');
    if (error) throw error;
    return (data ?? []).map(mapEvent);
  },
  async upsertEvent(e: Event, sortOrder?: number) {
    if (!supabase) return;
    const images = e.images?.length ? e.images : e.cover ? [e.cover] : [];
    const { error } = await supabase.from('kk_events').upsert({
      id: e.id,
      branch_id: e.branchId ?? null,
      title: e.title,
      description: e.description ?? '',
      starts_at: new Date(e.startsAt).toISOString(),
      ends_at: e.endsAt ? new Date(e.endsAt).toISOString() : null,
      cover: images[0] ?? e.cover ?? null,
      images,
      cta: e.cta ?? null,
      visible: e.visible,
      highlight: e.highlight ?? false,
      signup_enabled: e.signupEnabled ?? false,
      signup_opens_at: e.signupOpensAt ? new Date(e.signupOpensAt).toISOString() : null,
      signup_closes_at: e.signupClosesAt ? new Date(e.signupClosesAt).toISOString() : null,
      max_signups: e.maxSignups ?? null,
      signup_form_id: e.signupFormId ?? null,
      ...(sortOrder !== undefined ? { sort_order: sortOrder } : {}),
    });
    if (error) throw error;
  },
  async fetchEventForms(): Promise<EventFormTemplate[]> {
    if (!supabase) return [];
    const { data, error } = await supabase.from('kk_event_forms').select('*').order('name');
    if (error) throw error;
    return (data ?? []).map(mapEventForm);
  },
  async fetchEventForm(id: string): Promise<EventFormTemplate | null> {
    if (!supabase) return null;
    const { data, error } = await supabase.from('kk_event_forms').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data ? mapEventForm(data) : null;
  },
  async upsertEventForm(form: EventFormTemplate) {
    if (!supabase) throw new Error('Supabase is not configured.');
    const { error } = await supabase.from('kk_event_forms').upsert({
      id: form.id,
      name: form.name,
      description: form.description ?? '',
      fields: form.fields,
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
  },
  async deleteEventForm(id: string) {
    if (!supabase) throw new Error('Supabase is not configured.');
    const { error } = await supabase.from('kk_event_forms').delete().eq('id', id);
    if (error) throw error;
  },
  async fetchEventRegistrationCounts(): Promise<Record<string, number>> {
    if (!supabase) return {};
    const { data, error } = await supabase.from('kk_event_registrations').select('event_id');
    if (error) throw error;
    const counts: Record<string, number> = {};
    for (const row of data ?? []) {
      const id = row.event_id as string;
      counts[id] = (counts[id] ?? 0) + 1;
    }
    return counts;
  },
  async fetchEventRegistrations(eventId: string): Promise<EventRegistration[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('kk_event_registrations')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapEventRegistration);
  },
  async fetchAllEventRegistrations(): Promise<EventRegistration[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('kk_event_registrations')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapEventRegistration);
  },
  async registerForEvent(input: {
    id: string;
    eventId: string;
    contactName: string;
    contactEmail: string;
    contactPhone: string;
    customAnswers?: Record<string, string | boolean | number>;
    answers?: Record<string, string | boolean | number>;
  }): Promise<EventRegistration> {
    if (!supabase) throw new Error('Supabase is not configured.');
    const { data, error } = await supabase.rpc('kk_register_for_event', {
      payload: {
        id: input.id,
        event_id: input.eventId,
        contact_name: input.contactName.trim(),
        contact_email: input.contactEmail.trim().toLowerCase(),
        contact_phone: input.contactPhone,
        answers: input.answers ?? {
          ...(input.customAnswers ?? {}),
        },
      },
    });
    if (error) throw error;
    const row = (data ?? {}) as Record<string, unknown>;
    return {
      id: String(row.id ?? input.id),
      eventId: input.eventId,
      contactName: input.contactName.trim(),
      contactEmail: input.contactEmail.trim().toLowerCase(),
      contactPhone: input.contactPhone,
      customAnswers: input.customAnswers,
      createdAt: String(row.created_at ?? new Date().toISOString()),
    };
  },
  async deleteEvent(id: string) {
    if (!supabase) return;
    const { error } = await supabase.from('kk_events').delete().eq('id', id);
    if (error) throw error;
  },
  async fetchBookings(): Promise<BoothBooking[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('kk_booth_bookings')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapBooking);
  },
  buildPlaceBookingPayload(b: BoothBooking) {
    return {
      id: b.id,
      branch_id: b.branchId ?? null,
      contact_name: b.contactName,
      contact_email: b.contactEmail,
      contact_phone: b.contactPhone,
      event_name: b.eventName,
      occasion: b.occasion,
      guest_count: b.guestCount,
      event_date: new Date(b.eventDate).toISOString(),
      starts_at: new Date(b.startsAt).toISOString(),
      ends_at: new Date(b.endsAt).toISOString(),
      package_id: b.packageId,
      package_name_snapshot: b.packageNameSnapshot,
      package_base_price_snapshot: b.packageBasePriceSnapshot,
      selected_addons: b.selectedAddons ?? [],
      special_requests: b.specialRequests ?? null,
      estimate_snapshot: b.estimateSnapshot ?? {},
    };
  },
  /** Server-validated booking submission (replaces direct table INSERT). */
  async placeBooking(b: BoothBooking): Promise<BoothBooking> {
    if (!supabase) return b;
    const { data, error } = await supabase.rpc('kk_place_booth_booking', {
      payload: orderingRepo.buildPlaceBookingPayload(b),
    });
    if (error) throw error;
    const row = (data ?? {}) as Record<string, unknown>;
    return {
      ...b,
      shortCode: String(row.short_code ?? b.shortCode),
      customerId: (row.customer_id as string | null) ?? b.customerId,
      status: (row.status as BoothBookingStatus) ?? b.status,
      createdAt: String(row.created_at ?? b.createdAt),
      updatedAt: String(row.updated_at ?? b.updatedAt),
    };
  },
  async patchBooking(id: string, patch: Partial<BoothBooking>) {
    if (!supabase) return;
    const dbPatch: Record<string, unknown> = {};
    if (patch.status !== undefined) dbPatch.status = patch.status;
    if (patch.assignedStaffId !== undefined) dbPatch.assigned_staff_id = patch.assignedStaffId ?? null;
    if (patch.finalQuote !== undefined) dbPatch.final_quote = patch.finalQuote ?? null;
    if (patch.quoteNotes !== undefined) dbPatch.quote_notes = patch.quoteNotes ?? null;
    if (patch.quotedAt !== undefined) dbPatch.quoted_at = patch.quotedAt ?? null;
    if (patch.internalNotes !== undefined) dbPatch.internal_notes = patch.internalNotes ?? null;
    if (Object.keys(dbPatch).length === 0) return;
    const { error } = await supabase.from('kk_booth_bookings').update(dbPatch).eq('id', id);
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
  buildPlaceOrderPayload(o: Order, promoCode?: string) {
    return {
      id: o.id,
      channel: o.channel,
      branch_id: o.branchId,
      table_id: o.tableId ?? null,
      guest_name: o.guestName ?? null,
      payment_method: o.paymentMethod ?? null,
      payment_status: o.paymentStatus,
      status: o.status,
      promo_code: promoCode ?? null,
      loyalty_voucher_id: o.loyaltyVoucherId ?? null,
      loyalty_voucher_code: o.loyaltyVoucherCode ?? null,
      loyalty_discount_total: o.loyaltyDiscountTotal ?? null,
      items: o.items.map((it) => ({
        id: it.id,
        product_id: it.productId,
        product_name_snapshot: it.productNameSnapshot,
        item_type: it.itemType ?? 'coffee',
        size_id: it.sizeId ?? null,
        size_label_snapshot: it.sizeLabelSnapshot ?? null,
        milk_id: it.milkId ?? null,
        milk_label_snapshot: it.milkLabelSnapshot ?? null,
        temperature: it.temperature ?? null,
        merch_variants: it.merchVariants ?? [],
        notes: it.notes ?? null,
        qty: it.qty,
      })),
    };
  },

  /** Server-validated order insert (replaces direct table INSERT). */
  async placeOrder(o: Order, opts?: { promoCode?: string }): Promise<Order> {
    if (!supabase) return o;
    const { data, error } = await supabase.rpc('kk_place_order', {
      payload: orderingRepo.buildPlaceOrderPayload(o, opts?.promoCode),
    });
    if (error) throw error;
    const row = (data ?? {}) as Record<string, unknown>;
    return {
      ...o,
      shortCode: String(row.short_code ?? o.shortCode),
      subtotal: Number(row.subtotal ?? o.subtotal),
      modifiersTotal: Number(row.modifiers_total ?? o.modifiersTotal),
      tax: Number(row.tax ?? o.tax ?? 0),
      total: Number(row.total ?? o.total),
      loyaltyDiscountTotal:
        row.loyalty_discount_total != null ? Number(row.loyalty_discount_total) : o.loyaltyDiscountTotal,
      createdAt: String(row.created_at ?? o.createdAt),
      updatedAt: String(row.updated_at ?? o.updatedAt),
    };
  },

  async insertOrder(o: Order, opts?: { promoCode?: string }) {
    return this.placeOrder(o, opts);
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
      paymentMethod: row.payment_method ?? undefined,
      guestName: row.guest_name ?? undefined,
      total: Number(row.total ?? 0),
      hasPaymentProof: Boolean(row.has_payment_proof),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },
  async submitGuestPaymentProof(orderId: string, proofDataUrl: string): Promise<void> {
    if (!supabase) throw new Error('Supabase is not configured.');
    const { error } = await supabase.rpc('kk_submit_guest_payment_proof', {
      p_order_id: orderId,
      p_proof_data_url: proofDataUrl,
    });
    if (error) throw error;
  },
  async deleteOrder(id: string): Promise<void> {
    if (!supabase) throw new Error('Supabase is not configured.');
    const { error } = await supabase.rpc('kk_admin_delete_order', { p_order_id: id });
    if (error) throw error;
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
    if (Object.keys(dbPatch).length > 0) {
      dbPatch.updated_at = new Date().toISOString();
    }
    const { error } = await supabase.from('kk_orders').update(dbPatch).eq('id', id);
    if (error) throw error;
  },
  /**
   * Upload customer GCash proof to private storage. Returns a stable proof-storage: ref
   * (not a signed URL — those expire and cause 404s in admin/barista previews).
   */
  async uploadPaymentProof(orderId: string, file: File): Promise<string> {
    if (!supabase) throw new Error('Supabase is not configured.');
    const session = await authRepo.session();
    const userId = session?.user?.id;
    if (!userId) throw new Error('Sign in required for payment proof upload.');

    const prepared = await prepareGuestPaymentProof(file);
    if (prepared.ok === false) throw new Error(prepared.error);

    const path = customerProofObjectPath(userId, orderId);
    const blob = dataUrlToBlob(prepared.dataUrl);
    const upload = await supabase.storage.from(PAYMENT_PROOF_BUCKET).upload(path, blob, {
      upsert: true,
      contentType: 'image/jpeg',
    });
    if (upload.error) throw upload.error;

    const { data: meta, error: metaErr } = await supabase.storage.from(PAYMENT_PROOF_BUCKET).info(path);
    if (metaErr || !meta) {
      throw new Error('Proof upload could not be verified. Please try again.');
    }

    return formatProofStorageRef(path);
  },

  /** Anonymous guest proof via storage (fallback when data URL would be too large for RPC). */
  async uploadGuestPaymentProof(orderId: string, file: File): Promise<string> {
    if (!supabase) throw new Error('Supabase is not configured.');

    const prepared = await prepareGuestPaymentProof(file);
    if (prepared.ok === false) throw new Error(prepared.error);

    const path = guestProofObjectPath(orderId);
    const blob = dataUrlToBlob(prepared.dataUrl);
    const upload = await supabase.storage.from(PAYMENT_PROOF_BUCKET).upload(path, blob, {
      upsert: true,
      contentType: 'image/jpeg',
    });
    if (upload.error) throw upload.error;

    const { data: meta, error: metaErr } = await supabase.storage.from(PAYMENT_PROOF_BUCKET).info(path);
    if (metaErr || !meta) {
      throw new Error('Proof upload could not be verified. Please try again.');
    }

    return formatProofStorageRef(path);
  },
  async ensureMyProfile(name?: string): Promise<User> {
    if (!supabase) throw new Error('Supabase is not configured.');
    const { data, error } = await supabase.rpc('kk_ensure_my_profile', {
      p_name: name?.trim() || null,
    });
    if (error) throw error;
    return mapUser(data);
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
      phone: u.role === 'customer' ? (u.phone ?? null) : null,
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
    if (!supabase) throw new Error('Supabase is not configured.');
    const { error } = await supabase.from('kk_app_settings').upsert({
      id: true,
      tax_rate: settings.taxRate ?? 0,
      gcash_qr_image: settings.gcashQrImage?.trim() || null,
      order_hours: siteConfigFromSettings(settings),
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
  },
  /** Upload menu product photo to public storage; returns HTTPS URL for kk_products.image. */
  async uploadMenuProductImage(file: File, productId: string): Promise<string> {
    if (!supabase) throw new Error('Supabase is not configured.');
    if (!productId.trim()) throw new Error('Product id is required before uploading an image.');
    if (!file.type.startsWith('image/')) {
      throw new Error('Please choose an image file (PNG, JPG, WebP, etc.).');
    }
    if (file.size > 5_242_880) {
      throw new Error('Image must be 5 MB or smaller.');
    }
    const ext = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
    const safeExt = ['png', 'jpg', 'jpeg', 'webp', 'heic', 'heif'].includes(ext) ? ext : 'jpg';
    const path = `products/${productId}.${safeExt}`;
    const { error } = await supabase.storage.from('kado-menu-images').upload(path, file, {
      upsert: true,
      contentType: file.type || 'image/jpeg',
      cacheControl: '3600',
    });
    if (error) throw error;
    const { data } = supabase.storage.from('kado-menu-images').getPublicUrl(path);
    const url = data.publicUrl;
    if (!url) throw new Error('Could not get public URL for menu product image.');
    return url;
  },

  /** Upload shop GCash QR to public storage; returns HTTPS URL saved in kk_app_settings.gcash_qr_image. */
  async uploadGcashShopQr(file: File): Promise<string> {
    if (!supabase) throw new Error('Supabase is not configured.');
    if (!file.type.startsWith('image/')) {
      throw new Error('Please choose an image file (PNG, JPG, WebP, etc.).');
    }
    if (file.size > 2_097_152) {
      throw new Error('Image must be 2 MB or smaller.');
    }
    const ext = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'png';
    const safeExt = ['png', 'jpg', 'jpeg', 'webp', 'heic', 'heif'].includes(ext) ? ext : 'png';
    const path = `shop-gcash-qr.${safeExt}`;
    const { error } = await supabase.storage.from('kado-gcash-qr').upload(path, file, {
      upsert: true,
      contentType: file.type || 'image/png',
      cacheControl: '3600',
    });
    if (error) throw error;
    const { data } = supabase.storage.from('kado-gcash-qr').getPublicUrl(path);
    const url = data.publicUrl;
    if (!url) throw new Error('Could not get public URL for GCash QR.');
    return url;
  },
  /** Shared landing-page CMS content (admin-published, publicly readable). */
  async fetchLandingContent(): Promise<unknown | null> {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('kk_app_settings')
      .select('landing_content')
      .eq('id', true)
      .maybeSingle();
    if (error || !data) return null;
    return (data as { landing_content?: unknown }).landing_content ?? null;
  },
  async upsertLandingContent(content: unknown) {
    if (!supabase) return;
    const { error } = await supabase
      .from('kk_app_settings')
      .upsert({ id: true, landing_content: content });
    if (error) throw error;
  },
};
