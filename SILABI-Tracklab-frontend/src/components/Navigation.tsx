import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import trackLabLogo from '../assets/tracklab-logo.jpg';
import { authAPI } from '../utils/api';
import { supabase } from '../utils/supabase';

const Navigation = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed?.role) {
          setRole(parsed.role);
          return;
        }
      } catch {
        // ignore parse error
      }
    }

    // Fallback: try to get role from Supabase user metadata
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const r =
          // attempt common metadata places
          (user.user_metadata as any)?.role ||
          (user.app_metadata as any)?.role ||
          null;
        if (r) {
          setRole(r);
          // persist role to localStorage for quicker subsequent loads
          const existing = stored ? JSON.parse(stored || '{}') : {};
          localStorage.setItem('user', JSON.stringify({ ...existing, role: r }));
        } else {
          setRole(null);
        }
      }
    });
  }, []);

  const handleLogout = async () => {
    try {
      // Clear JWT token
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Sign out from Supabase
      await supabase.auth.signOut();

      // Navigate to login
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Force navigation even if there's an error
      navigate('/login');
    }
  };

  const getLinkClass = (path: string) => {
    return window.location.pathname === path
      ? 'text-blue-600 font-semibold'
      : 'text-gray-600 hover:text-blue-600';
  };

  // Default minimal links for plain "user"
  const userLinks = [
    { to: '/profile', label: 'Profile' },
    { to: '/', label: 'Dashboard' },
    { to: '/assets', label: 'Assets' },
  ];

  // Extended links for "admin" and "technician"
  const adminLinks = [
    { to: '/profile', label: 'Profile' },
    { to: '/', label: 'Dashboard' },
    { to: '/assets', label: 'Assets' },
    { to: '/history', label: 'History' },
    { to: '/notifications', label: 'Notifications' },
    // add admin-only routes here, e.g. { to: '/manage-users', label: 'Manage Users' }
  ];

  const linksToRender = role === 'admin' || role === 'technician' ? adminLinks : userLinks;

  return (
    <nav className="bg-white shadow-md px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <img src={trackLabLogo} alt="TrackLab Logo" className="h-16 w-36 rounded-full object-cover" />
        <div>
          <span className="font-bold text-lg text-gray-900">SILABI</span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        {linksToRender.map((l) => (
          <Link key={l.to} to={l.to} className={getLinkClass(l.to)}>
            {l.label}
          </Link>
        ))}
        <button
          onClick={handleLogout}
          className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navigation;