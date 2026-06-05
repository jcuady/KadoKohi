import { useEffect, useState, type FormEvent } from 'react';
import { useTableStore } from '../../store/tableStore';
import { useBranchStore } from '../../store/branchStore';
import { Plus, Trash2, QrCode, ToggleLeft, ToggleRight, Pencil, Check, X, Download, Loader2 } from 'lucide-react';
import { tableQrUrl, takeoutQrUrl } from '../../lib/qr';
import type { QrCardLayout } from '../../lib/brandedQrCard';
import { getQrScanOrigin } from '../../lib/siteUrl';
import { formatTableCrudError } from '../../lib/supabase/repositories/ordering';
import BrandedQrPreview from '../../components/admin/BrandedQrPreview';
import QrDownloadModal from '../../components/admin/QrDownloadModal';

type QrModalState = {
  title: string;
  scanUrl: string;
  downloadFilename: string;
  subtitle?: string;
  tagline?: string;
  layout: QrCardLayout;
};

export default function AdminTables() {
  const tables = useTableStore((s) => s.tables);
  const tablesHydrated = useTableStore((s) => s.hydrated);
  const hydrateTables = useTableStore((s) => s.hydrateFromRemote);
  const addTable = useTableStore((s) => s.addTable);
  const updateTable = useTableStore((s) => s.updateTable);
  const removeTable = useTableStore((s) => s.removeTable);
  const toggleActive = useTableStore((s) => s.toggleActive);
  const branches = useBranchStore((s) => s.branches);
  const hydrateBranches = useBranchStore((s) => s.hydrateFromRemote);

  const activeBranches = branches.filter((b) => b.status === 'active');
  const [selectedBranch, setSelectedBranch] = useState(activeBranches[0]?.id ?? '');

  useEffect(() => {
    void hydrateBranches();
    void hydrateTables();
  }, [hydrateBranches, hydrateTables]);

  useEffect(() => {
    if (!activeBranches.length) return;
    if (!activeBranches.some((b) => b.id === selectedBranch)) {
      setSelectedBranch(activeBranches[activeBranches.length - 1]?.id ?? activeBranches[0].id);
    }
  }, [activeBranches, selectedBranch]);

  const [newLabel, setNewLabel] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [qrModal, setQrModal] = useState<QrModalState | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionOk, setActionOk] = useState('');

  const branchTables = tables.filter((t) => t.branchId === selectedBranch);
  const branch = branches.find((b) => b.id === selectedBranch);
  const qrScanOrigin = getQrScanOrigin();

  const flashOk = (message: string) => {
    setActionOk(message);
    setActionError('');
    window.setTimeout(() => setActionOk(''), 3000);
  };

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedBranch) return;
    setAdding(true);
    setActionError('');
    try {
      const created = await addTable(selectedBranch, newLabel, branch?.slug);
      setNewLabel('');
      flashOk(`Added ${created.label} for ${branch?.name ?? 'branch'}.`);
      setQrModal({
        title: created.label,
        scanUrl: tableQrUrl(created.code),
        downloadFilename: `kado-table-${created.code}`,
        subtitle: created.code,
        tagline: 'Dine-in · Order from your phone',
        layout: 'table',
      });
    } catch (err) {
      setActionError(formatTableCrudError(err, 'add'));
    } finally {
      setAdding(false);
    }
  };

  const handleRename = async (id: string) => {
    if (!renameValue.trim()) return;
    setBusyId(id);
    setActionError('');
    try {
      await updateTable(id, { label: renameValue.trim() });
      setRenamingId(null);
      flashOk('Table renamed.');
    } catch (err) {
      setActionError(formatTableCrudError(err, 'update'));
    } finally {
      setBusyId(null);
    }
  };

  const handleToggle = async (id: string) => {
    setBusyId(id);
    setActionError('');
    try {
      await toggleActive(id);
      flashOk('Table status updated.');
    } catch (err) {
      setActionError(formatTableCrudError(err, 'toggle'));
    } finally {
      setBusyId(null);
    }
  };

  const handleRemove = async (id: string, label: string) => {
    if (!window.confirm(`Delete “${label}”? Its QR will stop working immediately.`)) return;
    setBusyId(id);
    setActionError('');
    try {
      await removeTable(id);
      flashOk(`Deleted ${label}.`);
    } catch (err) {
      setActionError(formatTableCrudError(err, 'delete'));
    } finally {
      setBusyId(null);
    }
  };

  const takeoutUrl = branch ? takeoutQrUrl(branch.slug) : '';

  return (
    <div className="dash-page max-w-4xl">
      <h1 className="font-display text-3xl md:text-4xl font-bold dash-heading mb-2">Tables & QR</h1>
      <p className="dash-muted text-sm mb-2">
        Each branch has its own dine-in tables and takeout QR. Table QRs encode your live site URL so scans work on{' '}
        <a href={qrScanOrigin} className="text-kado-red hover:underline" target="_blank" rel="noopener noreferrer">
          production
        </a>
        .
      </p>
      <p className="text-[10px] dash-muted mb-4 break-all">
        QR scan URL: <span className="font-mono font-semibold text-kado-dark">{qrScanOrigin}</span>
      </p>

      {actionError ? (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{actionError}</p>
      ) : null}
      {actionOk ? (
        <p className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{actionOk}</p>
      ) : null}

      {!tablesHydrated ? (
        <p className="text-sm dash-muted rounded-2xl dash-card border p-8 text-center flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading tables from Supabase…
        </p>
      ) : activeBranches.length === 0 ? (
        <p className="text-sm dash-muted rounded-2xl dash-card border p-8 text-center">
          Add an active branch first under Admin → Branches.
        </p>
      ) : (
        <>
          <div className="mb-6">
            <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1.5">Branch</label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="rounded-xl dash-input px-4 py-2.5 text-sm font-semibold max-w-xs"
            >
              {activeBranches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            {branch ? (
              <p className="mt-2 text-xs dash-muted">
                {branchTables.length} table{branchTables.length === 1 ? '' : 's'} · slug{' '}
                <span className="font-mono font-semibold">{branch.slug}</span>
              </p>
            ) : null}
          </div>

          {branch && (
            <div className="rounded-2xl dash-card border p-5 mb-6">
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                <button
                  type="button"
                  onClick={() =>
                    setQrModal({
                      title: branch.name,
                      scanUrl: takeoutUrl,
                      downloadFilename: `kado-takeout-${branch.slug}`,
                      subtitle: 'Takeout ordering',
                      tagline: 'Takeout · Order from your phone',
                      layout: 'takeout',
                    })
                  }
                  className="shrink-0 rounded-xl dash-border border dash-card-alt p-2 hover:border-kado-red/40 transition-colors w-[120px]"
                >
                  <BrandedQrPreview
                    layout="takeout"
                    title={branch.name}
                    scanUrl={takeoutUrl}
                    subtitle="Takeout ordering"
                    tagline="Takeout · Order from your phone"
                    className="w-full"
                  />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <QrCode className="w-6 h-6 text-kado-red shrink-0" />
                    <p className="font-bold text-sm dash-heading">Takeout QR (branch-wide)</p>
                  </div>
                  <p className="text-[10px] dash-muted break-all mb-3">{takeoutUrl}</p>
                  <button
                    type="button"
                    onClick={() =>
                      setQrModal({
                        title: branch.name,
                        scanUrl: takeoutUrl,
                        downloadFilename: `kado-takeout-${branch.slug}`,
                        subtitle: 'Takeout ordering',
                        tagline: 'Takeout · Order from your phone',
                        layout: 'takeout',
                      })
                    }
                    className="inline-flex items-center gap-2 rounded-xl bg-kado-dark text-kado-cream px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider hover:bg-kado-red"
                  >
                    <Download className="w-4 h-4" />
                    View & download QR
                  </button>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-2 mb-6">
            <input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Table label (optional)…"
              className="flex-1 rounded-xl dash-input px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30"
            />
            <button
              type="submit"
              disabled={adding || !selectedBranch}
              className="rounded-xl bg-kado-dark text-kado-cream px-5 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-kado-red transition-colors flex items-center justify-center gap-1 min-h-[44px] disabled:opacity-60"
            >
              {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add table
            </button>
          </form>

          {branchTables.length === 0 ? (
            <p className="text-sm dash-muted rounded-2xl dash-card border p-8 text-center">
              No tables for this branch yet. Add one above or create the branch again to auto-seed four tables.
            </p>
          ) : (
            <ul className="space-y-3">
              {branchTables.map((t) => {
                const fullUrl = tableQrUrl(t.code);
                const rowBusy = busyId === t.id;
                return (
                  <li key={t.id} className="rounded-xl dash-card border p-4 flex flex-col sm:flex-row gap-4">
                    <button
                      type="button"
                      onClick={() =>
                        setQrModal({
                          title: t.label,
                          scanUrl: fullUrl,
                          downloadFilename: `kado-table-${t.code}`,
                          subtitle: t.code.toUpperCase(),
                          tagline: 'Dine-in · Order from your phone',
                          layout: 'table',
                        })
                      }
                      className="shrink-0 rounded-lg dash-border border dash-card-alt p-1.5 hover:border-kado-red/40 transition-colors text-left w-[112px]"
                      title="View & download QR"
                    >
                      <BrandedQrPreview
                        layout="table"
                        title={t.label}
                        scanUrl={fullUrl}
                        subtitle={t.code.toUpperCase()}
                        tagline="Dine-in · Order from your phone"
                        className="w-full"
                      />
                      <span className="mt-1 block text-center text-[9px] font-bold uppercase tracking-wider text-kado-red">
                        Tap for QR
                      </span>
                    </button>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <div className="flex items-center gap-2 flex-wrap">
                        {renamingId === t.id ? (
                          <form
                            className="flex items-center gap-1"
                            onSubmit={(e) => {
                              e.preventDefault();
                              void handleRename(t.id);
                            }}
                          >
                            <input
                              autoFocus
                              value={renameValue}
                              onChange={(e) => setRenameValue(e.target.value)}
                              className="rounded-lg dash-input px-2 py-1 text-sm font-bold w-36"
                            />
                            <button type="submit" disabled={rowBusy} className="text-green-600 p-0.5">
                              <Check className="w-4 h-4" />
                            </button>
                            <button type="button" onClick={() => setRenamingId(null)} className="dash-muted p-0.5">
                              <X className="w-4 h-4" />
                            </button>
                          </form>
                        ) : (
                          <>
                            <p className="font-bold text-sm dash-heading">{t.label}</p>
                            <button
                              type="button"
                              onClick={() => {
                                setRenamingId(t.id);
                                setRenameValue(t.label);
                              }}
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
                      <p className="text-[10px] font-semibold text-kado-dark/70 mt-0.5 break-all">{fullUrl}</p>
                      <button
                        type="button"
                        onClick={() =>
                          setQrModal({
                            title: t.label,
                            scanUrl: fullUrl,
                            downloadFilename: `kado-table-${t.code}`,
                            subtitle: t.code.toUpperCase(),
                            tagline: 'Dine-in · Order from your phone',
                            layout: 'table',
                          })
                        }
                        className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-kado-red hover:underline w-fit"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download QR
                      </button>
                    </div>
                    <div className="flex sm:flex-col items-center justify-end gap-2 shrink-0">
                      <button
                        type="button"
                        disabled={rowBusy}
                        onClick={() => void handleToggle(t.id)}
                        className={`flex items-center gap-1 text-xs font-bold ${t.active ? 'text-green-600' : 'dash-muted'} disabled:opacity-60`}
                        title={t.active ? 'Active — click to disable' : 'Disabled — click to enable'}
                      >
                        {rowBusy ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : t.active ? (
                          <ToggleRight className="w-5 h-5" />
                        ) : (
                          <ToggleLeft className="w-5 h-5" />
                        )}
                        {t.active ? 'Active' : 'Off'}
                      </button>
                      <button
                        type="button"
                        disabled={rowBusy}
                        onClick={() => void handleRemove(t.id, t.label)}
                        className="text-red-400 hover:text-red-600 p-1 disabled:opacity-60"
                        aria-label="Remove table"
                      >
                        {rowBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}

      <QrDownloadModal
        open={!!qrModal}
        onClose={() => setQrModal(null)}
        title={qrModal?.title ?? ''}
        scanUrl={qrModal?.scanUrl ?? ''}
        downloadFilename={qrModal?.downloadFilename ?? 'kado-qr'}
        subtitle={qrModal?.subtitle}
        tagline={qrModal?.tagline}
        layout={qrModal?.layout ?? 'table'}
      />
    </div>
  );
}
