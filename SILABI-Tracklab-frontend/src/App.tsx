import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Navigation from './components/Navigation';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Dashboard from './pages/Dashboard';
import Assets from './pages/Assets';
import History from './pages/History';
import Notifications from './pages/Notifications';
import { authAPI } from './utils/api';
import { supabase } from './utils/supabase';
import { Session } from '@supabase/supabase-js';

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [supabaseSession, setSupabaseSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const token = authAPI.getToken();

  useEffect(() => {
    // Check for Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('ProtectedRoute - JWT token:', !!token, 'Supabase session:', !!session);
      setSupabaseSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('ProtectedRoute - Auth changed:', event, !!session);
      setSupabaseSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  // Allow access if EITHER JWT token OR Supabase session exists
  const isAuthenticated = !!token || !!supabaseSession;
  
  console.log('ProtectedRoute - Is authenticated:', isAuthenticated);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

// Public Route Component
function PublicRoute({ children }: { children: React.ReactNode }) {
  const [supabaseSession, setSupabaseSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const token = authAPI.getToken();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSupabaseSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSupabaseSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  const isAuthenticated = !!token || !!supabaseSession;
  
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isProcessingAuth, setIsProcessingAuth] = useState(false);
  const hideNavPaths = ['/login', '/register'];
  const showNavigation = !hideNavPaths.includes(location.pathname);

  useEffect(() => {
  const hash = window.location.hash;
  
  if (hash && hash.includes('access_token')) {
    console.log('⏳ Waiting for Supabase to process URL hash...');
    setIsProcessingAuth(true);
    
    // Wait a bit for Supabase to process the hash
    const timer = setTimeout(() => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        console.log('✅ Session after waiting:', !!session);
        if (session) {
          window.history.replaceState(null, '', '/');
          navigate('/', { replace: true });
        }
        setIsProcessingAuth(false);
      });
    }, 1000); // Give Supabase 1 second to process
    
    return () => clearTimeout(timer);
  }

  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    console.log('App - Auth event:', event, 'Has session:', !!session);

    if (event === 'SIGNED_IN' && session) {
      console.log('✅ SIGNED_IN event');
      setIsProcessingAuth(false);
      window.history.replaceState(null, '', '/');
      navigate('/', { replace: true });
    }

    if (event === 'SIGNED_OUT') {
      navigate('/login', { replace: true });
    }
  });

  return () => subscription.unsubscribe();
}, [navigate]);

  if (isProcessingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Completing sign in...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {showNavigation && <Navigation />}
      <main>
        <Routes>
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } 
          />
          <Route 
            path="/register" 
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            } 
          />
          
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Profile/>
              </ProtectedRoute>}
          />
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/assets" 
            element={
              <ProtectedRoute>
                <Assets />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/history" 
            element={
              <ProtectedRoute>
                <History />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/notifications" 
            element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            } 
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;