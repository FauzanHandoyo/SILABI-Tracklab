import React, { useState } from 'react';

// Dummy data for demonstration
const assets = [
  {
    id: 'A001',
    name: 'Oscilloscope',
    status: 'Active',
    location: 'Lab 1',
    lastSeen: '2025-10-13 09:15',
    history: [
      { date: '2025-10-12', location: 'Lab 2' },
      { date: '2025-10-11', location: 'Lab 1' },
    ],
  },
  {
    id: 'A002',
    name: 'Multimeter',
    status: 'Missing',
    location: 'Unknown',
    lastSeen: '2025-10-10 14:20',
    history: [
      { date: '2025-10-09', location: 'Lab 1' },
      { date: '2025-10-08', location: 'Lab 3' },
    ],
  },
  {
    id: 'A003',
    name: 'Power Supply',
    status: 'Inactive',
    location: 'Lab 2',
    lastSeen: '2025-10-09 11:00',
    history: [
      { date: '2025-10-08', location: 'Lab 2' },
      { date: '2025-10-07', location: 'Lab 2' },
    ],
  },
];

const roles = ['Lab Manager', 'Technician'];

const statusColors: Record<string, string> = {
  Active: 'bg-green-100 text-green-700',
  Missing: 'bg-red-100 text-red-700 animate-pulse',
  Inactive: 'bg-yellow-100 text-yellow-700',
};

const Dashboard: React.FC = () => {
  const [search, setSearch] = useState('');
  const [role, setRole] = useState(roles[0]);
  const [selectedAsset, setSelectedAsset] = useState<number | null>(null);

  // Filter assets by search
  const filteredAssets = assets.filter(
    (asset) =>
      asset.name.toLowerCase().includes(search.toLowerCase()) ||
      asset.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-blue-700">Lab Asset Dashboard</h1>
            <p className="text-gray-500">Real-time monitoring & tracking of laboratory assets</p>
          </div>
          <div>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300 focus:ring-blue-400 focus:outline-none"
            >
              {roles.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
          <input
            type="text"
            placeholder="Search by asset name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-1/3 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"
          />
          <div className="flex gap-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs">Active</span>
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs">Inactive</span>
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs">Missing</span>
          </div>
        </div>

        {/* Notifications */}
        <div className="mb-4">
          {assets.some((a) => a.status === 'Missing') && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-2 flex items-center">
              <svg className="w-5 h-5 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
              </svg>
              <span>Alert: There are missing assets! Please check immediately.</span>
            </div>
          )}
        </div>

        {/* Asset Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-blue-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">ID</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Location</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Last Seen</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssets.map((asset, idx) => (
                <tr key={asset.id} className="hover:bg-blue-50 transition">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{asset.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{asset.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[asset.status]}`}>
                      {asset.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{asset.location}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{asset.lastSeen}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      className="text-blue-600 hover:underline text-sm"
                      onClick={() => setSelectedAsset(idx)}
                    >
                      View History
                    </button>
                  </td>
                </tr>
              ))}
              {filteredAssets.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-400">No assets found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Asset History Modal */}
        {selectedAsset !== null && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative">
              <button
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                onClick={() => setSelectedAsset(null)}
              >
                &times;
              </button>
              <h3 className="text-xl font-bold mb-4 text-blue-700">
                Asset History: {assets[selectedAsset].name}
              </h3>
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left py-2">Date</th>
                    <th className="text-left py-2">Location</th>
                  </tr>
                </thead>
                <tbody>
                  {assets[selectedAsset].history.map((h, i) => (
                    <tr key={i}>
                      <td className="py-1">{h.date}</td>
                      <td className="py-1">{h.location}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Simple Chart (Demo) */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-blue-700 mb-4">Asset Status Overview</h2>
          <div className="flex gap-8 items-end h-32">
            <div className="flex flex-col items-center">
              <div className="w-10 bg-green-400 rounded-t-lg" style={{ height: `${assets.filter(a => a.status === 'Active').length * 30}px` }} />
              <span className="mt-2 text-sm text-green-700">Active</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-10 bg-yellow-400 rounded-t-lg" style={{ height: `${assets.filter(a => a.status === 'Inactive').length * 30}px` }} />
              <span className="mt-2 text-sm text-yellow-700">Inactive</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-10 bg-red-400 rounded-t-lg" style={{ height: `${assets.filter(a => a.status === 'Missing').length * 30}px` }} />
              <span className="mt-2 text-sm text-red-700">Missing</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;