import { useState } from 'react';
import { cn } from '../../lib/utils';
import BoothPageContentForm from '../../components/admin/BoothPageContentForm';
import { useBoothShowcaseStore } from '../../store/boothShowcaseStore';
import { useMatchaShowcaseStore } from '../../store/matchaShowcaseStore';

type BookingTab = 'coffee-cart' | 'matcha-bar';

export default function AdminBoothContent() {
  const [tab, setTab] = useState<BookingTab>('coffee-cart');
  const [savedMsg, setSavedMsg] = useState('');

  const coffee = useBoothShowcaseStore();
  const matcha = useMatchaShowcaseStore();
  const active = tab === 'coffee-cart' ? coffee : matcha;

  const handlePublish = async () => {
    setSavedMsg('');
    try {
      await active.saveToRemote();
      setSavedMsg(tab === 'coffee-cart' ? 'Coffee cart page published.' : 'Matcha bar page published.');
    } catch {
      // saveError set in store
    }
  };

  return (
    <div className="max-w-6xl dash-page">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-bold dash-heading mb-2">Booking Page Content</h1>
          <p className="dash-muted text-sm">
            Edit hero copy, how-it-works steps, proposal form text, and showcase gallery for coffee cart and matcha bar
            booking pages. Publish to save to the database.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void handlePublish()}
          disabled={active.saving}
          className="shrink-0 rounded-xl bg-kado-red text-kado-cream px-6 py-3 text-xs font-bold uppercase tracking-wider hover:bg-kado-dark disabled:opacity-60"
        >
          {active.saving ? 'Publishing…' : tab === 'coffee-cart' ? 'Publish coffee cart' : 'Publish matcha bar'}
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {(
          [
            { id: 'coffee-cart' as const, label: 'Coffee cart', path: '/book/coffee-cart' },
            { id: 'matcha-bar' as const, label: 'Matcha bar', path: '/book/matcha-bar' },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setTab(item.id);
              setSavedMsg('');
            }}
            className={cn(
              'rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider border transition-colors',
              tab === item.id
                ? 'bg-kado-dark text-kado-cream border-kado-dark'
                : 'dash-border dash-muted hover:border-kado-red/40',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <p className="text-xs dash-muted mb-4">
        Public page:{' '}
        <a href={tab === 'coffee-cart' ? '/book/coffee-cart' : '/book/matcha-bar'} className="text-kado-red underline-offset-2 hover:underline" target="_blank" rel="noreferrer">
          {tab === 'coffee-cart' ? '/book/coffee-cart' : '/book/matcha-bar'}
        </a>
      </p>

      {active.saveError ? <p className="mb-4 text-sm text-red-600 font-medium">{active.saveError}</p> : null}
      {savedMsg ? <p className="mb-4 text-sm text-emerald-700 font-medium">{savedMsg}</p> : null}

      <BoothPageContentForm
        media={active.media}
        pageCopy={active.pageCopy}
        updatePageCopy={active.updatePageCopy}
        updateHowItWorksStep={active.updateHowItWorksStep}
        updateChip={active.updateChip}
        addMedia={active.addMedia}
        updateMedia={active.updateMedia}
        removeMedia={active.removeMedia}
      />
    </div>
  );
}
