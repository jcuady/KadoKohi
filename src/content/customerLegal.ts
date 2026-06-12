/** Customer-facing legal copy — update version when counsel revises documents. */
export const LEGAL_VERSION = '1.0';
export const LEGAL_EFFECTIVE_DATE = 'June 2, 2026';
export const LEGAL_CONTACT_EMAIL = 'kadocoffeeph@gmail.com';

export type LegalSection = {
  title: string;
  paragraphs: string[];
  bullets?: string[];
  /** Anchor id for in-page links (e.g. cookie banner → /legal/privacy#cookies). */
  id?: string;
};

export const TERMS_OF_SERVICE: LegalSection[] = [
  {
    title: '1. Agreement',
    paragraphs: [
      'These Terms of Service ("Terms") govern your use of the Kado Kohi website, customer account, and related online services at kadokohi.com and affiliated pages (the "Platform"), operated under the trade name Kado Kohi ("we," "us," or "our").',
      'By creating an account, placing an order, registering for an event, or otherwise using the Platform, you agree to these Terms and our Privacy Policy. If you do not agree, do not use the Platform.',
    ],
  },
  {
    title: '2. Who may use the Platform',
    paragraphs: [
      'You must be at least 18 years old, or the age of majority in the Philippines, to create an account and enter into binding transactions. If you are under 18, you may only use the Platform with the involvement and consent of a parent or legal guardian.',
      'You represent that the information you provide is accurate and that you will keep your login credentials confidential.',
    ],
  },
  {
    title: '3. Our services',
    paragraphs: [
      'Through the Platform you may browse our menu and merchandise, place pickup orders at participating branches, track order status, participate in the Kado Circle loyalty program, sign up for public events, and submit booth or private event booking inquiries.',
    ],
    bullets: [
      'Orders are for in-store pickup unless we explicitly launch delivery and update these Terms.',
      'Operating hours and branch availability are shown on the Platform; we may refuse or cancel orders outside hours or when items are unavailable.',
      'Menu descriptions and photos are for illustration; recipes and availability may change without notice.',
      'QR dine-in and takeout flows may be used without an account; account features such as loyalty stamps require registration.',
    ],
  },
  {
    title: '4. Account registration',
    paragraphs: [
      'When you sign up for a Kado Circle customer account, we collect your full name, email address, Philippine mobile number (+63), and a password you choose. Your password is stored securely by our authentication provider and is not visible to our staff in plain text.',
      'You are responsible for activity under your account. Notify us promptly if you suspect unauthorized access.',
      'We may suspend or terminate accounts that violate these Terms or applicable law.',
    ],
  },
  {
    title: '5. Orders and payment',
    paragraphs: [
      'Prices are shown in Philippine Pesos (PHP) before checkout. Applicable taxes or fees, if any, will be displayed at checkout.',
    ],
    bullets: [
      'Online cart checkout with GCash requires a signed-in customer account.',
      'GCash QR: you pay outside the app by scanning our shop QR, then upload a genuine payment screenshot or receipt image for staff verification. Orders remain unpaid until we confirm payment.',
      'Submitting false or misleading payment proof may result in cancellation and account action.',
      'GCash and other payment networks are third-party services; we are not responsible for their outages or errors.',
      'Order reference codes (e.g. KK-####) help us match your payment; include them in GCash notes when possible.',
      'Merchandise is claim-in-store only unless we state otherwise.',
    ],
  },
  {
    title: '6. Cancellations, refunds, and no-shows',
    paragraphs: [
      'Cancellation and refund rules depend on order status and payment verification. Unless required by law, completed sales of prepared food and beverage may not be refundable. Contact us at the email below for payment errors or exceptional circumstances; we will review cases in good faith.',
      'Staff may cancel orders that cannot be fulfilled, remain unpaid after a reasonable time, or involve suspected fraud.',
    ],
  },
  {
    title: '7. Kado Circle loyalty',
    paragraphs: [
      'Registered customers may earn stamps on completed drink orders as described on the Platform. Stamps and vouchers are non-transferable, have no cash value, and may be subject to expiry or program changes with reasonable notice.',
      'We may adjust stamp balances to correct errors or address abuse. Promotional codes and vouchers cannot be combined unless we explicitly allow it.',
    ],
  },
  {
    title: '8. Events and booth bookings',
    paragraphs: [
      'Event sign-ups and booth booking requests collect contact and event details you provide. Bookings are subject to review, availability, and separate confirmation or quotation. Deposits, cancellation, and rescheduling for private events will be communicated in your booking correspondence and may be supplemented by event-specific terms.',
    ],
  },
  {
    title: '9. Acceptable use',
    paragraphs: ['You agree not to:'],
    bullets: [
      'Provide false registration, payment, or booking information.',
      'Interfere with the Platform, scrape data without permission, or attempt unauthorized access.',
      'Use the Platform for unlawful purposes or to harass our team or other customers.',
      'Upload content that infringes others\' rights or contains malware.',
    ],
  },
  {
    title: '10. Intellectual property',
    paragraphs: [
      'Kado Kohi names, logos, menu content, and Platform design are owned by us or our licensors. You receive a limited license to use the Platform for personal, non-commercial ordering. Payment proof images you upload grant us a limited license to verify and process your transaction.',
    ],
  },
  {
    title: '11. Disclaimers and limitation of liability',
    paragraphs: [
      'The Platform and products are provided on an "as available" basis. To the fullest extent permitted by Philippine law, we disclaim warranties not required by law. We are not liable for indirect or consequential damages arising from your use of the Platform, third-party payment services, or events beyond our reasonable control (including weather, power, or supply disruptions).',
      'Nothing in these Terms limits rights that cannot be waived under the Consumer Act or other mandatory Philippine law.',
    ],
  },
  {
    title: '12. Governing law and disputes',
    paragraphs: [
      'These Terms are governed by the laws of the Republic of the Philippines. Disputes shall be brought in the courts of Marikina City or Metro Manila, unless otherwise required by law.',
    ],
  },
  {
    title: '13. Changes',
    paragraphs: [
      `We may update these Terms from time to time. The "Effective date" at the top shows the current version. Material changes may be highlighted on the Platform; continued use after changes constitutes acceptance.`,
    ],
  },
  {
    title: '14. Contact',
    paragraphs: [
      `Questions about these Terms: ${LEGAL_CONTACT_EMAIL}. Registered business details and official receipts are issued at our physical store in Marikina City, Philippines.`,
    ],
  },
];

