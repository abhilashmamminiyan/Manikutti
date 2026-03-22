import ProtectedPage from '@/components/ProtectedPage';
import FamilyDashboard from '@/screens/FamilyDashboard';

export default function FamilyPage() {
  return (
    <ProtectedPage>
      <FamilyDashboard />
    </ProtectedPage>
  );
}
