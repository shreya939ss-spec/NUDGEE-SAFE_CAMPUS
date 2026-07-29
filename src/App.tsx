import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import AuthScreen from '@/components/AuthScreen';
import StudentApp from '@/components/student/StudentApp';
import AdminApp from '@/components/admin/AdminApp';
import { SplashScreen, LoadingScreen } from '@/components/Logo';
import { NetworkGuard } from '@/components/NetworkGuard';

function Gate() {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return <LoadingScreen message="Loading your campus companion..." />;
  }

  if (!session || !profile) return <AuthScreen />;
  return profile.role === 'admin' ? <AdminApp /> : <StudentApp />;
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 10000);
    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return <SplashScreen onDone={() => setShowSplash(false)} />;
  }

  return (
    <AuthProvider>
      <NetworkGuard>
        <Gate />
      </NetworkGuard>
    </AuthProvider>
  );
}
