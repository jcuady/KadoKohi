import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
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
import { supabase } from './lib/supabase/client';
import { stopOperationsRealtime } from './lib/supabase/operationsRealtime';
import { registerSW } from 'virtual:pwa-register';

function Bootstrap() {
  const initAuth = useAuthStore((s) => s.initFromSupabase);
  const hydrateBranches = useBranchStore((s) => s.hydrateFromRemote);
  const hydrateMenu = useMenuStore((s) => s.hydrateFromRemote);
  const hydrateTables = useTableStore((s) => s.hydrateFromRemote);
  const hydrateOrders = useOrderStore((s) => s.hydrateFromRemote);
  const hydrateSettings = useSettingsStore((s) => s.hydrateFromRemote);
  const hydrateUsers = useUserStore((s) => s.hydrateFromRemote);

  useEffect(() => {
    void initAuth();
    void hydrateBranches();
    void hydrateMenu();
    void hydrateTables();
    void hydrateOrders();
    void hydrateSettings();
    void hydrateUsers();

    // Keep auth state in sync with Supabase session events (token refresh,
    // sign-out from another tab, OAuth callback, email confirmation, etc.).
    if (!supabase) return;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      // IMPORTANT: never call supabase.auth.* (signOut/getSession) synchronously
      // inside this callback — it deadlocks the auth lock. On SIGNED_OUT the
      // session is already cleared at the Supabase layer, so just reset local
      // state (calling logout()/signOut() here would re-fire SIGNED_OUT → loop).
      if (event === 'SIGNED_OUT') {
        stopOperationsRealtime();
        useAuthStore.setState({ user: null, loading: false });
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        // Defer so we don't re-enter the auth lock held during this callback.
        setTimeout(() => { void useAuthStore.getState().initFromSupabase(); }, 0);
      }
    });
    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <App />;
}

registerSW({ immediate: true });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Bootstrap />
  </StrictMode>,
);
