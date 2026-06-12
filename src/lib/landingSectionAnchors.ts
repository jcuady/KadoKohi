import type { LandingTabId } from './landingCmsTabs';

/** DOM ids on the public homepage — used to scroll the admin preview to the active CMS tab. */
export const LANDING_SECTION_IDS: Record<LandingTabId, string> = {
  hero: 'landing-hero',
  story: 'landing-story',
  'menu-seo': 'landing-menu-seo',
  featured: 'landing-featured',
  ordering: 'landing-ordering',
  schedule: 'landing-schedule',
  events: 'landing-events',
  testimonials: 'landing-testimonials',
  branches: 'landing-branches',
  'kado-circle': 'landing-kado-circle',
};
