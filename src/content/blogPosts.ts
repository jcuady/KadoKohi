export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readMinutes: number;
  imageUrl: string;
  imageAlt: string;
  body: string[];
};

/** Editorial posts — community runs, tambayan, and brand stories. */
export const BLOG_POSTS: BlogPost[] = [
  {
    id: 'kado-run-2026',
    slug: 'kado-run-community-morning',
    title: 'Kado Run: Coffee, Community & Marikina Mornings',
    excerpt:
      'Our first community run brought neighbors, regulars, and new friends together — espresso after the finish line included.',
    category: 'Community',
    date: '2026-03-15',
    readMinutes: 4,
    imageUrl: '/images/hero-interior.png',
    imageAlt: 'Kado Kohi cafe interior after a community morning event',
    body: [
      'Kado Run started as a simple idea: move together, then recover together over matcha and espresso at the corner.',
      'Runners gathered at Sta. Elena before sunrise. We kept the route neighborhood-friendly — flat stretches along familiar Marikina streets so first-timers felt welcome.',
      'At the cafe, baristas poured KADO Latte and Matcha Oat Latte while the team shared pastries from the day’s bake. The energy felt like our tambayan at its best: warm, unhurried, and full of conversation.',
      'More community mornings are coming. Follow @kadocoffeeph for the next Kado Run date and sign-up details.',
    ],
  },
  {
    id: 'tambayan-nights',
    slug: 'tambayan-nights-at-the-corner',
    title: 'Tambayan Nights at the Corner',
    excerpt:
      'Slow evenings, vinyl-adjacent playlists, and the kind of conversations that only happen when the cups stay full.',
    category: 'Events',
    date: '2026-02-28',
    readMinutes: 3,
    imageUrl: '/images/hero-coffee.png',
    imageAlt: 'Specialty coffee prepared at Kado Kohi',
    body: [
      'Tambayan nights are our love letter to the neighborhood — no stage, no pressure, just good coffee and people who stay a little longer.',
      'We rotate small activations: latte art throwdowns, guest baristas, and seasonal drink previews for the Kado Circle.',
      'If you have an idea for a community night, reach out through our contact page or say hi in-store on J.P. Laurel.',
    ],
  },
  {
    id: 'booth-season',
    slug: 'mobile-booth-season-guide',
    title: 'Booking the Kado Mobile Booth This Season',
    excerpt:
      'Weddings, birthdays, and corporate gatherings — what to expect when Kado Kohi rolls up to your event.',
    category: 'Booth',
    date: '2026-01-10',
    readMinutes: 5,
    imageUrl: '/booth-photos/booth-1.jpg',
    imageAlt: 'Kado Kohi mobile coffee booth setup at an outdoor event',
    body: [
      'Our mobile booth brings the same quality bar as the cafe — curated menu, branded cups, and a team that knows how to keep lines moving without losing warmth.',
      'Start with the booth booking form so we can estimate guest count, power access, and setup window. We’ll follow up with a quote and menu options.',
      'Peak season fills quickly. Book early for weekends and holiday dates in Metro Manila and Marikina.',
    ],
  },
];

export function blogPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}