export const PRIVACY_POLICY: LegalSection[] = [
  {
    title: '1. Introduction',
    paragraphs: [
      'Kado Kohi ("we," "us") respects your privacy. This Privacy Policy explains what personal information we collect through kadokohi.com and related customer services, how we use it, and your choices under the Philippine Data Privacy Act of 2012 (Republic Act No. 10173).',
      'By creating an account or using our services, you acknowledge this Policy alongside our Terms of Service.',
    ],
  },
  {
    title: '2. Personal information controller',
    paragraphs: [
      'The personal information controller for customer data collected through this Platform is Kado Kohi, with primary operations at J.P. Laurel St. Corner Mt. Everest, Marikina City, Philippines.',
      `Privacy inquiries: ${LEGAL_CONTACT_EMAIL}.`,
    ],
  },
  {
    title: '3. Information we collect',
    paragraphs: ['Depending on how you use the Platform, we may collect:'],
    bullets: [
      'Account data: full name, email address, Philippine mobile number (+63), password (stored in hashed form by our auth provider), loyalty stamp balance, and account timestamps.',
      'Order data: items ordered, prices, branch, table number (dine-in), guest name (if applicable), order channel, status, payment method, payment status, and GCash payment proof images you upload.',
      'Promotions and loyalty: promo codes applied, voucher codes, stamp transactions, and reward redemptions.',
      'Event registration: name, email, phone, and linked customer account when you sign up for events.',
      'Booth bookings: contact details, event name, occasion, guest count, schedule, package and add-on selections, special requests, and quotes we provide.',
      'Technical data: session tokens, device/browser information needed to operate the site, and optional push notification subscription data if you enable alerts.',
      'Communications: information you send via our contact form or email.',
    ],
  },
  {
    title: '4. How we use your information',
    paragraphs: ['We process personal information to:'],
    bullets: [
      'Create and manage your account and authenticate you.',
      'Accept, prepare, and fulfill pickup orders; verify GCash payments.',
      'Operate Kado Circle loyalty, vouchers, and promotional offers.',
      'Manage event registrations and booth booking inquiries.',
      'Send service-related notices (order status, account confirmations, and optional push notifications you opt into).',
      'Improve security, prevent fraud, and comply with law.',
      'Respond to your requests and support inquiries.',
    ],
  },
  {
    title: '5. Legal bases',
    paragraphs: [
      'We rely on performance of a contract (processing your orders and account), your consent (where required, such as optional notifications), and legitimate interests (security, fraud prevention, and improving our services), consistent with RA 10173.',
    ],
  },
  {
    title: '6. Sharing and service providers',
    paragraphs: [
      'We do not sell your personal information. We share data with trusted processors that help us run the Platform, including cloud hosting and database services (e.g. Supabase for authentication, database, and file storage) and frontend hosting (e.g. Vercel). These providers process data under contractual safeguards and only as needed to deliver the service.',
      'We may disclose information if required by law, court order, or to protect rights, safety, and property.',
    ],
  },
  {
    title: '7. Storage and retention',
    paragraphs: [
      'Payment proof images are stored in secured cloud storage accessible only to authorized staff. Order and account records are retained as needed for operations, accounting, dispute resolution, and legal compliance, then deleted or anonymized when no longer required.',
    ],
  },
  {
    title: '8. Security',
    paragraphs: [
      'We use industry-standard measures including encrypted connections (HTTPS), access controls, and role-based staff permissions. No method of transmission or storage is completely secure; please use a strong password and protect your device.',
    ],
  },
  {
    title: '9. Your rights',
    paragraphs: [
      'Under RA 10173 you may request access, correction, or deletion of personal information, object to certain processing, or withdraw consent where processing is consent-based. To exercise these rights, email us at the address above. We may verify your identity before responding.',
    ],
  },
  {
    id: 'cookies',
    title: '10. Cookies and local storage',
    paragraphs: [
      'We use essential cookies and local storage so the Platform works — for example to keep you signed in, remember your cart, and load site settings. These are necessary for the service you request and do not require separate consent under the Philippine Data Privacy Act of 2012 (Republic Act No. 10173).',
      'When you first visit, we show a cookie notice so you can accept or refuse optional cookies and similar technologies (such as preferences that help us improve the site). Accept and refuse are given equal prominence. Your choice is stored in your browser (local storage and a first-party cookie) for up to one year, or until you change it via “Cookie preferences” in the site footer.',
      'If you refuse optional cookies, we still provide the Platform using essential storage only. Optional push notifications, when offered, require a separate browser permission. We do not use third-party advertising cookies on the customer Platform as of the effective date above.',
    ],
  },
  {
    title: '11. Children',
    paragraphs: [
      'The Platform is not directed at children under 13. We do not knowingly collect personal information from children without appropriate parental consent.',
    ],
  },
  {
    title: '12. International transfers',
    paragraphs: [
      'Your data may be processed on servers located outside the Philippines through our cloud providers. We take steps to ensure appropriate safeguards consistent with applicable law.',
    ],
  },
  {
    title: '13. Changes to this Policy',
    paragraphs: [
      'We may update this Privacy Policy from time to time. The effective date at the top indicates the current version. Significant changes may be posted on the Platform.',
    ],
  },
  {
    title: '14. Contact',
    paragraphs: [
      `Privacy questions or data subject requests: ${LEGAL_CONTACT_EMAIL}.`,
    ],
  },
];
