import { useAuthStore } from '../../store/authStore';
import PosWorkspace from '../../components/pos/PosWorkspace';

export default function BaristaPOS() {
  const user = useAuthStore((s) => s.user);
  const lockedBranchId = user?.role === 'barista' ? user.branchId : null;

  return <PosWorkspace variant="barista" lockedBranchId={lockedBranchId} />;
}
