import LegalDocumentPage from '../../components/legal/LegalDocumentPage';
import { TERMS_OF_SERVICE } from '../../content/customerLegal';

export default function TermsOfService() {
  return (
    <LegalDocumentPage
      title="Terms of Service"
      subtitle="Rules for using your Kado Kohi account, placing orders, paying via GCash, and participating in Kado Circle and our events."
      sections={TERMS_OF_SERVICE}
      sibling={{ label: 'Privacy Policy', to: '/legal/privacy' }}
    />
  );
}
