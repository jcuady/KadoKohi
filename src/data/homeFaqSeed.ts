import type { FaqItemCopy } from '../store/landingContentStore';

/** First FAQ item — location (map link rendered in HomeFaqSection). */
export const HOME_FAQ_LOCATION_INDEX = 0;

/**
 * Homepage FAQ — brand voice from @kadocoffeeph carousel, tailored to kadokohi.com flows.
 */
export const SEED_HOME_FAQ_ITEMS: FaqItemCopy[] = [
  {
    question: 'Where are you located?',
    answer:
      'J.P. Laurel St. corner Mt. Everest, Marikina City, Philippines 1807.\n\nNearby landmarks: Marikina Science School and Shell Gas Station along Mayor Gil Fernando Ave.',
  },
  {
    question: 'What are your operating hours?',
    answer:
      'We are still on soft-opening operations. Follow @kadocoffeeph on Instagram for our weekly schedule and same-day updates.',
  },
  {
    question: 'How do I commute to Kado?',
    answer:
      'From Marikina Bayan / LRT Marikina–Pasig: ride a tricycle to Mountainview Village (get dropped near Marikina Catholic School).\n\nVia jeep: ride along Mayor Gil Fernando and get off at Marikina Catholic School, then walk.\n\nRide-hailing: search “Kado Coffee” in your app.',
  },
  {
    question: 'Do you have WiFi and sockets?',
    answer: 'Yes — we have WiFi and a limited number of sockets for guests.',
  },
  {
    question: 'Do you have parking?',
    answer: 'Yes — three (3) parking slots are available on a first-come basis.',
  },
  {
    question: 'Are you pet friendly?',
    answer: 'Pets are welcome in our alfresco area only.',
  },
  {
    question: 'Do you accept online orders?',
    answer:
      'Yes. Order on kadokohi.com — takeout pickup, table QR dine-in, and merch checkout. Pay with GCash QR (upload proof) or pay at the counter. Guest checkout works; create a Kado Circle account to track orders and stamps.',
  },
  {
    question: 'Can I order from my table with a QR code?',
    answer:
      'Yes. Scan the Kado QR on your table to open the dine-in menu, add items, and check out in your browser. We prepare your order for table service.',
  },
  {
    question: 'What is Kado Circle?',
    answer:
      'Our loyalty program. Create a free account, earn digital stamps on eligible drinks, and collect 10 stamps for a free drink. View your card under Account → Stamps.',
  },
  {
    question: 'How do I book the coffee booth for an event?',
    answer:
      'Visit Book Booth, choose a package (or submit a custom proposal), pick an available date, and send your request. Our team confirms availability and sends a quote — payment is only after approval.',
  },
  {
    question: 'Do you offer oat milk or plant-based options?',
    answer:
      'Yes. Oatside oat milk and soy milk are available on espresso drinks. Select your milk when customizing — oat and soy add ₱50 unless noted on the menu.',
  },
];
