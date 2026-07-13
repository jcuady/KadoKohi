import { useRef, useState } from 'react';
import { QrCode, ImageIcon, Building2 } from 'lucide-react';
import type { BoothBooking } from '../../types/domain';
import { formatPhp } from '../../lib/money';
import { boothAmountDue, resolveBoothGcashQr } from '../../lib/boothPayment';
import { bookingQuotedTotal } from '../../lib/boothBookingEstimate';
import { customerCanUploadProof } from '../../lib/boothBookingStatus';
import { PAYMENT_STATUS_LABELS, PAYMENT_STATUS_BADGE } from '../../lib/orderStatus';
import { useSettingsStore } from '../../store/settingsStore';
import { useBoothBookingStore } from '../../store/boothBookingStore';
import { orderingRepo } from '../../lib/supabase/repositories/ordering';
import { prepareGuestPaymentProof, GUEST_PROOF_MAX_DATA_URL_CHARS } from '../../lib/compressPaymentProof';
import { usePaymentProofDisplayUrl } from '../../hooks/usePaymentProofDisplayUrl';
import { formatOrderError } from '../../lib/validation';
import GcashQrModal from '../GcashQrModal';

type Props = {
  booking: BoothBooking;
};

const PROOF_ACCEPT = 'image/png,image/jpeg,image/jpg,image/webp,image/heic,image/heif';

export default function BoothPaymentPanel({ booking }: Props) {
  const settings = useSettingsStore((s) => s.settings);
  const submitPaymentProof = useBoothBookingStore((s) => s.submitPaymentProof);
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const { url: proofUrl } = usePaymentProofDisplayUrl(booking.paymentProofImage);

  const amountDue = boothAmountDue(booking);
  const quotedTotal = bookingQuotedTotal(booking);
  const isDeposit = quotedTotal != null && amountDue != null && amountDue < quotedTotal;
  const bp = settings.boothPayment;
  const showGcash =
    (booking.paymentMethod === 'gcash-qr' || booking.paymentMethod === 'gcash-or-bank') && bp.gcashEnabled;
  const showBank =
    (booking.paymentMethod === 'bank-transfer' || booking.paymentMethod === 'gcash-or-bank') && bp.bankEnabled;
  const gcashQr = resolveBoothGcashQr(settings);

  if (!amountDue || amountDue <= 0 || booking.paymentStatus === 'paid') return null;

  const canUpload = customerCanUploadProof(booking);

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
        proofRef = await orderingRepo.uploadPaymentProof(booking.id, file);
      }
      await submitPaymentProof(booking.id, proofRef);
    } catch (err) {
      setError(formatOrderError(err));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mt-4 rounded-xl border border-kado-red/15 bg-kado-offwhite p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-kado-red">Payment</p>
        <span
          className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${PAYMENT_STATUS_BADGE[booking.paymentStatus]}`}
        >
          {PAYMENT_STATUS_LABELS[booking.paymentStatus]}
        </span>
      </div>

      <p className="font-display text-2xl font-bold text-kado-dark">{formatPhp(amountDue)}</p>
      <p className="text-xs text-kado-dark/55">
        {isDeposit ? (
          <>
            Deposit / reservation due now · Full quote {formatPhp(quotedTotal!)} · Ref {booking.shortCode}
          </>
        ) : (
          <>Amount due for reference {booking.shortCode}</>
        )}
      </p>

      {booking.paymentStatus === 'unpaid' && (showGcash || showBank) && (
        <p className="text-xs text-kado-dark/55 leading-relaxed">
          Pay {formatPhp(amountDue)} via {showGcash && showBank ? 'GCash or bank transfer' : showGcash ? 'GCash' : 'bank transfer'}, then upload your receipt screenshot.
        </p>
      )}

      {showGcash && gcashQr && (
        <button
          type="button"
          onClick={() => setQrOpen(true)}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-kado-dark/15 bg-white px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-kado-dark hover:border-kado-red/40 w-full sm:w-auto"
        >
          <QrCode className="w-4 h-4" />
          Pay with GCash
        </button>
      )}

      {showBank && (bp.bankName || bp.bankAccountNumber) && (
        <div className="rounded-xl border border-kado-dark/10 bg-white p-3 text-sm space-y-1">
          <p className="text-[9px] font-black uppercase tracking-wider text-kado-dark/45 flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5" /> Bank transfer
          </p>
          {bp.bankName && <p><span className="text-kado-dark/50">Bank:</span> {bp.bankName}</p>}
          {bp.bankAccountName && <p><span className="text-kado-dark/50">Name:</span> {bp.bankAccountName}</p>}
          {bp.bankAccountNumber && <p><span className="text-kado-dark/50">Account:</span> {bp.bankAccountNumber}</p>}
          {bp.bankInstructions && <p className="text-xs text-kado-dark/60 mt-1">{bp.bankInstructions}</p>}
        </div>
      )}

      {canUpload && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept={PROOF_ACCEPT}
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
            className="w-full min-h-[48px] flex items-center justify-center gap-2 rounded-xl bg-kado-red text-kado-cream py-3.5 text-[10px] font-bold uppercase tracking-wider hover:bg-kado-dark disabled:opacity-50"
          >
            <ImageIcon className="w-4 h-4" />
            {uploading ? 'Uploading…' : booking.paymentProofImage ? 'Replace payment proof' : 'Upload payment proof'}
          </button>
        </>
      )}

      {booking.paymentProofImage && proofUrl && (
        <div className="flex flex-col sm:flex-row items-start gap-3">
          <img src={proofUrl} alt="Payment proof" className="w-full sm:w-20 max-w-[200px] rounded-lg border border-kado-dark/10 object-cover" />
          <div className="text-xs text-kado-dark/50 min-w-0">
            <p className="font-bold text-kado-dark/70">Proof uploaded</p>
            {booking.paymentProofUploadedAt && (
              <p className="mt-0.5">
                {new Date(booking.paymentProofUploadedAt).toLocaleString('en-PH', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </p>
            )}
            {booking.paymentStatus === 'proof_submitted' && (
              <p className="mt-1 text-amber-700/80">Waiting for our team to verify payment.</p>
            )}
          </div>
        </div>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}

      {showGcash && gcashQr && (
        <GcashQrModal
          open={qrOpen}
          onClose={() => setQrOpen(false)}
          shortCode={booking.shortCode}
          total={amountDue}
          qrImageUrl={gcashQr}
        />
      )}
    </div>
  );
}
