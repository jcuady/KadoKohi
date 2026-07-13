import { useState } from 'react';
import { Pencil, XCircle } from 'lucide-react';
import type { GuestOrderAction, GuestOrderActionReason } from '../../lib/guestOrderActions';
import { reasonsForGuestAction } from '../../lib/guestOrderActions';

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
    <div className="rounded-2xl border border-kado-dark/10 bg-white p-4 mb-3">
      <p className="text-sm font-bold text-kado-dark mb-1">{title}</p>
      <p className="text-xs text-kado-dark/55 mb-3 leading-relaxed">{subtitle}</p>

      <p className="text-[10px] font-black uppercase tracking-widest text-kado-dark/45 mb-2">
        Why? <span className="text-kado-red">*</span>
      </p>
      <div className="flex flex-wrap gap-2 mb-3">
        {reasons.map((r) => (
          <button
            key={r.id}
            type="button"
            disabled={busy}
            onClick={() => setReason(r.id)}
            className={`min-h-[36px] px-3 py-1.5 rounded-full text-[10px] font-bold border-2 touch-manipulation transition-colors ${
              reason === r.id
                ? 'border-kado-red bg-kado-red text-kado-cream'
                : 'border-kado-dark/12 bg-kado-offwhite text-kado-dark/70 hover:border-kado-red/30'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {needsNote && (
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Tell us briefly (optional detail)"
          maxLength={200}
          rows={2}
          className="w-full rounded-xl border border-kado-dark/12 bg-kado-offwhite px-3 py-2.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-kado-red/30 resize-none"
        />
      )}

      {error ? <p className="text-xs font-semibold text-red-700 mb-3">{error}</p> : null}

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={onClose}
          className="min-h-[44px] rounded-xl border border-kado-dark/12 bg-white text-kado-dark text-[11px] font-bold uppercase tracking-wider touch-manipulation disabled:opacity-60"
        >
          Keep order
        </button>
        <button
          type="button"
          disabled={busy || !canSubmit}
          onClick={() => reason && onConfirm(reason, note.trim() || undefined)}
          className={`min-h-[44px] rounded-xl text-[11px] font-bold uppercase tracking-wider touch-manipulation disabled:opacity-40 flex items-center justify-center gap-1.5 ${
            action === 'change_order'
              ? 'bg-kado-dark text-kado-cream hover:bg-kado-red'
              : 'bg-red-600 text-white hover:bg-red-700'
          }`}
        >
          {busy ? (
            'Working…'
          ) : action === 'change_order' ? (
            <>
              <Pencil className="w-3.5 h-3.5" />
              Change order
            </>
          ) : (
            <>
              <XCircle className="w-3.5 h-3.5" />
              Cancel
            </>
          )}
        </button>
      </div>
    </div>
  );
}
