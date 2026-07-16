import { onNetworkStatusChange } from './networkGuard';
import {
  restartCustomerAccountRealtimeIfWanted,
  stopCustomerAccountRealtime,
} from './customerAccountRealtime';
import { restartOperationsRealtimeIfWanted, stopOperationsRealtime } from './operationsRealtime';
import { restartGuestPageRealtimeIfWanted, stopGuestPageRealtime } from './guestPageRealtime';

let bound = false;

/** Pause realtime when offline; resume when connectivity returns. */
export function initSupabaseRealtimeNetworkLifecycle(): void {
  if (bound || typeof window === 'undefined') return;
  bound = true;

  onNetworkStatusChange((online) => {
    if (!online) {
      stopCustomerAccountRealtime({ keepWanted: true });
      stopOperationsRealtime({ keepWanted: true });
      stopGuestPageRealtime({ keepWanted: true });
      return;
    }
    restartCustomerAccountRealtimeIfWanted();
    restartOperationsRealtimeIfWanted();
    restartGuestPageRealtimeIfWanted();
  });
}
