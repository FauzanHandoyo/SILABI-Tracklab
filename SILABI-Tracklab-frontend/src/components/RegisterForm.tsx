import React, { useState } from 'react';

const RegisterForm: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [role, setRole] = useState('Technician');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Please enter a valid email.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    // Replace with real registration logic
    console.log({ fullName, email, username, role });
    // after "register" navigate to login for UI testing
    window.location.hash = 'login';
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</div>}

      <div>
        <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
        <input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400" placeholder="Jane Doe" required />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400" placeholder="you@school.edu" required />
      </div>

      <div>
        <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">Username</label>
        <input id="username" value={username} onChange={(e) => setUsername(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400" placeholder="username" required />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400" required />
        </div>
        <div>
          <label htmlFor="confirm" className="block text-sm font-medium text-gray-700 mb-1">Confirm</label>
          <input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400" required />
        </div>
      </div>

      <div>
        <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">Role</label>
        <select id="role" value={role} onChange={(e) => setRole(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400">
          <option>Technician</option>
          <option>Lab Manager</option>
        </select>
      </div>

      <button type="submit" className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition">
        Register
      </button>

      <div className="text-center text-sm text-gray-500">
        Already have an account? <a href="#login" className="text-blue-600 hover:underline">Sign in</a>
      </div>
    </form>
  );
};

export default RegisterForm;