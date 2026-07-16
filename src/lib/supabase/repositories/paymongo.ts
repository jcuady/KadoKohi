import { supabase } from '../client';

export type PaymongoCheckoutResult = {
  checkoutUrl: string;
  checkoutSessionId: string;
};

/**
 * Create a PayMongo hosted Checkout Session (QR Ph) for an unpaid order.
 * Secret key stays on the edge function — never call PayMongo from the browser.
 */
export async function createPaymongoCheckout(input: {
  orderId: string;
  shortCode?: string;
  successUrl?: string;
  cancelUrl?: string;
}): Promise<PaymongoCheckoutResult> {
  if (!supabase) throw new Error('Supabase is not configured.');

  const { data, error } = await supabase.functions.invoke('kk-paymongo-checkout', {
    body: {
      orderId: input.orderId,
      shortCode: input.shortCode ?? null,
      successUrl: input.successUrl ?? null,
      cancelUrl: input.cancelUrl ?? null,
    },
  });

  if (error) throw new Error(error.message || 'Could not start PayMongo checkout.');

  const payload = data as {
    ok?: boolean;
    checkoutUrl?: string;
    checkoutSessionId?: string;
    message?: string;
  } | null;

  if (!payload?.ok || !payload.checkoutUrl || !payload.checkoutSessionId) {
    throw new Error(payload?.message || 'PayMongo checkout was not created.');
  }

  return {
    checkoutUrl: payload.checkoutUrl,
    checkoutSessionId: payload.checkoutSessionId,
  };
}

export type PaymongoVerifyResult = {
  paid: boolean;
  status?: string;
  paymentId?: string | null;
  alreadyPaid?: boolean;
  reconciled?: boolean;
  sessionStatus?: string;
};

/** Poll PayMongo for session payment and reconcile order if webhook lagged. */
export async function verifyPaymongoCheckout(input: {
  orderId: string;
  shortCode?: string;
}): Promise<PaymongoVerifyResult> {
  if (!supabase) throw new Error('Supabase is not configured.');

  const { data, error } = await supabase.functions.invoke('kk-paymongo-verify', {
    body: {
      orderId: input.orderId,
      shortCode: input.shortCode ?? null,
    },
  });

  if (error) throw new Error(error.message || 'Could not verify PayMongo payment.');

  const payload = data as {
    ok?: boolean;
    paid?: boolean;
    status?: string;
    paymentId?: string | null;
    alreadyPaid?: boolean;
    reconciled?: boolean;
    sessionStatus?: string;
    message?: string;
  } | null;

  if (!payload?.ok) {
    throw new Error(payload?.message || 'PayMongo verify failed.');
  }

  return {
    paid: Boolean(payload.paid),
    status: payload.status,
    paymentId: payload.paymentId,
    alreadyPaid: payload.alreadyPaid,
    reconciled: payload.reconciled,
    sessionStatus: payload.sessionStatus,
  };
}
