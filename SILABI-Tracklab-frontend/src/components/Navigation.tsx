import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import trackLabLogo from '../assets/tracklab-logo.jpg';
import { authAPI } from '../utils/api';
import { supabase } from '../utils/supabase';

const Navigation = () => {
  const navigate = useNavigate();

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

  return (
    <nav className="bg-white shadow-md px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <img src={trackLabLogo} alt="TrackLab Logo" className="h-16 w-36 rounded-full object-cover" />
        <div>
          <span className="font-bold text-lg text-gray-900">SILABI</span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Link to="/profile" className={getLinkClass('/profile')}>Profile</Link>
        <Link to="/" className={getLinkClass('/')}>Dashboard</Link>
        <Link to="/assets" className={getLinkClass('/assets')}>Assets</Link>
        <Link to="/history" className={getLinkClass('/history')}>History</Link>
        <Link to="/notifications" className={getLinkClass('/notifications')}>Notifications</Link>
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