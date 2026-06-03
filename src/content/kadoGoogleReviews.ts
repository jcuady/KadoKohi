/**
 * Google Maps reviews for Kado Kohi (Marikina). Sync with:
 *   npm run sync:google-reviews
 * Source: https://www.google.com/search?q=kado+coffee+reviews&hl=en
 */
import type { StoredTestimonial } from '../store/landingContentStore';

export type GoogleReviewsListing = {
  name: string;
  placeLabel: string;
  rating: number;
  reviewCount: number;
  mapsUrl: string;
  reviewsUrl: string;
  shareUrl: string;
  address: string;
};

export const KADO_GOOGLE_LISTING: GoogleReviewsListing = {
  "name": "Kado Coffee",
  "placeLabel": "Kado Kohi — Marikina",
  "rating": 4.9,
  "reviewCount": 22,
  "mapsUrl": "https://www.google.com/maps/search/Kado+Kohi+Marikina",
  "reviewsUrl": "https://www.google.com/search?q=kado+coffee+reviews&hl=en",
  "shareUrl": "https://share.google/Y4fAFEabPt1hCeRcz",
  "address": "J.P. Laurel, Corner Mt Everest, Marikina, 1801 Metro Manila"
};

export const KADO_GOOGLE_REVIEWS_SYNCED_AT = "2026-06-03T08:31:37.864Z";

export const KADO_GOOGLE_REVIEW_ITEMS: StoredTestimonial[] = [
  {
    "id": 1,
    "name": "Princess Trinidad",
    "role": "Google review",
    "company": "",
    "content": "Small space but great coffee! Tried their signature Kado Latte (black sugar latte with torched muscovado). Thought it was going to be sweet but it wasn't. Loved the texture that the torched muscovado added! Definitely a must try 💯 …",
    "rating": 5,
    "avatar": "/google-review-avatars/review-1.jpg"
  },
  {
    "id": 2,
    "name": "Mazie Rukia Zaldivar",
    "role": "Google review",
    "company": "",
    "content": "Tried their Kado Latte and loved the muscovado—such a nice, healthier sweetener option. Also, the place is a great spot! I really love specialty coffee shops with cozy, small spaces. The staff were very accommodating, too. ☕",
    "rating": 5,
    "avatar": "/google-review-avatars/review-2.jpg"
  },
  {
    "id": 3,
    "name": "Liza",
    "role": "Google review",
    "company": "",
    "content": "Got the Kado Latte. It was good! Very accommodating staff - owner and guy at the counter 👍🏾 …",
    "rating": 5,
    "avatar": "/google-review-avatars/review-3.jpg"
  },
  {
    "id": 4,
    "name": "Roslyn Galano",
    "role": "Google review",
    "company": "",
    "content": "The drinks were amazing, and the atmosphere as well. The owner and staff were also really nice. I truly recommend this coffee shoppp!!!",
    "rating": 5,
    "avatar": "/google-review-avatars/review-4.jpg"
  },
  {
    "id": 5,
    "name": "Faye Jesuitas",
    "role": "Google review",
    "company": "",
    "content": "Good coffee, nice ambiance and pinaka the best is yung cx service! 🫶 …",
    "rating": 5,
    "avatar": "/google-review-avatars/review-5.jpg"
  },
  {
    "id": 6,
    "name": "Chelsey Aquino",
    "role": "Google review",
    "company": "",
    "content": "This is my 3rd time ordering from Kado coffee. Their drinks are all pretty good and plus matcha is decent too. i really love their Yuzu amerikado, Ube shio and Kado Latte. …",
    "rating": 5,
    "avatar": "/google-review-avatars/review-6.jpg"
  },
  {
    "id": 7,
    "name": "Chenin Bianca",
    "role": "Google review",
    "company": "",
    "content": "Triee there Nori Salted Cream Latte and it was so good. They have a very unique menu, and I'm from Alabang, so worth the visit!",
    "rating": 5,
    "avatar": "/google-review-avatars/review-7.jpg"
  },
  {
    "id": 8,
    "name": "deeps david",
    "role": "Google review",
    "company": "",
    "content": "fast wifi, fast service, great music, owner is chatty. got a free brownie with my drink",
    "rating": 5,
    "avatar": "/google-review-avatars/review-8.jpg"
  }
];

export function googleReviewsToTestimonials(): StoredTestimonial[] {
  return KADO_GOOGLE_REVIEW_ITEMS.map((t) => ({ ...t }));
}
