import { useRef, useState } from 'react';
import { QrCode, ImageIcon, ExternalLink } from 'lucide-react';
import type { Order } from '../types/domain';
import { formatPhp } from '../lib/money';
import { isGcashOrder } from '../lib/orderStatus';
import { orderingRepo } from '../lib/supabase/repositories/ordering';
import { prepareGuestPaymentProof, GUEST_PROOF_MAX_DATA_URL_CHARS } from '../lib/compressPaymentProof';
import { usePaymentProofDisplayUrl } from '../hooks/usePaymentProofDisplayUrl';
import { formatOrderError } from '../lib/validation';

type Props = {
  order: Order;
  onViewQr: () => void;
  onUploadProof: (proofRef: string) => void | Promise<void>;
};

const actionBtn =
  'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-kado-dark/15 bg-white px-4 py-2.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-kado-dark hover:border-kado-red/40 active:scale-[0.98] transition touch-manipulation w-full sm:w-auto';

/** No `capture` — on phones, opens gallery/files for GCash screenshots (not the camera). */
const GCASH_PROOF_ACCEPT = 'image/png,image/jpeg,image/jpg,image/webp,image/heic,image/heif';

export default function OrderPaymentPanel({ order, onViewQr, onUploadProof }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const { url: proofUrl } = usePaymentProofDisplayUrl(order.paymentProofImage);

  if (!isGcashOrder(order)) return null;

  const needsProof = order.paymentStatus === 'unpaid' || order.paymentStatus === 'proof_submitted';

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
      let proofRef = prepared.dataUrl;
      if (prepared.dataUrl.length > GUEST_PROOF_MAX_DATA_URL_CHARS) {
        proofRef = await orderingRepo.uploadPaymentProof(order.id, file);
      }
      await onUploadProof(proofRef);
    } catch (err) {
      setError(formatOrderError(err));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mt-4 rounded-xl border border-kado-red/15 bg-kado-offwhite p-3.5 sm:p-4 space-y-3">
      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-kado-red">GCash payment</p>

      <div className="grid grid-cols-1 min-[400px]:grid-cols-2 sm:flex sm:flex-wrap gap-2">
        <button type="button" onClick={onViewQr} className={actionBtn}>
          <QrCode className="w-4 h-4 shrink-0" />
          View QR
        </button>
        {proofUrl && (
          <a href={proofUrl} target="_blank" rel="noopener noreferrer" className={actionBtn}>
            <ExternalLink className="w-4 h-4 shrink-0" />
            Open proof
          </a>
        )}
      </div>

      {order.paymentStatus === 'unpaid' && (
        <p className="text-xs sm:text-sm text-kado-dark/50 leading-relaxed">
          Pay {formatPhp(order.total)} via GCash, then upload a screenshot or saved receipt image from your
          photos (not a live camera photo).
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
            className="w-full min-h-[48px] flex items-center justify-center gap-2 rounded-xl bg-kado-red text-kado-cream py-3.5 px-4 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider hover:bg-kado-dark disabled:opacity-50 transition-colors touch-manipulation"
          >
            <ImageIcon className="w-4 h-4 shrink-0" />
            {uploading
              ? 'Uploading…'
              : order.paymentProofImage
                ? 'Replace screenshot'
                : 'Upload GCash screenshot'}
          </button>
        </>
      )}

      {order.paymentProofImage && proofUrl && (
        <div className="flex flex-col sm:flex-row items-start gap-3">
          <img
            src={proofUrl}
            alt="Payment proof"
            className="w-full sm:w-20 h-auto sm:h-20 max-h-48 sm:max-h-none rounded-lg object-cover border border-kado-dark/10 shrink-0"
          />
          <div className="text-xs text-kado-dark/50 min-w-0">
            <p className="font-bold text-kado-dark/70 flex items-center gap-1">
              <ImageIcon className="w-3.5 h-3.5 shrink-0" />
              Proof uploaded
            </p>
            {order.paymentProofUploadedAt && (
              <p className="mt-0.5 break-words">
                {new Date(order.paymentProofUploadedAt).toLocaleString('en-PH', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </p>
            )}
            {order.paymentStatus === 'proof_submitted' && (
              <p className="mt-1 text-amber-700/80">Waiting for staff to verify payment.</p>
            )}
          </div>
        </div>
      )}

      {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
    </div>
  );
}
