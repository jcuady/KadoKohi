import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';
import { isBrowserOnline, onNetworkStatusChange } from '../lib/supabase/networkGuard';

type Props = {
  /** When true, sits under the account app bar instead of the public navbar. */
  accountShell?: boolean;
};

export default function ConnectivityBanner({ accountShell = false }: Props) {
  const [offline, setOffline] = useState(() => !isBrowserOnline());

  useEffect(() => {
    setOffline(!isBrowserOnline());
    return onNetworkStatusChange((online) => setOffline(!online));
  }, []);

  if (!offline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={[
        'z-[190] border-b border-amber-300/70 bg-amber-50 px-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] py-2 text-center text-[11px] font-semibold leading-snug text-amber-950',
        accountShell ? 'sticky top-[var(--account-app-bar-height)]' : 'fixed inset-x-0 top-[var(--public-nav-height,3.5rem)]',
      ].join(' ')}
    >
      <span className="inline-flex items-center justify-center gap-1.5">
        <WifiOff className="h-3.5 w-3.5 shrink-0" aria-hidden />
        You&apos;re offline — we&apos;ll reconnect automatically.
      </span>
    </div>
  );
}
