import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/tailwind.css';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

// Simple state for demo navigation
function App() {
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);

  // Replace with real authentication logic
  return isLoggedIn ? (
    <Dashboard />
  ) : (
    <Login />
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);