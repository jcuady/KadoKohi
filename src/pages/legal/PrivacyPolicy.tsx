import LegalDocumentPage from '../../components/legal/LegalDocumentPage';
import { PRIVACY_POLICY } from '../../content/customerLegal';

export default function PrivacyPolicy() {
  return (
    <LegalDocumentPage
      title="Privacy Policy"
      subtitle="How Kado Kohi collects, uses, and protects your personal information when you order, earn stamps, join events, or book with us."
      sections={PRIVACY_POLICY}
      sibling={{ label: 'Terms of Service', to: '/legal/terms' }}
    />
  );
}
