import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import trackLabLogo from '../assets/tracklab-logo.jpg';

const Navigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  const handleLogout = () => {
    // Add any logout logic here (e.g., clearing localStorage, cookies, etc.)
    localStorage.removeItem('token'); // If you're using token-based auth
    navigate('/login'); // Redirect to login page
  };

  const getLinkClass = (path: string) => {
    const isActive = currentPath === path;
    return isActive 
      ? "text-blue-700 font-medium hover:underline" 
      : "text-gray-600 hover:text-blue-700 font-medium hover:underline";
  };

  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-white rounded-t-2xl shadow border-b">
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