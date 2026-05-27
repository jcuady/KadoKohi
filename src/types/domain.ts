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

export type PaymentMethod = 'gcash-qr' | 'pay-at-store' | 'paymongo';

export type OrderStatus =
  | 'pending_payment'
  | 'paid'
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
  /** Customer-uploaded GCash payment screenshot (data URL). */
  paymentProofImage?: string;
  paymentProofUploadedAt?: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  modifiersTotal: number;
  /** Sales tax amount (PHP), from admin settings tax rate */
  tax?: number;
  total: number;
  /** Drink stamps granted when status became completed (undefined = not processed yet). */
  loyaltyStampsAwarded?: number;
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
  rewards: LoyaltyReward[];
}

// ─── Booth Booking ───────────────────────────────────────────────────────────

export type BoothAddonPricingType = 'fixed' | 'per_head' | 'per_hour';

export interface BoothPackage {
  id: string;
  branchId?: string | null;
  name: string;
  description?: string;
  capacity: number;
  durationHours: number;
  basePrice: number;
  inclusions: string[];
  image?: string;
  visible: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface BoothAddon {
  id: string;
  branchId?: string | null;
  name: string;
  description?: string;
  pricingType: BoothAddonPricingType;
  price: number;
  unitLabel?: string;
  visible: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface BookingShowcaseMedia {
  id: string;
  title: string;
  caption?: string;
  image: string;
  tags?: string[];
  visible: boolean;
  order: number;
}

export type BookingEstimateLineSourceType = 'package' | 'addon' | 'service' | 'custom';

export interface BookingEstimateLineItem {
  id: string;
  sourceType: BookingEstimateLineSourceType;
  sourceId?: string;
  labelSnapshot: string;
  descriptionSnapshot?: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
}

export interface BookingEstimate {
  id: string;
  shortCode: string;
  branchId: string;
  lineItems: BookingEstimateLineItem[];
  subtotal: number;
  tax?: number;
  total: number;
  assumptions?: string[];
  notes?: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  validUntil?: string;
  createdAt: string;
  updatedAt: string;
}

export type BoothBookingOccasion =
  | 'birthday'
  | 'wedding'
  | 'corporate'
  | 'private_party'
  | 'engagement'
  | 'other';

export type BoothBookingStatus =
  | 'submitted'
  | 'under_review'
  | 'quoted'
  | 'awaiting_confirmation'
  | 'confirmed'
  | 'declined'
  | 'cancelled'
  | 'completed';

export interface BoothBookingSelectedAddonSnapshot {
  addonId: string;
  addonNameSnapshot: string;
  pricingType: BoothAddonPricingType;
  qty: number;
  unitPrice: number;
  lineTotal: number;
}

export interface BoothBooking {
  id: string;
  shortCode: string;
  branchId: string;
  customerId?: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  eventName: string;
  occasion: BoothBookingOccasion;
  guestCount: number;
  eventDate: string;
  startsAt: string;
  endsAt: string;
  packageId: string;
  packageNameSnapshot: string;
  packageBasePriceSnapshot: number;
  selectedAddons: BoothBookingSelectedAddonSnapshot[];
  specialRequests?: string;
  /** Customer-submitted estimate at booking time (not final). */
  estimateSnapshot: BookingEstimate;
  /** Admin official quote — shown to customer when set. */
  finalQuote?: BookingEstimate;
  quoteNotes?: string;
  quotedAt?: string;
  status: BoothBookingStatus;
  assignedStaffId?: string;
  internalNotes?: string;
  createdAt: string;
  updatedAt: string;
}
