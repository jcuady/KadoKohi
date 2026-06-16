import { useState, type ReactNode } from 'react';
import { ChevronDown, Pencil, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { LandingTabId } from '../../lib/landingCmsTabs';
import LandingSectionPreview from './LandingSectionPreview';

type TabMeta = {
  id: LandingTabId;
  label: string;
  hint: string;
};

type Props = {
  tab: TabMeta;
  children: ReactNode;
  onUploadError?: (message: string) => void;
};

export default function LandingCmsSectionCard({ tab, children, onUploadError }: Props) {
  const [editing, setEditing] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const stopEditing = () => {
    setEditing(false);
    setAdvancedOpen(false);
  };

  return (
    <article
      id={`cms-section-${tab.id}`}
      className="overflow-hidden rounded-2xl border dash-border dash-card shadow-sm"
    >
      <header className="flex flex-wrap items-center gap-3 border-b dash-border px-4 py-3 sm:px-5">
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
          aria-expanded={!collapsed}
        >
          <ChevronDown
            className={`h-4 w-4 shrink-0 dash-muted transition-transform ${collapsed ? '-rotate-90' : ''}`}
          />
          <div className="min-w-0">
            <h2 className="font-display text-lg font-bold dash-heading">{tab.label}</h2>
            <p className="text-xs dash-muted truncate">{tab.hint}</p>
          </div>
        </button>
        <div className="flex shrink-0 gap-2">
          {editing ? (
            <button
              type="button"
              onClick={stopEditing}
              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-amber-900"
            >
              <X className="h-3.5 w-3.5" />
              Done
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setCollapsed(false);
                setEditing(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-kado-red px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-white hover:bg-kado-dark"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </button>
          )}
        </div>
      </header>

      <AnimatePresence initial={false}>
        {!collapsed ? (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="space-y-0 p-4 sm:p-5">
              <LandingSectionPreview
                sectionId={tab.id}
                editing={editing}
                onUploadError={onUploadError}
                onAdvancedSettings={() => setAdvancedOpen((v) => !v)}
                advancedOpen={advancedOpen}
              />

              <AnimatePresence initial={false}>
                {editing && advancedOpen ? (
                  <motion.div
                    key="advanced"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 rounded-xl border dash-border bg-[var(--color-dash-surface)] p-4 sm:p-5">
                      <p className="mb-4 text-xs font-bold uppercase tracking-wider dash-muted">
                        Section settings — links, products, slides &amp; structure
                      </p>
                      {children}
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </article>
  );
}
