import { useState } from 'react';
import { Pencil, XCircle } from 'lucide-react';
import type { GuestOrderAction, GuestOrderActionReason } from '../../lib/guestOrderActions';
import { reasonsForGuestAction } from '../../lib/guestOrderActions';
import OptionChip from '../ui/OptionChip';
import { OVERLAY_CTA, OVERLAY_CTA_SECONDARY } from '../../lib/overlayTheme';

type Props = {
  action: GuestOrderAction;
  busy: boolean;
  error: string;
  onClose: () => void;
  onConfirm: (reason: GuestOrderActionReason, note?: string) => void;
};

export default function GuestOrderActionSheet({
  action,
  busy,
  error,
  onClose,
  onConfirm,
}: Props) {
  const [reason, setReason] = useState<GuestOrderActionReason | ''>('');
  const [note, setNote] = useState('');

  const title = action === 'change_order' ? 'Change your order?' : 'Cancel this order?';
  const subtitle =
    action === 'change_order'
      ? 'We will cancel this ticket so you can place a new one. Only available before payment.'
      : 'You can cancel while your order is still at "Order received." This cannot be undone.';

  const reasons = reasonsForGuestAction(action);
  const needsNote = reason === 'other';
  const canSubmit = Boolean(reason) && (!needsNote || note.trim().length > 0);

  return (
    <div className="mb-3 rounded-[1.5rem] border border-kado-dark/10 bg-white p-4 shadow-[0_12px_28px_rgba(158,24,29,0.08)]">
      <p className="mb-1 text-sm font-bold text-kado-dark">{title}</p>
      <p className="mb-3 text-xs leading-relaxed text-kado-dark/55">{subtitle}</p>

      <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-kado-dark/45">
        Why? <span className="text-kado-red">*</span>
      </p>
      <div className="mb-3 flex flex-wrap gap-2">
        {reasons.map((r) => (
          <OptionChip
            key={r.id}
            active={reason === r.id}
            disabled={busy}
            onClick={() => setReason(r.id)}
            className="!min-h-[36px] !px-3 !py-1.5 !text-[10px]"
          >
            {r.label}
          </OptionChip>
        ))}
      </div>

      {needsNote && (
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Tell us briefly (optional detail)"
          maxLength={200}
          rows={2}
          className="mb-3 w-full resize-none rounded-xl border border-kado-dark/12 bg-kado-offwhite px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30"
        />
      )}

      {error ? <p className="mb-3 text-xs font-semibold text-red-700">{error}</p> : null}

      <div className="grid grid-cols-2 gap-2">
        <button type="button" disabled={busy} onClick={onClose} className={OVERLAY_CTA_SECONDARY}>
          Keep order
        </button>
        <button
          type="button"
          disabled={busy || !canSubmit}
          onClick={() => reason && onConfirm(reason, note.trim() || undefined)}
          className={`${OVERLAY_CTA} ${
            action === 'cancel' ? '!bg-red-600 !shadow-red-600/30 hover:!bg-red-700' : ''
          }`}
        >
          {busy ? (
            'Working…'
          ) : action === 'change_order' ? (
            <>
              <Pencil className="h-3.5 w-3.5" />
              Change order
            </>
          ) : (
            <>
              <XCircle className="h-3.5 w-3.5" />
              Cancel order
            </>
          )}
        </button>
      </div>
    </div>
  );
}
