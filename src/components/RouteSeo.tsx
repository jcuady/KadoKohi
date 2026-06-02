import { useEffect, useMemo } from 'react';
import { matchPath, useLocation } from 'react-router-dom';
import { getSiteOrigin } from '../lib/siteUrl';

type RouteMeta = {
  title: string;
  description: string;
  noindex?: boolean;
};

const DEFAULT_OG_IMAGE = '/logo/Logo1.png';

const PUBLIC_META: Array<{ path: string; meta: RouteMeta }> = [
  {
    path: '/',
    meta: {
      title: 'Kado Kohi — Specialty Coffee in Marikina City',
      description:
        'Kado Kohi serves handcrafted specialty coffee, curated food, events, and merch in Marikina City.',
    },
  },
  {
    path: '/menu',
    meta: {
      title: 'Coffee Menu | Kado Kohi',
      description:
        'Explore Kado Kohi coffee, non-coffee, food, and seasonal favorites prepared fresh in Marikina.',
    },
  },
  {
    path: '/merch',
    meta: {
      title: 'Merch | Kado Kohi',
      description:
        'Shop official Kado Kohi merch for pickup and bring the Kado identity with you.',
    },
  },
  {
    path: '/events',
    meta: {
      title: 'Kado Events | Kado Kohi',
      description:
        'Discover upcoming Kado Kohi events and sign up online for the latest happenings.',
    },
  },
  {
    path: '/book/booth',
    meta: {
      title: 'Booth & Event Booking | Kado Kohi',
      description:
        'Book Kado Kohi for celebrations and private events. Build your estimate and submit your booking request online.',
    },
  },
  {
    path: '/branches',
    meta: {
      title: 'Branches | Kado Kohi',
      description:
        'Find Kado Kohi branches, schedules, and location details in Marikina and nearby areas.',
    },
  },
  {
    path: '/about',
    meta: {
      title: 'About Us | Kado Kohi',
      description:
        'Learn the story and vision behind Kado Kohi, a community-first specialty coffee experience.',
    },
  },
  {
    path: '/contact',
    meta: {
      title: 'Contact Us | Kado Kohi',
      description:
        'Get in touch with Kado Kohi for store concerns, collaborations, and event inquiries.',
    },
  },
];

const NOINDEX_PATTERNS = [
  '/admin/*',
  '/barista/*',
  '/staff/*',
  '/account/*',
  '/auth/*',
  '/management-portal',
  '/order/qr/:code',
  '/order/takeout',
  '/help/install',
  '*',
];

function upsertMetaByName(name: string, content: string) {
  let node = document.head.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  if (!node) {
    node = document.createElement('meta');
    node.setAttribute('name', name);
    document.head.appendChild(node);
  }
  node.setAttribute('content', content);
}

function upsertMetaByProperty(property: string, content: string) {
  let node = document.head.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;
  if (!node) {
    node = document.createElement('meta');
    node.setAttribute('property', property);
    document.head.appendChild(node);
  }
  node.setAttribute('content', content);
}

function upsertCanonical(href: string) {
  let node = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!node) {
    node = document.createElement('link');
    node.setAttribute('rel', 'canonical');
    document.head.appendChild(node);
  }
  node.setAttribute('href', href);
}

function upsertJsonLd(id: string, json: unknown) {
  let node = document.head.querySelector(`script[data-seo-id="${id}"]`) as HTMLScriptElement | null;
  if (!node) {
    node = document.createElement('script');
    node.setAttribute('type', 'application/ld+json');
    node.setAttribute('data-seo-id', id);
    document.head.appendChild(node);
  }
  node.text = JSON.stringify(json);
}

function resolveMeta(pathname: string): RouteMeta {
  const explicit = PUBLIC_META.find(({ path }) => matchPath({ path, end: true }, pathname));
  if (explicit) return explicit.meta;

  const isNoindex = NOINDEX_PATTERNS.some((pattern) => matchPath({ path: pattern, end: false }, pathname));
  if (isNoindex) {
    return {
      title: 'Kado Kohi',
      description: 'Kado Kohi internal page.',
      noindex: true,
    };
  }

  return {
    title: 'Kado Kohi — Specialty Coffee in Marikina City',
    description:
      'Kado Kohi serves handcrafted specialty coffee, curated food, events, and merch in Marikina City.',
  };
}

export default function RouteSeo() {
  const location = useLocation();
  const origin = getSiteOrigin();
  const pathname = location.pathname;
  const canonical = `${origin}${pathname}`;
  const meta = useMemo(() => resolveMeta(pathname), [pathname]);

  useEffect(() => {
    document.title = meta.title;
    upsertMetaByName('description', meta.description);
    upsertMetaByName('robots', meta.noindex ? 'noindex, nofollow' : 'index, follow');

    upsertMetaByProperty('og:title', meta.title);
    upsertMetaByProperty('og:description', meta.description);
    upsertMetaByProperty('og:type', 'website');
    upsertMetaByProperty('og:url', canonical);
    upsertMetaByProperty('og:site_name', 'Kado Kohi');
    upsertMetaByProperty('og:image', `${origin}${DEFAULT_OG_IMAGE}`);

    upsertMetaByName('twitter:card', 'summary_large_image');
    upsertMetaByName('twitter:title', meta.title);
    upsertMetaByName('twitter:description', meta.description);
    upsertMetaByName('twitter:image', `${origin}${DEFAULT_OG_IMAGE}`);

    upsertCanonical(canonical);

    upsertJsonLd('localbusiness', {
      '@context': 'https://schema.org',
      '@type': 'CafeOrCoffeeShop',
      name: 'Kado Kohi',
      url: origin,
      image: `${origin}${DEFAULT_OG_IMAGE}`,
      servesCuisine: ['Coffee', 'Cafe'],
      areaServed: 'Marikina City',
      sameAs: ['https://www.kadokohi.com/'],
    });

    if (pathname === '/events') {
      upsertJsonLd('breadcrumbs', {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${origin}/` },
          { '@type': 'ListItem', position: 2, name: 'Kado Events', item: `${origin}/events` },
        ],
      });
    } else {
      const breadcrumbs = document.head.querySelector('script[data-seo-id="breadcrumbs"]');
      breadcrumbs?.remove();
    }
  }, [canonical, meta, origin, pathname]);

  return null;
}
