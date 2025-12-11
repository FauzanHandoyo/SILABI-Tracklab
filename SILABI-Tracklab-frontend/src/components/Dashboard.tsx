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
  'Inactive': 'text-white',
  'Available': 'text-white',
  'Missing': 'text-white',
};

const statusBgColors: Record<string, string> = {
  'Inactive': '#FFA300',
  'Available': '#00E436',
  'Missing': '#FF004D',
};

const statusBadge: Record<string, string> = {
  'Inactive': 'Inactive',
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
          ? 'Inactive'
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

  const totalAssets = assets.length;
  const inUse = assets.filter(a => a.status === 'Inactive').length;
  const available = assets.filter(a => a.status === 'Available').length;
  const missing = assets.filter(a => a.status === 'Missing').length;

  const tabs = [
    { label: `All Assets (${totalAssets})`, filter: () => true },
    { label: `Inactive (${inUse})`, filter: (a: Asset) => a.status === 'Inactive' },
    { label: `Available (${available})`, filter: (a: Asset) => a.status === 'Available' },
    { label: `Missing (${missing})`, filter: (a: Asset) => a.status === 'Missing' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#000000' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#29ADFF' }}></div>
      </div>
    );
  }

  return (
    <div className="p-8 min-h-screen" style={{ backgroundColor: '#000000' }}>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div>
          <div className="font-bold text-xl" style={{ color: '#29ADFF' }}>SILABI</div>
          <div className="text-sm" style={{ color: '#83769C' }}>Central Dashboard</div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="rounded-xl p-4 flex flex-col items-center" style={{ 
          backgroundColor: '#1D2B53',
          border: '1px solid #5F574F'
        }}>
          <div className="text-xs mb-1" style={{ color: '#83769C' }}>Total Assets</div>
          <div className="text-2xl font-bold" style={{ color: '#FFF1E8' }}>{totalAssets}</div>
        </div>
        <div className="rounded-xl p-4 flex flex-col items-center" style={{ 
          backgroundColor: '#1D2B53',
          border: '1px solid #5F574F'
        }}>
          <div className="text-xs mb-1" style={{ color: '#FFA300' }}>Inactive</div>
          <div className="text-2xl font-bold" style={{ color: '#FFA300' }}>{inUse}</div>
        </div>
        <div className="rounded-xl p-4 flex flex-col items-center" style={{ 
          backgroundColor: '#1D2B53',
          border: '1px solid #5F574F'
        }}>
          <div className="text-xs mb-1" style={{ color: '#00E436' }}>Available</div>
          <div className="text-2xl font-bold" style={{ color: '#00E436' }}>{available}</div>
        </div>
        <div className="rounded-xl p-4 flex flex-col items-center" style={{ 
          backgroundColor: '#1D2B53',
          border: '1px solid #5F574F'
        }}>
          <div className="text-xs mb-1" style={{ color: '#FF004D' }}>Missing</div>
          <div className="text-2xl font-bold" style={{ color: '#FF004D' }}>{missing}</div>
        </div>
      </div>

      {/* Asset Inventory */}
      <div className="rounded-xl p-6" style={{ 
        backgroundColor: '#1D2B53',
        border: '1px solid #5F574F'
      }}>
        <div className="mb-2 font-semibold text-lg" style={{ color: '#29ADFF' }}>Asset Inventory</div>
        <div className="text-sm mb-4" style={{ color: '#83769C' }}>View and manage all laboratory assets</div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {tabs.map((tab, idx) => (
            <button
              key={tab.label}
              className="px-4 py-2 rounded-full text-sm font-medium transition"
              style={{
                backgroundColor: activeTab === idx ? '#29ADFF' : '#7E2553',
                color: activeTab === idx ? '#000000' : '#C2C3C7'
              }}
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
              <tr style={{ borderBottom: '1px solid #5F574F' }}>
                <th className="py-2 px-3 text-left font-semibold" style={{ color: '#C2C3C7' }}>Asset ID</th>
                <th className="py-2 px-3 text-left font-semibold" style={{ color: '#C2C3C7' }}>Name</th>
                <th className="py-2 px-3 text-left font-semibold" style={{ color: '#C2C3C7' }}>Category</th>
                <th className="py-2 px-3 text-left font-semibold" style={{ color: '#C2C3C7' }}>Location</th>
                <th className="py-2 px-3 text-left font-semibold" style={{ color: '#C2C3C7' }}>Status</th>
                <th className="py-2 px-3 text-left font-semibold" style={{ color: '#C2C3C7' }}>Assigned To</th>
                <th className="py-2 px-3 text-left font-semibold" style={{ color: '#C2C3C7' }}>Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {assets.filter(tabs[activeTab].filter).map((asset) => (
                <tr key={asset.id} style={{ borderBottom: '1px solid #5F574F' }} className="hover:bg-opacity-50 transition" onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#7E255320'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <td className="py-2 px-3 font-mono" style={{ color: '#FFF1E8' }}>{asset.id}</td>
                  <td className="py-2 px-3" style={{ color: '#FFF1E8' }}>{asset.name}</td>
                  <td className="py-2 px-3 underline cursor-pointer" style={{ color: '#29ADFF' }}>{asset.category}</td>
                  <td className="py-2 px-3 underline cursor-pointer" style={{ color: '#29ADFF' }}>{asset.location}</td>
                  <td className="py-2 px-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[asset.status]}`} style={{ backgroundColor: statusBgColors[asset.status] }}>
                      {statusBadge[asset.status]}
                    </span>
                  </td>
                  <td className="py-2 px-3" style={{ color: '#FFF1E8' }}>
                    {asset.assigned || <span style={{ color: '#5F574F' }}>—</span>}
                  </td>
                  <td className="py-2 px-3" style={{ color: '#83769C' }}>{asset.lastUpdated}</td>
                </tr>
              ))}
              {assets.filter(tabs[activeTab].filter).length === 0 && (
                <tr>
                  <td colSpan={7} className="py-4 text-center" style={{ color: '#5F574F' }}>No assets found.</td>
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