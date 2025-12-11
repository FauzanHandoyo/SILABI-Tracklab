import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import trackLabLogo from '../assets/tracklab-logo(NEW).jpg';
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
    const isActive = window.location.pathname === path;
    return isActive
      ? 'font-semibold transition'
      : 'transition hover:opacity-80';
  };

  const getLinkStyle = (path: string) => {
    const isActive = window.location.pathname === path;
    return {
      color: isActive ? '#29ADFF' : '#C2C3C7'
    };
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
    { to: '/requests', label: 'Requests' },
    { to: '/history', label: 'History' },
    { to: '/notifications', label: 'Notifications' },
  ];

  const linksToRender = role === 'admin' || role === 'technician' ? adminLinks : userLinks;

  return (
    <nav className="px-6 py-4 flex items-center justify-between shadow-lg" style={{ 
      backgroundColor: '#1D2B53',
      borderBottom: '2px solid #5F574F'
    }}>
      <div className="flex items-center gap-3">
        <img 
          src={trackLabLogo} 
          alt="TrackLab Logo" 
          className="h-12 w-12 rounded-full object-cover" 
          style={{ border: '2px solid #29ADFF' }}
        />
        <div>
          <span className="font-bold text-2xl" style={{ color: '#29ADFF' }}>SILABI</span>
          <div className="text-xs" style={{ color: '#83769C' }}>Asset Management System</div>
        </div>
      </div>
      <div className="flex items-center gap-6">
        {linksToRender.map((l) => (
          <Link 
            key={l.to} 
            to={l.to} 
            className={getLinkClass(l.to)}
            style={getLinkStyle(l.to)}
          >
            {l.label}
          </Link>
        ))}
        <button
          onClick={handleLogout}
          className="ml-4 px-4 py-2 rounded-lg font-semibold transition"
          style={{ 
            backgroundColor: '#FF004D',
            color: '#FFF1E8'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#7E2553'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FF004D'}
        >
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navigation;