/** Bump when cookie/privacy disclosures change materially — re-prompts visitors. */
export const COOKIE_CONSENT_POLICY_VERSION = 1;

export type CookieConsentChoice = 'accepted' | 'rejected';

export type CookieConsentRecord = {
  version: number;
  choice: CookieConsentChoice;
  /** ISO timestamp when the visitor saved their preference. */
  decidedAt: string;
};

const STORAGE_KEY = 'kado-cookie-consent';
const COOKIE_NAME = 'kk_cookie_consent';
const COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 365; // 1 year

export const COOKIE_PREFERENCES_EVENT = 'kado:open-cookie-banner';

function safeParse(raw: string | null): CookieConsentRecord | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<CookieConsentRecord>;
    if (parsed.choice !== 'accepted' && parsed.choice !== 'rejected') return null;
    if (typeof parsed.version !== 'number' || typeof parsed.decidedAt !== 'string') return null;
    return {
      version: parsed.version,
      choice: parsed.choice,
      decidedAt: parsed.decidedAt,
    };
  } catch {
    return null;
  }
}

function writeCookie(choice: CookieConsentChoice): void {
  try {
    const secure = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${COOKIE_NAME}=${choice}; Max-Age=${COOKIE_MAX_AGE_SEC}; Path=/; SameSite=Lax${secure}`;
  } catch {
    /* ignore */
  }
}

export function readCookieConsent(): CookieConsentRecord | null {
  if (typeof window === 'undefined') return null;
  try {
    return safeParse(localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

export function isConsentCurrent(record: CookieConsentRecord | null): boolean {
  return record !== null && record.version === COOKIE_CONSENT_POLICY_VERSION;
}

export function shouldPromptForCookieConsent(): boolean {
  return !isConsentCurrent(readCookieConsent());
}

export function hasOptionalCookieConsent(): boolean {
  const record = readCookieConsent();
  return isConsentCurrent(record) && record?.choice === 'accepted';
}

export function saveCookieConsent(choice: CookieConsentChoice): CookieConsentRecord {
  const record: CookieConsentRecord = {
    version: COOKIE_CONSENT_POLICY_VERSION,
    choice,
    decidedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  } catch {
    /* localStorage full — cookie still records choice */
  }
  writeCookie(choice);
  return record;
}

export function requestCookiePreferences(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(COOKIE_PREFERENCES_EVENT));
}
