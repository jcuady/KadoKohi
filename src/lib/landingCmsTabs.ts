export const LANDING_CMS_TABS = [
  { id: 'hero', label: 'Hero', hint: 'Homepage slider — labels, CTAs, slide backgrounds, and card images.' },
  { id: 'story', label: 'Brand story', hint: 'SEO intro below the hero — headline, pillars, and social block.' },
  { id: 'menu-seo', label: 'Menu SEO', hint: 'Matcha / signatures / classics / sodas & yuzu pillar cards and SEO body copy.' },
  { id: 'featured', label: 'Featured', hint: 'Three showcase drinks — copy, product picks, and optional card photos.' },
  { id: 'ordering', label: 'How to order', hint: 'Four-step ordering carousel copy.' },
  { id: 'events', label: 'Kado Events', hint: 'Events block headings and optional cover image override.' },
  { id: 'testimonials', label: 'Testimonials', hint: 'Google reviews section, trusted brands, and customer quotes.' },
  {
    id: 'branches',
    label: 'Branches',
    hint: 'Branches strip badge, title, and CTA — branch rows come from Branches admin.',
  },
  {
    id: 'about',
    label: 'About page',
    hint: '/about hero — headline accents, tagline, soft opening, location, and photo.',
  },
  {
    id: 'faq',
    label: 'FAQ',
    hint: 'Good-to-know accordion — ordering, loyalty, booth booking, and site policies.',
  },
  { id: 'kado-circle', label: 'Kado Circle', hint: 'Membership CTA, Friends of the corner (CRUD), and stats.' },
] as const;

export type LandingTabId = (typeof LANDING_CMS_TABS)[number]['id'];

export function isLandingTabId(value: string): value is LandingTabId {
  return LANDING_CMS_TABS.some((tab) => tab.id === value);
}
