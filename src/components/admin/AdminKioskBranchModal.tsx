import { useEffect, useState } from 'react';
import { Monitor, X } from 'lucide-react';
import { useBranchStore } from '../../store/branchStore';

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: (branchId: string) => void;
  title?: string;
};

export default function AdminKioskBranchModal({
  open,
  onClose,
  onConfirm,
  title = 'Open kiosk display',
}: Props) {
  const branches = useBranchStore((s) => s.branches);
  const adminPosBranchId = useBranchStore((s) => s.adminPosBranchId);
  const hydrateBranches = useBranchStore((s) => s.hydrateFromRemote);

  const activeBranches = branches.filter((b) => b.status === 'active');
  const [selected, setSelected] = useState(adminPosBranchId ?? activeBranches[0]?.id ?? '');

  useEffect(() => {
    if (open) {
      void hydrateBranches();
    }
  }, [open, hydrateBranches]);

  useEffect(() => {
    if (!open) return;
    if (activeBranches.some((b) => b.id === selected)) return;
    setSelected(adminPosBranchId ?? activeBranches[0]?.id ?? '');
  }, [open, activeBranches, adminPosBranchId, selected]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-kado-dark/55 backdrop-blur-[3px] px-4" onClick={onClose}>
      <div
        className="w-full max-w-md dash-card rounded-[2rem] border p-6 shadow-[0_30px_60px_rgba(158,24,29,0.12)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-kado-red/10 flex items-center justify-center">
              <Monitor className="w-5 h-5 text-kado-red" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg dash-heading">{title}</h2>
              <p className="text-xs dash-muted mt-0.5">Choose which branch orders appear on the kiosk.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="dash-muted hover:text-kado-dark p-1" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        {activeBranches.length === 0 ? (
          <p className="text-sm dash-muted rounded-xl border dash-border p-4 text-center">
            No active branches. Add one under Admin → Branches first.
          </p>
        ) : (
          <>
            <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1.5">Branch</label>
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className="w-full rounded-xl dash-input px-4 py-2.5 text-sm font-semibold mb-5"
            >
              {activeBranches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full dash-border border px-4 py-2.5 text-xs font-black uppercase tracking-widest dash-muted hover:bg-kado-cream"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!selected}
                onClick={() => selected && onConfirm(selected)}
                className="rounded-full bg-kado-red text-white px-5 py-2.5 text-xs font-black uppercase tracking-widest shadow-lg shadow-kado-red/30 hover:bg-kado-red-hover disabled:opacity-50"
              >
                Open kiosk
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
