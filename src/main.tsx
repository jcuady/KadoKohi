import {StrictMode} from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { useEffect } from 'react';
import App from './App.tsx';
import './index.css';
import { useAuthStore } from './store/authStore';
import { useBranchStore } from './store/branchStore';
import { useMenuStore } from './store/menuStore';
import { useTableStore } from './store/tableStore';
import { useOrderStore } from './store/orderStore';
import { useSettingsStore } from './store/settingsStore';
import { useUserStore } from './store/userStore';
import { useMerchStore } from './store/merchStore';
import { useEventStore } from './store/eventStore';
import { useEventFormStore } from './store/eventFormStore';
import { useBoothBookingStore } from './store/boothBookingStore';
import { useBoothShowcaseStore } from './store/boothShowcaseStore';
import { useLandingContentStore } from './store/landingContentStore';
import { useLoyaltyStore } from './store/loyaltyStore';
import { useBlogStore } from './store/blogStore';
import { supabase } from './lib/supabase/client';
import { stopOperationsRealtime } from './lib/supabase/operationsRealtime';
import { isAuthListenerPaused, recoverStaleAuthSession } from './lib/supabase/authSession';
import { registerSW } from 'virtual:pwa-register';

function Bootstrap() {
  const initAuth = useAuthStore((s) => s.initFromSupabase);
  const hydrateBranches = useBranchStore((s) => s.hydrateFromRemote);
  const hydrateMenu = useMenuStore((s) => s.hydrateFromRemote);
  const hydrateTables = useTableStore((s) => s.hydrateFromRemote);
  const hydrateOrders = useOrderStore((s) => s.hydrateFromRemote);
  const hydrateSettings = useSettingsStore((s) => s.hydrateFromRemote);
  const hydrateUsers = useUserStore((s) => s.hydrateFromRemote);
  const hydrateMerch = useMerchStore((s) => s.hydrateFromRemote);
  const hydrateEvents = useEventStore((s) => s.hydrateFromRemote);
  const hydrateEventForms = useEventFormStore((s) => s.hydrateFromRemote);
  const hydrateBookings = useBoothBookingStore((s) => s.hydrateFromRemote);
  const hydrateBoothPage = useBoothShowcaseStore((s) => s.hydrateFromRemote);
  const hydrateLanding = useLandingContentStore((s) => s.hydrateFromRemote);
  const hydrateLoyalty = useLoyaltyStore((s) => s.hydrateFromRemote);
  const hydrateBlog = useBlogStore((s) => s.hydrateFromRemote);

  useEffect(() => {
    void recoverStaleAuthSession().then(() => initAuth());
    void hydrateBranches();
    void hydrateMenu();
    void hydrateTables();
    void hydrateOrders();
    void hydrateSettings();
    void hydrateUsers();
    void hydrateMerch();
    void hydrateEvents();
    void hydrateEventForms();
    void hydrateBookings();
    void hydrateBoothPage();
    void hydrateLanding();
    void hydrateLoyalty();
    void hydrateBlog();

    // Keep auth state in sync with Supabase session events (token refresh,
    // sign-out from another tab, OAuth callback, email confirmation, etc.).
    if (!supabase) return;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // IMPORTANT: never call supabase.auth.* (signOut/getSession) synchronously
      // inside this callback — it deadlocks the auth lock. On SIGNED_OUT the
      // session is already cleared at the Supabase layer, so just reset local
      // state (calling logout()/signOut() here would re-fire SIGNED_OUT → loop).
      if (event === 'SIGNED_OUT' || (event === 'INITIAL_SESSION' && !session)) {
        stopOperationsRealtime();
        useAuthStore.setState({ user: null, loading: false });
        return;
      }
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        if (isAuthListenerPaused()) return;
        // Defer so we don't re-enter the auth lock held during this callback.
        setTimeout(() => {
          if (isAuthListenerPaused()) return;
          void useAuthStore.getState().initFromSupabase();
        }, 0);
      }
    });
    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <App />;
}

registerSW({ immediate: true });

const container = document.getElementById('root')!;
type RootHost = HTMLElement & { __kkReactRoot?: Root };
const host = container as RootHost;
const root = host.__kkReactRoot ?? createRoot(container);
host.__kkReactRoot = root;

root.render(
  <StrictMode>
    <Bootstrap />
  </StrictMode>,
);
