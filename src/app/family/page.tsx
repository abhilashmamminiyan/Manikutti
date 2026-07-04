import ProtectedPage from '@/components/ProtectedPage';
import AdminDashboard from '@/screens/AdminDashboard';

export default function FamilyPage() {
  return (
    <ProtectedPage>
      <AdminDashboard />
    </ProtectedPage>
  );
}
