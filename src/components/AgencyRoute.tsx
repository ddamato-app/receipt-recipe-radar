import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export function AgencyRoute({ children }: { children: React.ReactNode }) {
  const auth = useAuth();

  if (auth?.isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-950">
        <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!auth?.user) {
    return <Navigate to="/landing" replace />;
  }

  return <>{children}</>;
}
