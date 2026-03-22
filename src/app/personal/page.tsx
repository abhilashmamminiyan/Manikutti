'use client';

import PersonalDashboard from '@/screens/PersonalDashboard';
import ProtectedPage from '@/components/ProtectedPage';

export default function PersonalPage() {
  return (
    <ProtectedPage>
      <PersonalDashboard />
    </ProtectedPage>
  );
}

