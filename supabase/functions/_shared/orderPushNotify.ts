/** Invoke kk-send-push with the service role (server → server). Best-effort. */

export type ServerPushTarget = {
  userId?: string;
  branchId?: string;
  roles?: string[];
};

export async function invokeSendPush(input: {
  targets: ServerPushTarget[];
  title: string;
  body: string;
  url?: string;
  tag?: string;
  kind?: string;
}): Promise<void> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim();
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();
  if (!supabaseUrl || !serviceKey) return;

  try {
    await fetch(`${supabaseUrl}/functions/v1/kk-send-push`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        apikey: serviceKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });
  } catch (err) {
    console.error("invokeSendPush failed", err);
  }
}

/** After PayMongo marks an order paid — notify the customer (inbox + web push). */
export async function notifyCustomerPaymongoPaid(order: {
  id: string;
  short_code?: string | null;
  customer_id?: string | null;
  status?: string | null;
  channel?: string | null;
}): Promise<void> {
  if (!order.customer_id) return;
  const short = String(order.short_code ?? "your order");
  const isMerch = order.channel === "merch";
  const accepted = order.status === "accepted" || order.status === "pending";
  const title = isMerch
    ? accepted
      ? "Merch order confirmed"
      : "Payment received"
    : accepted
      ? "Order confirmed"
      : "Payment received";
  const body = isMerch
    ? accepted
      ? `Merch order ${short} is confirmed. We'll pack it shortly.`
      : `Payment received for merch order ${short}.`
    : accepted
      ? `Order ${short} is confirmed and queued. We'll start preparing shortly.`
      : `Payment received for order ${short}.`;

  await invokeSendPush({
    targets: [{ userId: order.customer_id }],
    title,
    body,
    url: "/account/orders",
    tag: `order-${order.id}`,
    kind: "order",
  });
}
