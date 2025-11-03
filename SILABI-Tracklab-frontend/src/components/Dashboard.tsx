import React, { useState, useEffect } from 'react';
import { assetAPI } from '../utils/api';

interface Asset {
  id: string;
  name: string;
  category: string;
  location: string;
  status: string;
  assigned: string;
  lastUpdated: string;
}

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

const Dashboard: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    try {
      setLoading(true);
      const response = await assetAPI.getAll();
      
      // Transform backend data to match frontend format
      const transformedData = response.data.map((asset: any) => ({
        id: `LAB-${String(asset.id).padStart(3, '0')}`,
        name: asset.nama_aset,
        category: asset.category || 'Unknown',
        location: asset.location || 'Unknown',
        status: asset.status_hilang 
          ? 'Missing' 
          : asset.status_aset === 'Tersedia' 
          ? 'Available' 
          : asset.status_aset === 'Dipinjam'
          ? 'In Use'
          : 'Available',
        assigned: asset.assigned_to || asset.peminjam || '',
        lastUpdated: asset.last_updated 
          ? new Date(asset.last_updated).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
      }));
      
      setAssets(transformedData);
    } catch (error) {
      console.error('Error loading assets:', error);
    } finally {
      setLoading(false);
    }
  };

  // Summary counts
  const totalAssets = assets.length;
  const inUse = assets.filter(a => a.status === 'In Use').length;
  const available = assets.filter(a => a.status === 'Available').length;
  const missing = assets.filter(a => a.status === 'Missing').length;

  const tabs = [
    { label: `All Assets (${totalAssets})`, filter: () => true },
    { label: `In Use (${inUse})`, filter: (a: Asset) => a.status === 'In Use' },
    { label: `Available (${available})`, filter: (a: Asset) => a.status === 'Available' },
    { label: `Missing (${missing})`, filter: (a: Asset) => a.status === 'Missing' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
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
  );
};

export default Dashboard;