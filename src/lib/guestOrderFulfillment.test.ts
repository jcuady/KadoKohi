import { describe, expect, it } from 'vitest';
import { fulfillmentHeadline, fulfillmentStepsFor } from '../components/order/GuestOrderStatusTimeline';

describe('fulfillmentHeadline', () => {
  it('changes copy when drink is ready', () => {
    const h = fulfillmentHeadline('ready');
    expect(h.title).toMatch(/ready/i);
    expect(h.trail).toMatch(/counter/i);
  });

  it('defaults to salamat after payment', () => {
    expect(fulfillmentHeadline('accepted').title).toMatch(/Salamat/i);
  });
});

describe('fulfillmentStepsFor', () => {
  it('uses payment-verified label for gateway online orders', () => {
    const steps = fulfillmentStepsFor('online', 'paymongo');
    expect(steps.map((s) => s.label)).toContain('Payment verified');
    expect(steps.map((s) => s.status)).not.toContain('served');
  });

  it('includes served for dine-in', () => {
    expect(fulfillmentStepsFor('dine-in', 'pay-at-store').map((s) => s.status)).toContain('served');
  });
});
