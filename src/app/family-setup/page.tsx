import ProtectedPage from '@/components/ProtectedPage';
import FamilySetupScreen from '@/screens/FamilySetupScreen';

export default function FamilySetupPage() {
  return (
    <ProtectedPage>
      <FamilySetupScreen />
    </ProtectedPage>
  );
}
