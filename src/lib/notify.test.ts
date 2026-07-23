import { describe, expect, it } from 'vitest';
import type { BoothBooking, Order } from '../types/domain';
import {
  buildBaristaNewOrderPayload,
  buildBaristaProofPayload,
  buildBoothStatusPayload,
  buildBoothStaffNewPayload,
  buildBoothStaffProofPayload,
  buildCustomerOrderStatusPayload,
  buildCustomerPendingPaymentPayload,
  buildCustomerProofPayload,
  buildEventRegistrationCustomerPayload,
  buildEventRegistrationStaffPayload,
  orderNotifyFamily,
  staffOrderDeepLink,
} from './notify';

function baseOrder(over: Partial<Order> = {}): Order {
  return {
    id: 'ord-1',
    shortCode: 'KK-1001',
    channel: 'online',
    branchId: 'branch_marikina',
    status: 'pending',
    paymentStatus: 'paid',
    paymentMethod: 'pay-at-store',
    customerId: 'cust-1',
    items: [
      {
        id: 'li-1',
        productId: 'p1',
        productNameSnapshot: 'Cafe Latte',
        unitPrice: 150,
        qty: 1,
        lineTotal: 150,
      },
    ],
    subtotal: 150,
    modifiersTotal: 0,
    tax: 0,
    total: 150,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...over,
  };
}

