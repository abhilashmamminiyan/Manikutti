import ProtectedPage from '@/components/ProtectedPage';
import ProfileScreen from '@/screens/ProfileScreen';

export default function ProfilePage() {
  return (
    <ProtectedPage>
      <ProfileScreen />
    </ProtectedPage>
  );
}
