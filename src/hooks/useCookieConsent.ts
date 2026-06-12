import { useCallback, useEffect, useState } from 'react';
import {
  COOKIE_PREFERENCES_EVENT,
  readCookieConsent,
  requestCookiePreferences,
  saveCookieConsent,
  shouldPromptForCookieConsent,
  type CookieConsentChoice,
  type CookieConsentRecord,
} from '../lib/cookieConsent';

export function useCookieConsent() {
  const [record, setRecord] = useState<CookieConsentRecord | null>(() => readCookieConsent());
  const [bannerOpen, setBannerOpen] = useState(() => shouldPromptForCookieConsent());
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const onPreferences = () => setBannerOpen(true);
    window.addEventListener(COOKIE_PREFERENCES_EVENT, onPreferences);
    return () => window.removeEventListener(COOKIE_PREFERENCES_EVENT, onPreferences);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const id = window.setTimeout(() => setNotice(null), 4500);
    return () => window.clearTimeout(id);
  }, [notice]);

  const decide = useCallback((choice: CookieConsentChoice) => {
    const next = saveCookieConsent(choice);
    setRecord(next);
    setBannerOpen(false);
    setNotice(
      choice === 'accepted'
        ? 'Cookie preferences saved. Optional cookies are allowed.'
        : 'Cookie preferences saved. Only essential cookies are used.',
    );
  }, []);

  const openPreferences = useCallback(() => {
    requestCookiePreferences();
  }, []);

  return {
    record,
    bannerOpen,
    notice,
    decide,
    openPreferences,
    dismissNotice: () => setNotice(null),
  };
}
