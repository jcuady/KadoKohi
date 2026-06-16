import type { FaqItemCopy } from '../store/landingContentStore';

/** Default homepage FAQ — ordering, loyalty, booth booking, and site policies. */
export const SEED_HOME_FAQ_ITEMS: FaqItemCopy[] = [
  {
    question: 'Where is Kado Kohi and what are your hours?',
    answer:
      'Our flagship cafe is at J.P. Laurel St. corner Mt. Everest, Sta. Elena, Marikina City. We are open daily, 7:00 AM to 11:00 PM. A Greenhills branch is coming soon — follow @kadocoffeeph for updates.',
  },
  {
    question: 'How do I order online for pickup?',
    answer:
      'Go to All Coffee or Pastries, add items to your cart, choose takeout pickup, and check out with GCash QR or cash at the counter. Guest checkout is available — no account required.',
  },
  {
    question: 'Can I order from my table with a QR code?',
    answer:
      'Yes. Scan the Kado QR card on your table to open the dine-in menu in your browser. Place your order, pay via GCash (upload proof) or choose pay-at-counter cash, and we will bring drinks to your table.',
  },
  {
    question: 'What is Mix & Match and how does the bundle discount work?',
    answer:
      'Pair any Kado Kohi drink with a Kukidō cookie on the homepage or Pastries page. Order drink only, cookie only, or both together — when you bundle a drink and cookie, you get 10% off the pair automatically at checkout.',
  },
  {
    question: 'How does GCash payment work for online orders?',
    answer:
      'After placing your order, scan our GCash QR, pay the exact total shown, and upload your payment screenshot. Our barista confirms payment before your order is prepared. You can switch to pay-at-counter cash from your order status page while it is still pending.',
  },
  {
    question: 'What is Kado Circle and how do stamps work?',
    answer:
      'Kado Circle is our loyalty program. Create a customer account, earn a digital stamp on eligible drinks, and collect 10 stamps for a free drink. View your card anytime under Account → Stamps.',
  },
  {
    question: 'How do I book the coffee booth for an event?',
    answer:
      'Visit Book Booth, pick a package (or submit a custom proposal), choose an available date, and send your request. Our team reviews availability and sends a final quote — no payment is required until your booking is confirmed.',
  },
  {
    question: 'How do Kado Events sign-ups work?',
    answer:
      'Browse Events for tambayan nights and community pop-ups. When sign-ups are open, register with your details on the event page. Capacity is limited — confirmation is shown on screen after you submit.',
  },
  {
    question: 'Do you offer oat milk or plant-based options?',
    answer:
      'Yes. Oatside oat milk and soy milk are available on espresso drinks. Select your milk when customizing — oat and soy add ₱50 to the base price unless noted on the menu.',
  },
  {
    question: 'How does this site use cookies?',
    answer:
      'We use essential cookies and local storage for your cart, sign-in session, and site settings. On first visit you can accept or refuse optional cookies with equal prominence. Details are in our Privacy Policy under Cookies and local storage.',
  },
];
