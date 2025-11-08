import React, { useEffect, useState } from 'react';
import { authAPI, userAPI } from '../utils/api';
import trackLabLogo from '../assets/tracklab-logo.jpg';

type User = {
  id: number;
  full_name?: string;
  email?: string;
  username?: string;
  role?: string;
  created_at?: string;
  last_login?: string;
};

export default function Profile(): JSX.Element {
  const [user, setUser] = useState<User | null>(null);
  const [form, setForm] = useState({ full_name: '', email: '', username: '' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const stored = authAPI.getCurrentUser();
    if (stored) {
      setUser(stored);
      setForm({
        full_name: stored.full_name || stored.name || '',
        email: stored.email || '',
        username: stored.username || ''
      });

      // try fetch fresh data from backend
      (async () => {
        try {
          const res = await userAPI.getById(stored.id);
          if (res?.data) {
            setUser(res.data);
            setForm({
              full_name: res.data.full_name || '',
              email: res.data.email || '',
              username: res.data.username || ''
            });
          }
        } catch (err) {
          // ignore — keep stored data
          console.error('Fetch profile failed', err);
        }
      })();
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!user) return;
    setSaving(true);
    setMessage(null);
    try {
      const payload = {
        full_name: form.full_name || null,
        email: form.email || null,
        username: form.username || null
      };
      const res = await userAPI.update(user.id, payload);
      setUser(res.data);
      setMessage('Profile updated');
    } catch (err) {
      console.error('Update profile failed', err);
      setMessage('Failed to update profile');
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  if (!user) {
    return <div className="p-4">Not signed in.</div>;
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <img src={trackLabLogo} alt="avatar" className="h-16 w-16 rounded-full object-cover" />
        <div>
          <h2 className="text-xl font-semibold">{form.full_name || form.username}</h2>
          <div className="text-sm text-gray-500">Role: {user.role || 'user'}</div>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-white p-4 rounded shadow">
        <label className="block mb-2">
          <div className="text-sm text-gray-600">Full name</div>
          <input
            name="full_name"
            value={form.full_name}
            onChange={handleChange}
            className="w-full mt-1 px-3 py-2 border rounded"
          />
        </label>

        <label className="block mb-2">
          <div className="text-sm text-gray-600">Email</div>
          <input
            name="email"
            value={form.email}
            onChange={handleChange}
            className="w-full mt-1 px-3 py-2 border rounded"
            type="email"
          />
        </label>

        <label className="block mb-2">
          <div className="text-sm text-gray-600">Username</div>
          <input
            name="username"
            value={form.username}
            onChange={handleChange}
            className="w-full mt-1 px-3 py-2 border rounded"
          />
        </label>

        <div className="mt-4 flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button
            type="button"
            onClick={() => {
              setForm({
                full_name: user.full_name || '',
                email: user.email || '',
                username: user.username || ''
              });
              setMessage(null);
            }}
            className="px-3 py-2 bg-gray-200 rounded"
          >
            Reset
          </button>
        </div>

        {message && <div className="mt-3 text-sm text-gray-700">{message}</div>}
        <div className="mt-3 text-xs text-gray-500">Member since: {user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}</div>
      </form>
    </div>
  );
}