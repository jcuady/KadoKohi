import { supabase } from './supabase/client';

export const PAYMENT_PROOF_BUCKET = 'kado-payment-proofs';
/** Persisted in kk_orders.payment_proof_image — never store expiring signed URLs. */
export const PROOF_STORAGE_PREFIX = 'proof-storage:';

export function formatProofStorageRef(objectPath: string): string {
  return `${PROOF_STORAGE_PREFIX}${objectPath}`;
}

export function isDataUrlProof(ref: string): boolean {
  return ref.startsWith('data:image/');
}

export function isProofStorageRef(ref: string): boolean {
  return ref.startsWith(PROOF_STORAGE_PREFIX);
}

/** Extract object path from proof-storage ref or legacy signed/public storage URLs. */
export function extractPaymentProofObjectPath(ref: string | undefined | null): string | null {
  if (!ref?.trim()) return null;
  const trimmed = ref.trim();
  if (isProofStorageRef(trimmed)) {
    return trimmed.slice(PROOF_STORAGE_PREFIX.length);
  }
  if (isDataUrlProof(trimmed)) return null;

  const signed = trimmed.match(/\/object\/sign\/kado-payment-proofs\/([^?]+)/i);
  if (signed?.[1]) return decodeURIComponent(signed[1]);

  const publicUrl = trimmed.match(/\/storage\/v1\/object\/public\/kado-payment-proofs\/([^?]+)/i);
  if (publicUrl?.[1]) return decodeURIComponent(publicUrl[1]);

  const authenticated = trimmed.match(/\/storage\/v1\/object\/authenticated\/kado-payment-proofs\/([^?]+)/i);
  if (authenticated?.[1]) return decodeURIComponent(authenticated[1]);

  return null;
}

export function customerProofObjectPath(userId: string, orderId: string): string {
  return `${userId}/${orderId}-proof.jpg`;
}

export function guestProofObjectPath(orderId: string): string {
  return `guest/${orderId}/proof.jpg`;
}

/** Resolve a proof reference to a URL suitable for <img src> (data URL or fresh signed URL). */
export async function resolvePaymentProofDisplayUrl(
  ref: string | undefined | null,
): Promise<string | null> {
  if (!ref?.trim()) return null;
  const trimmed = ref.trim();
  if (isDataUrlProof(trimmed)) return trimmed;

  const objectPath = extractPaymentProofObjectPath(trimmed);
  if (!objectPath) {
    // Legacy full URL without parseable path — use as-is (may 404 if expired or missing).
    return trimmed.startsWith('http') ? trimmed : null;
  }

  if (!supabase) return null;
  const { data, error } = await supabase.storage
    .from(PAYMENT_PROOF_BUCKET)
    .createSignedUrl(objectPath, 60 * 60 * 24);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(',');
  const mime = header.match(/data:([^;]+)/)?.[1] ?? 'image/jpeg';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}
