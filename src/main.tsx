import { StrictMode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import App from './App.tsx';
import './index.css';
import { hydrateGlobalMinimal } from './lib/bootstrapHydration';
import { registerSW } from 'virtual:pwa-register';
import { ensurePublishedCms } from './lib/cmsBootstrap';
import ClerkAuthBridge from './components/ClerkAuthBridge';
import { CLERK_PUBLISHABLE_KEY, isClerkConfigured } from './lib/clerk/config';
import { clerkAllowedRedirectOrigins } from './lib/clerk/origins';

function Bootstrap() {
  return (
    <ClerkAuthBridge>
      <App />
    </ClerkAuthBridge>
  );
}

function MissingClerkConfig() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-kado-cream p-6 text-center">
      <div className="max-w-md">
        <h1 className="font-display text-2xl font-bold text-kado-dark mb-2">Auth not configured</h1>
        <p className="text-sm text-kado-dark/70">
          Set <code className="font-mono text-xs">VITE_CLERK_PUBLISHABLE_KEY</code> in your{' '}
          <code className="font-mono text-xs">.env</code> file, then restart the dev server.
        </p>
      </div>
    </div>
  );
}

registerSW({ immediate: true });

void (async () => {
  await ensurePublishedCms();
  await hydrateGlobalMinimal();
})();

const container = document.getElementById('root')!;
type RootHost = HTMLElement & { __kkReactRoot?: Root };
const host = container as RootHost;
const root = host.__kkReactRoot ?? createRoot(container);
host.__kkReactRoot = root;

root.render(
  <StrictMode>
    {isClerkConfigured ? (
      <ClerkProvider
        publishableKey={CLERK_PUBLISHABLE_KEY!}
        signInUrl="/auth/login"
        signUpUrl="/auth/signup"
        signInFallbackRedirectUrl="/account"
        signUpFallbackRedirectUrl="/account"
        afterSignOutUrl="/"
        allowedRedirectOrigins={clerkAllowedRedirectOrigins()}
      >
        <Bootstrap />
      </ClerkProvider>
    ) : (
      <MissingClerkConfig />
    )}
  </StrictMode>,
);
