import { useState, type FormEvent } from 'react';
import { useTableStore } from '../../store/tableStore';
import { useBranchStore } from '../../store/branchStore';
import { Plus, Trash2, QrCode, ToggleLeft, ToggleRight, Pencil, Check, X } from 'lucide-react';
import { tableQrUrl, takeoutQrUrl, qrImageUrl } from '../../lib/qr';

export default function AdminTables() {
  const tables = useTableStore((s) => s.tables);
  const addTable = useTableStore((s) => s.addTable);
  const updateTable = useTableStore((s) => s.updateTable);
  const removeTable = useTableStore((s) => s.removeTable);
  const toggleActive = useTableStore((s) => s.toggleActive);
  const branches = useBranchStore((s) => s.branches);

  const [selectedBranch, setSelectedBranch] = useState(branches[0]?.id ?? '');
  const [newLabel, setNewLabel] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const branchTables = tables.filter((t) => t.branchId === selectedBranch);
  const activeBranches = branches.filter((b) => b.status === 'active');
  const branch = branches.find((b) => b.id === selectedBranch);

  const handleAdd = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedBranch) return;
    addTable(selectedBranch, newLabel);
    setNewLabel('');
  };

  const takeoutUrl = branch ? takeoutQrUrl(branch.slug) : '';
  const takeoutPayload = branch ? `/order/takeout?b=${branch.slug}` : '';

  return (
    <div className="dash-page max-w-4xl">
      <h1 className="font-display text-3xl md:text-4xl font-bold dash-heading mb-2">Tables & QR</h1>
      <p className="dash-muted text-sm mb-6">
        Each table gets a unique QR code for dine-in ordering. One takeout QR per branch.
      </p>

      {/* Branch selector */}
      <div className="mb-6">
        <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1.5">Branch</label>
        <select
          value={selectedBranch}
          onChange={(e) => setSelectedBranch(e.target.value)}
          className="rounded-xl dash-input px-4 py-2.5 text-sm font-semibold max-w-xs"
        >
          {activeBranches.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      </div>

      {/* Takeout QR */}
      {branch && (
        <div className="rounded-2xl dash-card border p-5 mb-6">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="shrink-0 rounded-xl dash-border border dash-card-alt p-2">
              <img
                src={qrImageUrl(takeoutUrl, 180)}
                alt="Takeout QR"
                className="w-[164px] h-[164px] object-contain"
                width={164}
                height={164}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <QrCode className="w-6 h-6 text-kado-red shrink-0" />
                <p className="font-bold text-sm dash-heading">Takeout QR (branch-wide)</p>
                <span className="text-[9px] font-bold uppercase tracking-widest dash-card-alt dash-heading px-3 py-1 rounded-full dash-border border">
                  Takeout
                </span>
              </div>
              <p className="text-xs dash-muted break-all mb-1">{takeoutPayload}</p>
              <p className="text-[10px] dash-muted">Full URL for printing: {takeoutUrl}</p>
            </div>
          </div>
        </div>
      )}

      {/* Add table */}
      <form onSubmit={handleAdd} className="flex gap-2 mb-6">
        <input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder="Table label (optional)…"
          className="flex-1 rounded-xl dash-input px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30"
        />
        <button
          type="submit"
          className="rounded-xl bg-kado-dark text-kado-cream px-5 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-kado-red transition-colors flex items-center gap-1"
        >
          <Plus className="w-4 h-4" /> Add table
        </button>
      </form>

      {/* Table list */}
      {branchTables.length === 0 ? (
        <p className="text-sm dash-muted rounded-2xl dash-card border p-8 text-center">
          No tables for this branch yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {branchTables.map((t) => {
            const fullUrl = tableQrUrl(t.code);
            return (
              <li key={t.id} className="rounded-xl dash-card border p-4 flex flex-col sm:flex-row gap-4">
                <div className="shrink-0 rounded-lg dash-border border dash-card-alt p-1.5">
                  <img
                    src={qrImageUrl(fullUrl, 140)}
                    alt={`QR ${t.label}`}
                    className="w-[128px] h-[128px] object-contain"
                    width={128}
                    height={128}
                  />
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <div className="flex items-center gap-2 flex-wrap">
                    {renamingId === t.id ? (
                      <form
                        className="flex items-center gap-1"
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (renameValue.trim()) updateTable(t.id, { label: renameValue.trim() });
                          setRenamingId(null);
                        }}
                      >
                        <input
                          autoFocus
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          className="rounded-lg dash-input px-2 py-1 text-sm font-bold w-36"
                        />
                        <button type="submit" className="text-green-600 p-0.5"><Check className="w-4 h-4" /></button>
                        <button type="button" onClick={() => setRenamingId(null)} className="dash-muted p-0.5"><X className="w-4 h-4" /></button>
                      </form>
                    ) : (
                      <>
                        <p className="font-bold text-sm dash-heading">{t.label}</p>
                        <button
                          type="button"
                          onClick={() => { setRenamingId(t.id); setRenameValue(t.label); }}
                          className="dash-muted hover:text-kado-red p-0.5"
                          title="Rename table"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                    <span className="text-[9px] font-mono dash-muted dash-card-alt px-2 py-0.5 rounded">{t.code}</span>
                  </div>
                  <p className="text-[10px] dash-muted mt-1 break-all">{t.qrPayload}</p>
                  <p className="text-[10px] dash-muted mt-0.5 break-all">{fullUrl}</p>
                </div>
                <div className="flex sm:flex-col items-center justify-end gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => toggleActive(t.id)}
                    className={`flex items-center gap-1 text-xs font-bold ${t.active ? 'text-green-600' : 'dash-muted'}`}
                    title={t.active ? 'Active — click to disable' : 'Disabled — click to enable'}
                  >
                    {t.active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                    {t.active ? 'Active' : 'Off'}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeTable(t.id)}
                    className="text-red-400 hover:text-red-600 p-1"
                    aria-label="Remove table"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
