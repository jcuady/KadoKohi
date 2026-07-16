/** Backoff + online detection so Supabase calls don't storm when DNS/network drops. */

const MAX_BACKOFF_MS = 60_000;

let consecutiveFailures = 0;
let pausedUntil = 0;

type NetworkListener = (online: boolean) => void;
const listeners = new Set<NetworkListener>();

let lifecycleBound = false;

export function isBrowserOnline(): boolean {
  return typeof navigator === 'undefined' ? true : navigator.onLine;
}

export function isSupabaseCircuitOpen(): boolean {
  return !isBrowserOnline() || Date.now() < pausedUntil;
}

export function recordSupabaseFailure(): void {
  consecutiveFailures += 1;
  const backoff = Math.min(1000 * 2 ** (consecutiveFailures - 1), MAX_BACKOFF_MS);
  pausedUntil = Date.now() + backoff;
}

export function recordSupabaseSuccess(): void {
  consecutiveFailures = 0;
  pausedUntil = 0;
}

export function isNetworkError(err: unknown): boolean {
  if (err instanceof TypeError) return true;
  const msg = err instanceof Error ? err.message : String(err ?? '');
  return /network|failed to fetch|name_not_resolved|timed_out|network_changed|load failed|connection/i.test(
    msg,
  );
}

export function onNetworkStatusChange(cb: NetworkListener): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function notifyListeners(online: boolean): void {
  for (const cb of listeners) cb(online);
}

/** Call once at app boot. */
export function initSupabaseNetworkLifecycle(): void {
  if (lifecycleBound || typeof window === 'undefined') return;
  lifecycleBound = true;

  window.addEventListener('online', () => {
    recordSupabaseSuccess();
    notifyListeners(true);
  });
  window.addEventListener('offline', () => {
    recordSupabaseFailure();
    notifyListeners(false);
  });
}

/** Realtime reconnect delay — slower when offline or after failures. */
export function realtimeReconnectDelayMs(attempt: number): number {
  if (!isBrowserOnline()) return 30_000;
  const failurePenalty = consecutiveFailures > 0 ? Math.min(consecutiveFailures * 2000, 20_000) : 0;
  return Math.min(1000 * 2 ** attempt, 30_000) + failurePenalty;
}