function baseBooking(over: Partial<BoothBooking> = {}): BoothBooking {
  return {
    id: 'bk-1',
    shortCode: 'BK-2001',
    bookingKind: 'coffee-cart',
    contactName: 'Ana',
    contactEmail: 'ana@example.com',
    contactPhone: '09171234567',
    eventName: "Ana's 30th",
    occasion: 'birthday',
    guestCount: 20,
    eventDate: '2026-08-01',
    startsAt: '14:00',
    endsAt: '18:00',
    packageId: 'pkg-1',
    packageNameSnapshot: 'Classic',
    packageBasePriceSnapshot: 5000,
    selectedAddons: [],
    estimateSnapshot: {
      id: 'est-1',
      shortCode: 'BK-2001',
      lineItems: [],
      subtotal: 5000,
      total: 5000,
      status: 'draft',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    status: 'submitted',
    paymentMethod: 'gcash-or-bank',
    paymentStatus: 'unpaid',
    customerId: 'cust-1',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...over,
  };
}

describe('orderNotifyFamily', () => {
  it('classifies merch channel as merch', () => {
    expect(orderNotifyFamily(baseOrder({ channel: 'merch' }))).toBe('merch');
  });

  it('classifies all-merch items as merch even on online', () => {
    expect(
      orderNotifyFamily(
        baseOrder({
          channel: 'online',
          items: [
            {
              id: 'li-m',
              productId: 'm1',
              productNameSnapshot: 'Tote',
              itemType: 'merch',
              unitPrice: 499,
              qty: 1,
              lineTotal: 499,
            },
          ],
        }),
      ),
    ).toBe('merch');
  });

  it('classifies coffee/pastry/mix-match as food', () => {
    expect(orderNotifyFamily(baseOrder())).toBe('food');
    expect(
      orderNotifyFamily(
        baseOrder({
          items: [
            {
              id: 'li-p',
              productId: 'pastry-1',
              productNameSnapshot: 'Croissant',
              unitPrice: 90,
              qty: 1,
              lineTotal: 90,
            },
          ],
        }),
      ),
    ).toBe('food');
  });
});

describe('staffOrderDeepLink', () => {
  it('routes merch to staff merch queue', () => {
    expect(staffOrderDeepLink(baseOrder({ channel: 'merch' }))).toBe('/staff/merch');
  });

  it('routes food channels to barista board', () => {
    expect(staffOrderDeepLink(baseOrder({ channel: 'online' }))).toBe('/barista');
    expect(staffOrderDeepLink(baseOrder({ channel: 'takeout' }))).toBe('/barista');
  });
});

describe('buildCustomerOrderStatusPayload', () => {
  it('skips guests without customerId', () => {
    expect(buildCustomerOrderStatusPayload(baseOrder({ customerId: undefined }), 'accepted')).toBeNull();
  });

  it('uses food copy that is not brew-only for preparing', () => {
    const p = buildCustomerOrderStatusPayload(baseOrder(), 'preparing');
    expect(p).not.toBeNull();
    expect(p!.title.toLowerCase()).not.toContain('brew');
    expect(p!.body.toLowerCase()).not.toContain('brew');
    expect(p!.kind).toBe('order');
    expect(p!.targets).toEqual([{ userId: 'cust-1' }]);
  });

  it('uses merch packing language for merch preparing/ready', () => {
    const preparing = buildCustomerOrderStatusPayload(baseOrder({ channel: 'merch' }), 'preparing');
    const ready = buildCustomerOrderStatusPayload(baseOrder({ channel: 'merch' }), 'ready');
    expect(preparing!.title.toLowerCase()).toMatch(/pack|prepar/);
    expect(ready!.body.toLowerCase()).toMatch(/pickup|collect|ready/);
    expect(preparing!.body.toLowerCase()).not.toContain('brew');
  });

  it('sends unpaid gateway orders to checkout url', () => {
    const p = buildCustomerOrderStatusPayload(
      baseOrder({ paymentMethod: 'paymongo', paymentStatus: 'unpaid', status: 'pending' }),
      'pending',
    );
    expect(p!.url).toBe('/checkout/ord-1');
  });

  it('mentions stamps on completed when awarded', () => {
    const p = buildCustomerOrderStatusPayload(
      baseOrder({ loyaltyStampsAwarded: 2, status: 'completed' }),
      'completed',
    );
    expect(p!.body).toContain('2');
    expect(p!.body.toLowerCase()).toContain('stamp');
  });
});

describe('buildCustomerPendingPaymentPayload / proof', () => {
  it('pending payment only for unpaid gateway methods', () => {
    expect(
      buildCustomerPendingPaymentPayload(
        baseOrder({ paymentMethod: 'pay-at-store', paymentStatus: 'unpaid' }),
      ),
    ).toBeNull();
    const p = buildCustomerPendingPaymentPayload(
      baseOrder({ paymentMethod: 'paymongo', paymentStatus: 'unpaid', total: 199.5 }),
    );
    expect(p!.title).toContain('QR Ph');
    expect(p!.body).toContain('199.50');
    expect(p!.kind).toBe('payment');
  });

  it('customer proof only for gcash-qr', () => {
    expect(
      buildCustomerProofPayload(baseOrder({ paymentMethod: 'paymongo' })),
    ).toBeNull();
    expect(
      buildCustomerProofPayload(baseOrder({ paymentMethod: 'gcash-qr' }))!.tag,
    ).toBe('proof-customer-ord-1');
  });
});

describe('barista payloads', () => {
  it('fans out to branch staff + admins with merch deep link', () => {
    const p = buildBaristaNewOrderPayload(baseOrder({ channel: 'merch', total: 499 }));
    expect(p.targets).toEqual([
      { branchId: 'branch_marikina', roles: ['barista', 'staff'] },
      { roles: ['admin'] },
    ]);
    expect(p.url).toBe('/staff/merch');
    expect(p.body).toContain('merch');
    expect(p.body).toContain('499.00');
  });

  it('proof payload links barista board for food channels', () => {
    const p = buildBaristaProofPayload(baseOrder({ channel: 'takeout' }));
    expect(p.url).toBe('/barista');
    expect(p.title.toLowerCase()).toContain('proof');
  });
});

describe('booth booking payloads', () => {
  it('notifies customer on quoted / confirmed / declined', () => {
    const quoted = buildBoothStatusPayload(baseBooking({ status: 'quoted' }), 'quoted');
    const confirmed = buildBoothStatusPayload(baseBooking({ status: 'confirmed' }), 'confirmed');
    const declined = buildBoothStatusPayload(baseBooking({ status: 'declined' }), 'declined');
    expect(quoted!.url).toBe('/account/booth');
    expect(confirmed!.title.toLowerCase()).toMatch(/confirm/);
    expect(declined!.kind).toBe('system');
    expect(buildBoothStatusPayload(baseBooking({ customerId: undefined }), 'quoted')).toBeNull();
  });

  it('notifies staff of new booking and payment proof', () => {
    const neu = buildBoothStaffNewPayload(baseBooking({ branchId: 'branch_greenhills' }));
    expect(neu.targets).toEqual([
      { branchId: 'branch_greenhills', roles: ['staff', 'barista'] },
      { roles: ['admin'] },
    ]);
    expect(neu.url).toBe('/admin/booth-bookings');
    const proof = buildBoothStaffProofPayload(baseBooking());
    expect(proof.title.toLowerCase()).toContain('proof');
  });
});

describe('event registration payloads', () => {
  it('confirms customer and alerts staff', () => {
    const customer = buildEventRegistrationCustomerPayload({
      customerId: 'cust-1',
      eventId: 'ev-1',
      eventTitle: 'Latte Art Night',
    });
    const staff = buildEventRegistrationStaffPayload({
      eventId: 'ev-1',
      eventTitle: 'Latte Art Night',
      contactName: 'Ana',
    });
    expect(customer.targets).toEqual([{ userId: 'cust-1' }]);
    expect(customer.body).toContain('Latte Art Night');
    expect(staff.targets).toEqual([{ roles: ['admin', 'staff'] }]);
    expect(staff.url).toBe('/admin/events');
  });
});
