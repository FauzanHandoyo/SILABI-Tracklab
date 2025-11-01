import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navigation from './components/Navigation';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Assets from './pages/Assets';
import History from './pages/History';
import Notifications from './pages/Notifications';
import { authAPI } from './utils/api';

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = authAPI.getToken();
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

// Public Route Component (redirect to dashboard if already logged in)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const token = authAPI.getToken();
  
  if (token) {
    return <Navigate to="/" replace />;
  }
  
  return children;
}

function App() {
  const location = useLocation();
  const hideNavPaths = ['/login', '/register'];
  const showNavigation = !hideNavPaths.includes(location.pathname);

  return (
    <div className="min-h-screen bg-gray-100">
      {showNavigation && <Navigation />}
      <main>
        <Routes>
          {/* Public routes */}
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
          
          {/* Protected routes */}
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

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;