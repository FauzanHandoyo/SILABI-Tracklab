import React, { useState } from 'react';
import DashboardNav from './DashboardNav';

// Dummy data for demonstration
const assets = [
  {
    id: 'LAB-001',
    name: 'Microscope - Olympus CX23',
    category: 'Optical Equipment',
    location: 'Biology Lab A',
    status: 'In Use',
    assigned: 'Mirza Adi R.',
    lastUpdated: '2025-10-10',
  },
  {
    id: 'LAB-002',
    name: 'Centrifuge - Eppendorf 5424',
    category: 'Sample Processing',
    location: 'Chemistry Lab B',
    status: 'Available',
    assigned: '',
    lastUpdated: '2025-10-12',
  },
  {
    id: 'LAB-003',
    name: 'pH Meter - Mettler Toledo',
    category: 'Measurement Tools',
    location: 'Chemistry Lab A',
    status: 'In Use',
    assigned: 'Salim',
    lastUpdated: '2025-10-09',
  },
  {
    id: 'LAB-004',
    name: 'Spectrophotometer UV-Vis',
    category: 'Analytical Equipment',
    location: 'Research Lab C',
    status: 'Missing',
    assigned: '',
    lastUpdated: '2025-10-05',
  },
  {
    id: 'LAB-005',
    name: 'Hot Plate Stirrer',
    category: 'Heating Equipment',
    location: 'Chemistry Lab B',
    status: 'Available',
    assigned: '',
    lastUpdated: '2025-10-11',
  },
  {
    id: 'LAB-006',
    name: 'Analytical Balance',
    category: 'Measurement Tools',
    location: 'Research Lab A',
    status: 'In Use',
    assigned: 'Fauzan Farras H.',
    lastUpdated: '2025-10-08',
  },
  {
    id: 'LAB-007',
    name: 'Pipette Set (10-1000μL)',
    category: 'Lab Supplies',
    location: 'Biology Lab B',
    status: 'Available',
    assigned: '',
    lastUpdated: '2025-10-12',
  },
  {
    id: 'LAB-008',
    name: 'PCR Thermal Cycler',
    category: 'Molecular Biology',
    location: 'Genetics Lab',
    status: 'In Use',
    assigned: 'Mirza Adi R.',
    lastUpdated: '2025-10-10',
  },
  {
    id: 'LAB-009',
    name: 'Autoclave - Large Capacity',
    category: 'Sterilization',
    location: 'Central Equipment Room',
    status: 'Available',
    assigned: '',
    lastUpdated: '2025-10-12',
  },
  {
    id: 'LAB-010',
    name: 'Gel Electrophoresis System',
    category: 'Molecular Biology',
    location: 'Research Lab C',
    status: 'Missing',
    assigned: '',
    lastUpdated: '2025-10-03',
  },
];

const statusColors: Record<string, string> = {
  'In Use': 'bg-gray-900 text-white',
  'Available': 'bg-green-100 text-green-700',
  'Missing': 'bg-red-100 text-red-700',
};

const statusBadge: Record<string, string> = {
  'In Use': 'In Use',
  'Available': 'Available',
  'Missing': 'Missing',
};

const tabs = [
  { label: `All Assets (${assets.length})`, filter: () => true },
  { label: `In Use (${assets.filter(a => a.status === 'In Use').length})`, filter: (a: any) => a.status === 'In Use' },
  { label: `Available (${assets.filter(a => a.status === 'Available').length})`, filter: (a: any) => a.status === 'Available' },
  { label: `Missing (${assets.filter(a => a.status === 'Missing').length})`, filter: (a: any) => a.status === 'Missing' },
];

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);

  // Summary counts
  const totalAssets = assets.length;
  const inUse = assets.filter(a => a.status === 'In Use').length;
  const available = assets.filter(a => a.status === 'Available').length;
  const missing = assets.filter(a => a.status === 'Missing').length;

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center py-8">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl p-8">
        <DashboardNav />
        <div className="p-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="bg-blue-100 rounded-full p-3">
            <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
              <rect width="24" height="24" rx="6" fill="#2563eb"/>
              <path d="M8 10V8a4 4 0 118 0v2" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
              <rect x="6" y="10" width="12" height="8" rx="2" fill="#fff"/>
              <circle cx="12" cy="14" r="2" fill="#2563eb"/>
            </svg>
          </div>
          <div>
            <div className="font-bold text-xl text-gray-900">SILABI</div>
            <div className="text-gray-500 text-sm">Central Dashboard</div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-50 rounded-xl p-4 flex flex-col items-center">
            <div className="text-gray-500 text-xs mb-1">Total Assets</div>
            <div className="text-2xl font-bold text-gray-900">{totalAssets}</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 flex flex-col items-center">
            <div className="text-blue-600 text-xs mb-1">In Use</div>
            <div className="text-2xl font-bold text-blue-600">{inUse}</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 flex flex-col items-center">
            <div className="text-green-600 text-xs mb-1">Available</div>
            <div className="text-2xl font-bold text-green-600">{available}</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 flex flex-col items-center">
            <div className="text-red-600 text-xs mb-1">Missing</div>
            <div className="text-2xl font-bold text-red-600">{missing}</div>
          </div>
        </div>

        {/* Asset Inventory */}
        <div className="bg-gray-50 rounded-xl p-6">
          <div className="mb-2 font-semibold text-gray-900 text-lg">Asset Inventory</div>
          <div className="text-gray-500 text-sm mb-4">View and manage all laboratory assets</div>

          {/* Tabs */}
          <div className="flex gap-2 mb-4">
            {tabs.map((tab, idx) => (
              <button
                key={tab.label}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  activeTab === idx
                    ? 'bg-white shadow text-blue-700'
                    : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                }`}
                onClick={() => setActiveTab(idx)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-2 px-3 text-left font-semibold text-gray-600">Asset ID</th>
                  <th className="py-2 px-3 text-left font-semibold text-gray-600">Name</th>
                  <th className="py-2 px-3 text-left font-semibold text-gray-600">Category</th>
                  <th className="py-2 px-3 text-left font-semibold text-gray-600">Location</th>
                  <th className="py-2 px-3 text-left font-semibold text-gray-600">Status</th>
                  <th className="py-2 px-3 text-left font-semibold text-gray-600">Assigned To</th>
                  <th className="py-2 px-3 text-left font-semibold text-gray-600">Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {assets.filter(tabs[activeTab].filter).map((asset) => (
                  <tr key={asset.id} className="border-b hover:bg-gray-100">
                    <td className="py-2 px-3 font-mono text-gray-900">{asset.id}</td>
                    <td className="py-2 px-3 text-gray-900">{asset.name}</td>
                    <td className="py-2 px-3 text-blue-700 underline cursor-pointer">{asset.category}</td>
                    <td className="py-2 px-3 text-blue-700 underline cursor-pointer">{asset.location}</td>
                    <td className="py-2 px-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[asset.status]}`}>
                        {statusBadge[asset.status]}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-gray-900">{asset.assigned || <span className="text-gray-400">—</span>}</td>
                    <td className="py-2 px-3 text-gray-500">{asset.lastUpdated}</td>
                  </tr>
                ))}
                {assets.filter(tabs[activeTab].filter).length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-4 text-center text-gray-400">No assets found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
                  </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;