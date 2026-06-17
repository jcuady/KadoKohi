import { useRef, useState } from 'react';
import { QrCode, ImageIcon, ExternalLink, Banknote, XCircle } from 'lucide-react';
import type { Order, OrderChannel, PaymentMethod } from '../../types/domain';
import { formatPhp } from '../../lib/money';
import { isGcashOrder } from '../../lib/orderStatus';
import { orderingRepo } from '../../lib/supabase/repositories/ordering';
import { prepareGuestPaymentProof, GUEST_PROOF_MAX_DATA_URL_CHARS } from '../../lib/compressPaymentProof';
import { formatOrderError } from '../../lib/validation';
import { usePaymentProofDisplayUrl } from '../../hooks/usePaymentProofDisplayUrl';
import { notifyBaristasProofSubmitted } from '../../lib/notify';
import { broadcastGuestOrderUpdate } from '../../lib/supabase/guestOrderTracking';

type Props = {
  orderId: string;
  shortCode: string;
  total: number;
  channel: OrderChannel;
  branchId?: string;
  paymentMethod?: PaymentMethod;
  paymentStatus: Order['paymentStatus'];
  proofPreview?: string | null;
  onProofSubmitted?: () => void;
  onViewQr: () => void;
  canSwitchToCash?: boolean;
  onSwitchToCash?: () => Promise<void>;
  onRequestCancel?: () => void;
};

const actionBtn =
  'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-kado-dark/15 bg-white px-4 py-2.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-kado-dark hover:border-kado-red/40 active:scale-[0.98] transition touch-manipulation w-full sm:w-auto';

const GCASH_PROOF_ACCEPT = 'image/png,image/jpeg,image/jpg,image/webp,image/heic,image/heif';

export default function GuestOrderPaymentBlock({
  orderId,
  shortCode,
  total,
  channel,
  branchId,
  paymentMethod,
  paymentStatus,
  proofPreview,
  onProofSubmitted,
  onViewQr,
  canSwitchToCash = false,
  onSwitchToCash,
  onRequestCancel,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [localProof, setLocalProof] = useState<string | null>(proofPreview ?? null);
  const proofRef = localProof ?? proofPreview;
  const { url: proofDisplayUrl } = usePaymentProofDisplayUrl(proofRef);

  const orderLike: Pick<Order, 'paymentMethod'> = { paymentMethod };
  if (!isGcashOrder(orderLike)) return null;

  const needsProof = paymentStatus === 'unpaid' || paymentStatus === 'proof_submitted';
  const notifyStaff = () => {
    void broadcastGuestOrderUpdate(orderId, {
      status: 'pending',
      paymentStatus: 'proof_submitted',
      updatedAt: new Date().toISOString(),
      shortCode,
    });
    notifyBaristasProofSubmitted({
      id: orderId,
      shortCode,
      channel,
      branchId: branchId ?? '',
      status: 'pending',
      paymentStatus: 'proof_submitted',
      items: [],
      subtotal: total,
      modifiersTotal: 0,
      tax: 0,
      total,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 8_000_000) {
      setError('Please use an image smaller than 8MB.');
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const prepared = await prepareGuestPaymentProof(file);
      if (prepared.ok === false) {
        setError(prepared.error);
        return;
      }

      let proofToStore = prepared.dataUrl;
      if (prepared.dataUrl.length > GUEST_PROOF_MAX_DATA_URL_CHARS) {
        proofToStore = await orderingRepo.uploadGuestPaymentProof(orderId, file);
      }

      await orderingRepo.submitGuestPaymentProof(orderId, proofToStore);
      setLocalProof(proofToStore);
      notifyStaff();
      onProofSubmitted?.();
    } catch (err) {
      setError(formatOrderError(err));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-kado-red/15 bg-white p-4 sm:p-5 space-y-3 mb-4">
      <p className="text-[10px] font-black uppercase tracking-widest text-kado-red">GCash payment</p>

      <div className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-2">
        <button type="button" onClick={onViewQr} className={actionBtn}>
          <QrCode className="w-4 h-4 shrink-0" />
          View QR
        </button>
        {(proofDisplayUrl || (proofRef && proofRef.startsWith('data:image/'))) && (
          <a
            href={proofDisplayUrl ?? proofRef ?? '#'}
            target="_blank"
            rel="noopener noreferrer"
            className={actionBtn}
          >
            <ExternalLink className="w-4 h-4 shrink-0" />
            Open proof
          </a>
        )}
      </div>

      {paymentStatus === 'unpaid' && (
        <p className="text-xs text-kado-dark/55 leading-relaxed">
          Pay {formatPhp(total)} via GCash, then upload your receipt screenshot.
        </p>
      )}

      {needsProof && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept={GCASH_PROOF_ACCEPT}
            className="hidden"
            onChange={(e) => {
              void handleFile(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="w-full min-h-[52px] flex items-center justify-center gap-2 rounded-xl bg-kado-red text-kado-cream py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider hover:bg-kado-dark disabled:opacity-50 transition-colors touch-manipulation active:scale-[0.99]"
          >
            <ImageIcon className="w-4 h-4 shrink-0" />
            {uploading
              ? 'Uploading…'
              : proofRef
                ? 'Replace screenshot'
                : 'Upload GCash screenshot'}
          </button>
        </>
      )}

      {proofRef && (proofDisplayUrl || proofRef.startsWith('data:image/')) && (
        <div className="flex flex-col sm:flex-row items-start gap-3">
          <img
            src={proofDisplayUrl ?? proofRef}
            alt="Payment proof"
            className="w-full sm:w-20 h-auto sm:h-20 max-h-48 sm:max-h-none rounded-lg object-cover border border-kado-dark/10 shrink-0"
          />
          <div className="text-xs text-kado-dark/50 min-w-0">
            <p className="font-bold text-kado-dark/70 flex items-center gap-1">
              <ImageIcon className="w-3.5 h-3.5 shrink-0" />
              Proof uploaded
            </p>
            {paymentStatus === 'proof_submitted' && (
              <p className="mt-1 text-amber-700/80">Waiting for staff to verify payment.</p>
            )}
            {paymentStatus === 'paid' && (
              <p className="mt-1 text-emerald-700/80">Payment confirmed — your order is being prepared.</p>
            )}
          </div>
        </div>
      )}

      {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

      {(canSwitchToCash || onRequestCancel) && paymentStatus !== 'paid' && (
        <div className="border-t border-kado-dark/8 pt-3 space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-kado-dark/45">
            Changed your mind?
          </p>
          {canSwitchToCash && onSwitchToCash ? (
            <button
              type="button"
              disabled={switching || uploading}
              onClick={() => {
                setError(null);
                setSwitching(true);
                void onSwitchToCash()
                  .catch((err) => {
                    setError(err instanceof Error ? err.message : 'Could not switch to cash.');
                  })
                  .finally(() => setSwitching(false));
              }}
              className="w-full min-h-[44px] rounded-xl border border-kado-dark/15 bg-[#FAF7F2] text-kado-dark flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-wider hover:border-kado-red/40 transition-colors touch-manipulation disabled:opacity-50"
            >
              <Banknote className="w-4 h-4 shrink-0" />
              {switching ? 'Switching…' : 'Pay with cash at counter'}
            </button>
          ) : null}
          {onRequestCancel ? (
            <button
              type="button"
              disabled={switching || uploading}
              onClick={onRequestCancel}
              className="w-full min-h-[40px] rounded-xl text-red-700 flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-wider hover:bg-red-50 transition-colors touch-manipulation disabled:opacity-50"
            >
              <XCircle className="w-4 h-4 shrink-0" />
              Cancel order
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}
