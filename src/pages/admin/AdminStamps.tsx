import { Link } from 'react-router-dom';
import LoyaltyStampsCounter from '../../components/loyalty/LoyaltyStampsCounter';

export default function AdminStamps() {
  return (
    <div className="dash-page max-w-3xl">
      <p className="mb-4 text-xs dash-muted">
        Counter mode for stamp adjustments. For full member management (vouchers, reset, delete), see{' '}
        <Link to="/admin/loyalty" className="font-semibold text-kado-red hover:underline">
          Loyalty → Members
        </Link>
        .
      </p>
      <LoyaltyStampsCounter adjustReason="Counter adjustment (admin)" embedded />
    </div>
  );
}
