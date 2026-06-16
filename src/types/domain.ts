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
  /** Manual availability — false = shown on menu but not orderable. */
  inStock?: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export type OrderChannel = 'online' | 'dine-in' | 'takeout' | 'pos' | 'merch';

export type PaymentMethod = 'gcash-qr' | 'pay-at-store' | 'paymongo';

export type PaymentStatus = 'unpaid' | 'proof_submitted' | 'paid' | 'refunded';

/** Kitchen / fulfillment status (separate from payment). */
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
  itemType?: 'coffee' | 'merch' | 'mix-match';
  /** When set with a mix-match drink, server applies bundle discount + cookie line. */
  mixMatchCookieId?: string;
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
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  modifiersTotal: number;
  /** Sales tax amount (PHP), from admin settings tax rate */
  tax?: number;
  total: number;
  /** Drink stamps granted when status became completed (undefined = not processed yet). */
  loyaltyStampsAwarded?: number;
  /** Redeemed Kado Circle voucher at checkout. */
  loyaltyVoucherId?: string;
  loyaltyVoucherCode?: string;
  loyaltyDiscountTotal?: number;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  /** E.164 Philippine mobile (+639XXXXXXXXX) — SMS-ready */
  phone?: string;
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
  /** @deprecated Use images[0] — kept for legacy rows. */
  cover?: string;
  images?: string[];
  cta?: { label: string; href: string };
  visible: boolean;
  highlight?: boolean;
  signupEnabled?: boolean;
  signupOpensAt?: string;
  signupClosesAt?: string;
  maxSignups?: number;
  /** Reusable registration form template (kk_event_forms). */
  signupFormId?: string | null;
}

export interface EventRegistration {
  id: string;
  eventId: string;
  customerId?: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  customAnswers?: Record<string, string | boolean | number>;
  createdAt: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  publishedAt: string;
  readMinutes: number;
  imageUrl: string;
  imageAlt: string;
  body: string[];
  visible: boolean;
  sortOrder: number;
}

export interface TakeoutQr {
  id: string;
  branchId: string;
  /** Canonical URL: /order/takeout?b=<branchSlug> */
  qrPayload: string;
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

// ─── Promo Codes ─────────────────────────────────────────────────────────────

/** Admin-created promotional codes customers enter at checkout. */
export type PromoCodeType = 'percent' | 'fixed' | 'free_drink' | 'bogo_drink';

export interface PromoCode {
  id: string;
  /** Uppercase code the customer types, e.g. KADO10 */
  code: string;
  name: string;
  description?: string;
  type: PromoCodeType;
  /** % for percent; ₱ amount for fixed; ignored for free_drink / bogo_drink */
  value: number;
  /** Minimum cart subtotal (₱) before tax required to use this code */
  minOrderAmount: number;
  /** Total redemption cap across all customers; undefined = unlimited */
  maxUses?: number;
  /** Cumulative uses counter (DB-incremented) */
  uses: number;
  /** How many times a single customer can use this code */
  perCustomer: number;
  active: boolean;
  startsAt?: string;
  expiresAt?: string;
  /** null = valid for all branches */
  branchId?: string;
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
  /** NULL/undefined = redeemable at any branch. */
  branchId?: string | null;
}

export interface LoyaltyConfig {
  rewards: LoyaltyReward[];
}

export type LoyaltyVoucherStatus = 'active' | 'redeemed' | 'expired';

/** Claimed reward — spend stamps to unlock, apply at checkout on eligible orders. */
export interface LoyaltyVoucher {
  id: string;
  /** Short code shown to customer and staff (e.g. KK-VCH-4821). */
  code: string;
  customerId: string;
  rewardId: string;
  rewardNameSnapshot: string;
  rewardType: LoyaltyRewardType;
  rewardValue?: number;
  stampsSpent: number;
  /** Copied from reward at claim; NULL = all branches. */
  branchId?: string | null;
  status: LoyaltyVoucherStatus;
  createdAt: string;
  redeemedAt?: string;
  redeemedOrderId?: string;
  expiresAt?: string;
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
  branchId?: string;
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
  /** Optional — event booking is brand-wide, not tied to a single branch. */
  branchId?: string;
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
