import React, { useEffect, useState } from 'react';
import { userAPI } from '../utils/api';

export default function Profile() {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    username: '',
    role: '',
    created_at: '',
    oauth_provider: '',
    last_login: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [isFirstLogin, setIsFirstLogin] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getCurrentUser();
      const userData = response.data;
      
      setFormData({
        full_name: userData.full_name || '',
        email: userData.email || '',
        username: userData.username || '',
        role: userData.role || '',
        created_at: userData.created_at || '',
        oauth_provider: userData.oauth_provider || '',
        last_login: userData.last_login || ''
      });
      
      setIsFirstLogin(!!userData.oauth_provider && !userData.last_login);
      setError('');
    } catch (err: any) {
      console.error('Error loading profile:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setSuccess('');
    setError('');
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
    setPasswordSuccess('');
    setPasswordError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const updateData: any = {
        full_name: formData.full_name,
        email: formData.email,
        username: formData.username
      };

      if (isFirstLogin) {
        updateData.role = formData.role;
      }

      const response = await userAPI.updateCurrentUser(updateData);
      
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = { ...currentUser, ...response.data.user };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      setSuccess('Profile updated successfully!');
      
      if (isFirstLogin) {
        setIsFirstLogin(false);
      }
      
      await loadProfile();
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long');
      return;
    }

    setChangingPassword(true);

    try {
      await userAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      setPasswordSuccess('Password changed successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowPasswordForm(false);
    } catch (err: any) {
      console.error('Error changing password:', err);
      setPasswordError(err.response?.data?.error || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleReset = () => {
    loadProfile();
    setSuccess('');
    setError('');
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit',
      timeZone: 'Asia/Jakarta'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#000000' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#29ADFF' }}></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4" style={{ backgroundColor: '#000000' }}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold" style={{ 
            backgroundColor: '#29ADFF',
            color: '#000000'
          }}>
            {formData.full_name.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <h1 className="text-3xl font-bold" style={{ color: '#FFF1E8' }}>{formData.full_name || 'User'}</h1>
            <p style={{ color: '#83769C' }}>Role: {formData.role}</p>
          </div>
        </div>

        {/* First-time OAuth user notice */}
        {isFirstLogin && (
          <div className="mb-6 p-4 rounded-lg" style={{ 
            backgroundColor: '#1D2B53',
            border: '1px solid #29ADFF'
          }}>
            <h3 className="font-semibold mb-2" style={{ color: '#29ADFF' }}>Welcome! Complete Your Profile</h3>
            <p className="text-sm" style={{ color: '#C2C3C7' }}>
              This is your first login. Please select your role below and complete your profile information.
            </p>
          </div>
        )}

        {/* Profile Information Form */}
        <div className="rounded-lg shadow-lg p-6 mb-6" style={{ 
          backgroundColor: '#1D2B53',
          border: '1px solid #5F574F'
        }}>
          <h2 className="text-xl font-semibold mb-4" style={{ color: '#29ADFF' }}>Profile Information</h2>
          
          {error && (
            <div className="mb-4 p-3 rounded" style={{ 
              backgroundColor: '#7E2553',
              border: '1px solid #FF004D',
              color: '#FF77A8'
            }}>
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-3 rounded" style={{ 
              backgroundColor: '#008751',
              border: '1px solid #00E436',
              color: '#FFEC27'
            }}>
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#C2C3C7' }}>
                Full name
              </label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2"
                style={{ 
                  backgroundColor: '#000000',
                  border: '1px solid #5F574F',
                  color: '#FFF1E8'
                }}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#C2C3C7' }}>
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2"
                style={{ 
                  backgroundColor: !!formData.oauth_provider ? '#5F574F' : '#000000',
                  border: '1px solid #5F574F',
                  color: '#FFF1E8'
                }}
                required
                disabled={!!formData.oauth_provider}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#C2C3C7' }}>
                Username
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2"
                style={{ 
                  backgroundColor: '#000000',
                  border: '1px solid #5F574F',
                  color: '#FFF1E8'
                }}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#C2C3C7' }}>
                Role
              </label>
              {isFirstLogin ? (
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2"
                  style={{ 
                    backgroundColor: '#000000',
                    border: '1px solid #5F574F',
                    color: '#FFF1E8'
                  }}
                  required
                >
                  <option value="">Select a role</option>
                  <option value="user">User</option>
                  <option value="technician">Technician</option>
                  <option value="admin">Admin</option>
                </select>
              ) : (
                <input
                  type="text"
                  value={formData.role}
                  className="w-full px-3 py-2 rounded-lg"
                  style={{ 
                    backgroundColor: '#5F574F',
                    border: '1px solid #5F574F',
                    color: '#C2C3C7'
                  }}
                  disabled
                />
              )}
              {isFirstLogin && (
                <p className="mt-1 text-sm" style={{ color: '#83769C' }}>
                  Please select your role. This can only be changed by an administrator after your first login.
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
                style={{ 
                  backgroundColor: '#29ADFF',
                  color: '#000000'
                }}
                onMouseEnter={(e) => !saving && (e.currentTarget.style.backgroundColor = '#00E436')}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#29ADFF'}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="px-6 py-2 rounded-lg transition"
                style={{ 
                  backgroundColor: '#7E2553',
                  color: '#C2C3C7'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#AB5236'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#7E2553'}
              >
                Reset
              </button>
            </div>
          </form>

          <div className="mt-6 pt-6" style={{ borderTop: '1px solid #5F574F' }}>
            <p className="text-sm" style={{ color: '#83769C' }}>
              <span className="font-medium" style={{ color: '#C2C3C7' }}>Member since:</span> {formatDate(formData.created_at)}
            </p>
            {formData.oauth_provider && (
              <p className="text-sm mt-1" style={{ color: '#83769C' }}>
                <span className="font-medium" style={{ color: '#C2C3C7' }}>Login method:</span> {formData.oauth_provider}
              </p>
            )}
          </div>
        </div>

        {/* Password Section */}
        {!formData.oauth_provider && (
          <div className="rounded-lg shadow-lg p-6" style={{ 
            backgroundColor: '#1D2B53',
            border: '1px solid #5F574F'
          }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold" style={{ color: '#29ADFF' }}>Password</h2>
              {!showPasswordForm && (
                <button
                  onClick={() => setShowPasswordForm(true)}
                  className="font-medium hover:opacity-80 transition"
                  style={{ color: '#29ADFF' }}
                >
                  Change Password
                </button>
              )}
            </div>

            {showPasswordForm && (
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                {passwordError && (
                  <div className="p-3 rounded" style={{ 
                    backgroundColor: '#7E2553',
                    border: '1px solid #FF004D',
                    color: '#FF77A8'
                  }}>
                    {passwordError}
                  </div>
                )}
                
                {passwordSuccess && (
                  <div className="p-3 rounded" style={{ 
                    backgroundColor: '#008751',
                    border: '1px solid #00E436',
                    color: '#FFEC27'
                  }}>
                    {passwordSuccess}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#C2C3C7' }}>
                    Current Password
                  </label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2"
                    style={{ 
                      backgroundColor: '#000000',
                      border: '1px solid #5F574F',
                      color: '#FFF1E8'
                    }}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#C2C3C7' }}>
                    New Password
                  </label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2"
                    style={{ 
                      backgroundColor: '#000000',
                      border: '1px solid #5F574F',
                      color: '#FFF1E8'
                    }}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#C2C3C7' }}>
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2"
                    style={{ 
                      backgroundColor: '#000000',
                      border: '1px solid #5F574F',
                      color: '#FFF1E8'
                    }}
                    required
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={changingPassword}
                    className="px-6 py-2 rounded-lg disabled:opacity-50 transition"
                    style={{ 
                      backgroundColor: '#29ADFF',
                      color: '#000000'
                    }}
                    onMouseEnter={(e) => !changingPassword && (e.currentTarget.style.backgroundColor = '#00E436')}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#29ADFF'}
                  >
                    {changingPassword ? 'Changing...' : 'Change Password'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordForm(false);
                      setPasswordData({
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: ''
                      });
                      setPasswordError('');
                      setPasswordSuccess('');
                    }}
                    className="px-6 py-2 rounded-lg transition"
                    style={{ 
                      backgroundColor: '#7E2553',
                      color: '#C2C3C7'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#AB5236'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#7E2553'}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}