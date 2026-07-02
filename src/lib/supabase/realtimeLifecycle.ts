/** Defer realtime channel teardown so React StrictMode remounts don't kill in-flight WebSockets. */
const STOP_DELAY_MS = 120;

let pendingStopTimer: ReturnType<typeof setTimeout> | null = null;

export function cancelDeferredRealtimeStop(): void {
  if (pendingStopTimer) {
    clearTimeout(pendingStopTimer);
    pendingStopTimer = null;
  }
}

export function deferRealtimeStop(fn: () => void): void {
  cancelDeferredRealtimeStop();
  pendingStopTimer = setTimeout(() => {
    pendingStopTimer = null;
    fn();
  }, STOP_DELAY_MS);
}
