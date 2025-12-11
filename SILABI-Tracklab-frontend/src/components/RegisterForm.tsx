import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../utils/api';

export default function RegisterForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    role: 'user'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Client-side validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.register({
        full_name: formData.full_name,
        email: formData.email,
        username: formData.username,
        password: formData.password,
        role: formData.role
      });

      console.log('Registration successful:', response.data);
      setSuccess('Registration successful! Redirecting to login...');
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      console.error('Registration error:', err);
      
      // Handle specific error messages from backend
      if (err.response?.data?.error) {
        const errorMsg = err.response.data.error;
        
        // Provide user-friendly messages
        if (errorMsg.includes('Email already registered')) {
          setError('This email is already registered. Please use a different email or login.');
        } else if (errorMsg.includes('Username already taken')) {
          setError('This username is already taken. Please choose a different username.');
        } else if (errorMsg.includes('Invalid email format')) {
          setError('Please enter a valid email address.');
        } else if (errorMsg.includes('Email address is invalid or does not exist')) {
          setError('This email address appears to be invalid. Please check and try again.');
        } else {
          setError(errorMsg);
        }
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#000000' }}>
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold" style={{ color: '#29ADFF' }}>
            Create an account
          </h2>
          <p className="mt-2 text-center text-sm" style={{ color: '#C2C3C7' }}>
            Register to manage laboratory assets
          </p>
        </div>
        
        {error && (
          <div className="px-4 py-3 rounded-lg" style={{ 
            backgroundColor: '#7E2553',
            border: '1px solid #FF004D',
            color: '#FF77A8'
          }}>
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        
        {success && (
          <div className="px-4 py-3 rounded-lg" style={{ 
            backgroundColor: '#008751',
            border: '1px solid #00E436',
            color: '#FFEC27'
          }}>
            <span className="block sm:inline">{success}</span>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md space-y-4">
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium mb-1" style={{ color: '#C2C3C7' }}>
                Full name
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                required
                value={formData.full_name}
                onChange={handleChange}
                className="appearance-none rounded-lg relative block w-full px-3 py-2 focus:outline-none focus:ring-2 sm:text-sm"
                style={{ 
                  backgroundColor: '#1D2B53',
                  border: '1px solid #5F574F',
                  color: '#FFF1E8'
                }}
                placeholder="Jane Doe"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1" style={{ color: '#C2C3C7' }}>
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="appearance-none rounded-lg relative block w-full px-3 py-2 focus:outline-none focus:ring-2 sm:text-sm"
                style={{ 
                  backgroundColor: '#1D2B53',
                  border: '1px solid #5F574F',
                  color: '#FFF1E8'
                }}
                placeholder="you@school.edu"
              />
            </div>

            <div>
              <label htmlFor="username" className="block text-sm font-medium mb-1" style={{ color: '#C2C3C7' }}>
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={formData.username}
                onChange={handleChange}
                className="appearance-none rounded-lg relative block w-full px-3 py-2 focus:outline-none focus:ring-2 sm:text-sm"
                style={{ 
                  backgroundColor: '#1D2B53',
                  border: '1px solid #5F574F',
                  color: '#FFF1E8'
                }}
                placeholder="username"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-1" style={{ color: '#C2C3C7' }}>
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="appearance-none rounded-lg relative block w-full px-3 py-2 focus:outline-none focus:ring-2 sm:text-sm"
                  style={{ 
                    backgroundColor: '#1D2B53',
                    border: '1px solid #5F574F',
                    color: '#FFF1E8'
                  }}
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1" style={{ color: '#C2C3C7' }}>
                  Confirm
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="appearance-none rounded-lg relative block w-full px-3 py-2 focus:outline-none focus:ring-2 sm:text-sm"
                  style={{ 
                    backgroundColor: '#1D2B53',
                    border: '1px solid #5F574F',
                    color: '#FFF1E8'
                  }}
                />
              </div>
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium mb-1" style={{ color: '#C2C3C7' }}>
                Role
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="appearance-none rounded-lg relative block w-full px-3 py-2 focus:outline-none focus:ring-2 sm:text-sm"
                style={{ 
                  backgroundColor: '#1D2B53',
                  border: '1px solid #5F574F',
                  color: '#FFF1E8'
                }}
              >
                <option value="user">User</option>
                <option value="technician">Technician</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border-transparent text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
              style={{ 
                backgroundColor: '#29ADFF',
                color: '#000000'
              }}
              onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#00E436')}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#29ADFF'}
            >
              {loading ? 'Registering...' : 'Register'}
            </button>
          </div>

          <div className="text-center">
            <a href="/login" className="text-sm hover:opacity-80 transition" style={{ color: '#29ADFF' }}>
              Already have an account? Sign in
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}