import AdminDashboard from '@/screens/AdminDashboard';
import ProtectedPage from '@/components/ProtectedPage';

export default function PersonalPage() {
  return (
    <ProtectedPage>
      <AdminDashboard />
    </ProtectedPage>
  );
}

