import { supabase } from '../client';

export type PaymongoCheckoutResult = {
  checkoutUrl: string;
  checkoutSessionId: string;
  alreadyPaid?: boolean;
};

export type PaymongoVerifyResult = {
  paid: boolean;
  status?: string;
  paymentId?: string | null;
  alreadyPaid?: boolean;
  reconciled?: boolean;
  sessionStatus?: string;
};

type FnPayload = {
  ok?: boolean;
  paid?: boolean;
  alreadyPaid?: boolean;
  checkoutUrl?: string;
  checkoutSessionId?: string;
  status?: string;
  paymentId?: string | null;
  reconciled?: boolean;
  sessionStatus?: string;
  message?: string;
};

/** Read JSON body from FunctionsHttpError so we don't lose "already paid" etc. */
async function invokePaymongoFn(
  name: 'kk-paymongo-checkout' | 'kk-paymongo-verify',
  body: Record<string, unknown>,
): Promise<FnPayload> {
  if (!supabase) throw new Error('Supabase is not configured.');

  const { data, error } = await supabase.functions.invoke(name, { body });

  if (!error) {
    return (data ?? {}) as FnPayload;
  }

  const ctx = (error as { context?: Response }).context;
  if (ctx) {
    try {
      const payload = (await ctx.clone().json()) as FnPayload;
      if (payload && typeof payload === 'object') return payload;
    } catch {
      // fall through
    }
  }

  throw new Error(error.message || 'Edge Function returned a non-2xx status code');
}

function isAlreadyPaidPayload(payload: FnPayload): boolean {
  if (payload.alreadyPaid || payload.paid) return true;
  return /already paid/i.test(String(payload.message ?? ''));
}

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
  const payload = await invokePaymongoFn('kk-paymongo-checkout', {
    orderId: input.orderId,
    shortCode: input.shortCode ?? null,
    successUrl: input.successUrl ?? null,
    cancelUrl: input.cancelUrl ?? null,
  });

  if (isAlreadyPaidPayload(payload)) {
    return {
      checkoutUrl: '',
      checkoutSessionId: '',
      alreadyPaid: true,
    };
  }

  if (!payload.ok || !payload.checkoutUrl || !payload.checkoutSessionId) {
    throw new Error(payload.message || 'PayMongo checkout was not created.');
  }

  return {
    checkoutUrl: payload.checkoutUrl,
    checkoutSessionId: payload.checkoutSessionId,
  };
}

/** Poll PayMongo for session payment and reconcile order if webhook lagged. */
export async function verifyPaymongoCheckout(input: {
  orderId: string;
  shortCode?: string;
}): Promise<PaymongoVerifyResult> {
  const payload = await invokePaymongoFn('kk-paymongo-verify', {
    orderId: input.orderId,
    shortCode: input.shortCode ?? null,
  });

  if (isAlreadyPaidPayload(payload)) {
    return {
      paid: true,
      status: payload.status,
      paymentId: payload.paymentId,
      alreadyPaid: true,
      reconciled: payload.reconciled,
      sessionStatus: payload.sessionStatus,
    };
  }

  if (!payload.ok) {
    throw new Error(payload.message || 'PayMongo verify failed.');
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
