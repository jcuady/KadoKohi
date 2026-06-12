import { useLocation } from 'react-router-dom';
import CookieConsentBanner from './CookieConsentBanner';
import CookieConsentNotice from './CookieConsentNotice';
import { useCookieConsent } from '../hooks/useCookieConsent';
import { shouldShowCookieConsent } from '../lib/cookieConsentRoutes';

/** Cookie banner + save confirmation for public customer routes. */
export default function SiteCookieConsent() {
  const { pathname } = useLocation();
  const { bannerOpen, notice, decide, dismissNotice } = useCookieConsent();

  if (!shouldShowCookieConsent(pathname)) return null;

  return (
    <>
      <CookieConsentBanner open={bannerOpen} onDecide={decide} />
      <CookieConsentNotice message={notice} onDismiss={dismissNotice} />
    </>
  );
}
