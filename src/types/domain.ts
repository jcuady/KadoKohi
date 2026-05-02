/** DB-ready domain types — mirror 1:1 to future API / Postgres tables. */

export type Role = 'guest' | 'customer' | 'barista' | 'staff' | 'admin';

export type BranchStatus = 'active' | 'coming_soon';

export type BranchHoursDay = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export interface BranchHours {
  day: BranchHoursDay;
  open: string;
  close: string;
}

export interface Branch {
  id: string;
  slug: string;
  name: string;
  address: string;
  city: string;
  status: BranchStatus;
  hours: BranchHours[];
  heroImage?: string;
  lat?: number;
  lng?: number;
  createdAt: string;
  updatedAt: string;
}

export interface MenuCategory {
  id: string;
  branchId?: string | null;
  name: string;
  order: number;
  visible: boolean;
}

export interface ProductSize {
  id: string;
  label: string;
  priceDelta: number;
}

export type ProductTemperature = 'hot' | 'iced' | 'both';

export interface MilkOption {
  id: string;
  label: string;
  priceDelta: number;
}

export interface ProductCustomField {
  id: string;
  key: string;
  label: string;
  value: string;
}

export interface Product {
  id: string;
  categoryId: string;
  branchId?: string | null;
  name: string;
  description?: string;
  basePrice: number;
  image?: string;
  temperature: ProductTemperature;
  sizes: ProductSize[];
  milks: MilkOption[];
  tags?: string[];
  customFields?: ProductCustomField[];
  visible: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export type OrderChannel = 'online' | 'dine-in' | 'takeout' | 'pos' | 'merch';

export type PaymentMethod = 'pay-at-store' | 'paymongo';

export type OrderStatus =
  | 'pending'
  | 'accepted'
  | 'preparing'
  | 'ready'
  | 'served'
  | 'completed'
  | 'cancelled';

export interface OrderItemVariantSnapshot {
  groupName: string;
  optionLabel: string;
  priceDelta: number;
}

export interface OrderItem {
  id: string;
  productId: string;
  productNameSnapshot: string;
  itemType?: 'coffee' | 'merch';
  sizeId?: string;
  sizeLabelSnapshot?: string;
  milkId?: string;
  milkLabelSnapshot?: string;
  temperature?: 'hot' | 'iced';
  merchVariants?: OrderItemVariantSnapshot[];
  notes?: string;
  unitPrice: number;
  qty: number;
  lineTotal: number;
}

export interface Order {
  id: string;
  shortCode: string;
  channel: OrderChannel;
  branchId: string;
  tableId?: string;
  customerId?: string;
  guestName?: string;
  staffId?: string;
  paymentMethod?: PaymentMethod;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  modifiersTotal: number;
  /** Sales tax amount (PHP), from admin settings tax rate */
  tax?: number;
  total: number;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  branchId?: string;
  loyaltyStamps?: number;
  createdAt: string;
}

export interface Table {
  id: string;
  branchId: string;
  code: string;
  label: string;
  qrPayload: string;
  active: boolean;
}

export interface Event {
  id: string;
  branchId?: string | null;
  title: string;
  description: string;
  startsAt: string;
  endsAt?: string;
  cover?: string;
  cta?: { label: string; href: string };
  visible: boolean;
  highlight?: boolean;
}

export interface TakeoutQr {
  id: string;
  branchId: string;
  /** Canonical URL: /order/takeout?b=<branchSlug> */
  qrPayload: string;
}

export type SectionType = 'hero' | 'image-text' | 'gallery' | 'cta' | 'stat' | 'faq';

export interface CustomSection {
  id: string;
  page: 'home';
  type: SectionType;
  title?: string;
  body?: string;
  image?: string;
  ctaLabel?: string;
  ctaHref?: string;
  order: number;
  visible: boolean;
}

// ─── Merch ──────────────────────────────────────────────────────────────────

export interface MerchCategory {
  id: string;
  name: string;
  order: number;
  visible: boolean;
}

export interface MerchVariantOption {
  id: string;
  label: string;
  priceDelta: number;
  stock?: number;
}

export interface MerchVariantGroup {
  id: string;
  name: string;
  required: boolean;
  options: MerchVariantOption[];
}

export interface MerchProduct {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  basePrice: number;
  image?: string;
  variants: MerchVariantGroup[];
  tags?: string[];
  visible: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Loyalty ────────────────────────────────────────────────────────────────

export type LoyaltyRewardType = 'free_drink' | 'discount_percent' | 'discount_fixed' | 'free_merch' | 'custom';

export interface LoyaltyReward {
  id: string;
  name: string;
  description?: string;
  stampsRequired: number;
  type: LoyaltyRewardType;
  value?: number;
  active: boolean;
}

export interface LoyaltyConfig {
  stampsPerOrder: number;
  stampOnMerch: boolean;
  rewards: LoyaltyReward[];
}
