import { PASTRIES_PAGE } from '../content/pastriesPage';

export interface PastriesHeroCopy {
  eyebrow: string;
  headlineTop: string;
  headlineBottom: string;
  subhead: string;
  badge: string;
  badgeNote: string;
}

export interface PastriesPosterCopy {
  primaryImage: string;
  secondaryImage: string;
}

export interface PastriesCtaCopy {
  title: string;
  body: string;
}

export interface PastriesPageContent {
  hero: PastriesHeroCopy;
  poster: PastriesPosterCopy;
  cta: PastriesCtaCopy;
}

export const DEFAULT_PASTRIES_PAGE_CONTENT: PastriesPageContent = {
  hero: { ...PASTRIES_PAGE.hero },
  poster: { ...PASTRIES_PAGE.poster },
  cta: { ...PASTRIES_PAGE.cta },
};

function str(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

export function normalizePastriesPageContent(raw: unknown): PastriesPageContent {
  const base = DEFAULT_PASTRIES_PAGE_CONTENT;
  if (!raw || typeof raw !== 'object') return { ...base };
  const row = raw as Partial<PastriesPageContent>;
  const hero = row.hero && typeof row.hero === 'object' ? (row.hero as Partial<PastriesHeroCopy>) : {};
  const poster = row.poster && typeof row.poster === 'object' ? (row.poster as Partial<PastriesPosterCopy>) : {};
  const cta = row.cta && typeof row.cta === 'object' ? (row.cta as Partial<PastriesCtaCopy>) : {};
  return {
    hero: {
      eyebrow: str(hero.eyebrow, base.hero.eyebrow),
      headlineTop: str(hero.headlineTop, base.hero.headlineTop),
      headlineBottom: str(hero.headlineBottom, base.hero.headlineBottom),
      subhead: str(hero.subhead, base.hero.subhead),
      badge: str(hero.badge, base.hero.badge),
      badgeNote: str(hero.badgeNote, base.hero.badgeNote),
    },
    poster: {
      primaryImage: str(poster.primaryImage, base.poster.primaryImage),
      secondaryImage: str(poster.secondaryImage, base.poster.secondaryImage),
    },
    cta: {
      title: str(cta.title, base.cta.title),
      body: str(cta.body, base.cta.body),
    },
  };
}
