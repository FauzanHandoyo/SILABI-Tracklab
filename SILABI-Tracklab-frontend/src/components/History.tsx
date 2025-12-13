import React, { useEffect, useState } from 'react';
import { historyAPI } from '../utils/api';
import { supabase } from '../utils/supabase';

interface HistoryRecord {
  id: number;
  asset_id: number;
  nama_aset: string;
  event_type: string;
  old_status: string | null;
  new_status: string | null;
  old_location: string | null;
  new_location: string | null;
  rssi: number | null;
  timestamp: string;
}

export default function History() {
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [timeFilter, setTimeFilter] = useState('7');

  useEffect(() => {
    loadHistory();
  }, [timeFilter]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await historyAPI.getAll({
        days: timeFilter,
        limit: 100
      });
      setHistory(response.data);
    } catch (err: any) {
      console.error('Error loading history:', err);
      setError('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = history.filter(record => {
    const searchLower = search.toLowerCase();
    const assetId = `LAB-${String(record.asset_id).padStart(3, '0')}`;
    return (
      record.nama_aset?.toLowerCase().includes(searchLower) ||
      assetId.toLowerCase().includes(searchLower)
    );
  });

  const getStatusBadge = (status: string | null) => {
    if (!status) return null;
    
    const statusMap: Record<string, { bg: string; text: string }> = {
      'Tersedia': { bg: '#00E436', text: '#000000' },
      'Present': { bg: '#00E436', text: '#000000' },
      'Dipinjam': { bg: '#FFA300', text: '#000000' },
      'Missing': { bg: '#FF004D', text: '#FFF1E8' },
      'Hilang': { bg: '#FF004D', text: '#FFF1E8' },
      'Dalam Perbaikan': { bg: '#FFEC27', text: '#000000' }
    };

    const style = statusMap[status] || { bg: '#5F574F', text: '#C2C3C7' };
    
    return (
      <span 
        className="px-3 py-1 rounded-full text-xs font-semibold"
        style={{ backgroundColor: style.bg, color: style.text }}
      >
        {status}
      </span>
    );
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const wibTime = date.toLocaleString('en-GB', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false // Use 24-hour format
    });
    return {
      date: wibTime.split(',')[0],
      time: wibTime.split(',')[1].trim()
    };
  };

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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: '#29ADFF' }}>History</h1>
          <p className="text-sm mt-1" style={{ color: '#83769C' }}>Asset activity tracking</p>
        </div>
        <div className="flex items-center gap-3">
          <span style={{ color: '#C2C3C7' }}>Last</span>
          <select 
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="px-3 py-2 rounded-lg focus:ring-2 focus:outline-none"
            style={{ 
              backgroundColor: '#1D2B53',
              border: '1px solid #5F574F',
              color: '#FFF1E8'
            }}
          >
            <option value="1">1 day</option>
            <option value="7">7 days</option>
            <option value="30">30 days</option>
            <option value="365">1 year</option>
          </select>
          {/* Real-time indicator */}
          <span className="ml-2 flex items-center gap-1 text-sm" style={{ color: '#00E436' }}>
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#00E436' }}></span>
            Live
          </span>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by asset id or name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-3 rounded-lg focus:ring-2 focus:outline-none"
          style={{ 
            backgroundColor: '#1D2B53',
            border: '1px solid #5F574F',
            color: '#FFF1E8'
          }}
        />
      </div>

      <div className="text-right mb-2" style={{ color: '#83769C' }}>
        {filteredHistory.length} records
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-lg" style={{ 
          backgroundColor: '#7E2553',
          border: '1px solid #FF004D'
        }}>
          <p style={{ color: '#FF77A8' }}>{error}</p>
        </div>
      )}

      {/* History Table */}
      <div className="rounded-lg shadow-lg overflow-hidden" style={{ 
        backgroundColor: '#1D2B53',
        border: '1px solid #5F574F'
      }}>
        <table className="min-w-full">
          <thead style={{ borderBottom: '2px solid #5F574F' }}>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#C2C3C7' }}>
                Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#C2C3C7' }}>
                Asset
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#C2C3C7' }}>
                RSSI
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#C2C3C7' }}>
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredHistory.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center" style={{ color: '#83769C' }}>
                  No history records found
                </td>
              </tr>
            ) : (
              filteredHistory.map((record, index) => {
                const { date, time } = formatTimestamp(record.timestamp);
                const assetId = `LAB-${String(record.asset_id).padStart(3, '0')}`;
                
                return (
                  <tr 
                    key={record.id} 
                    className="transition"
                    style={{ borderBottom: index < filteredHistory.length - 1 ? '1px solid #5F574F' : 'none' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#7E255320'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm" style={{ color: '#C2C3C7' }}>{date}</div>
                      <div className="text-sm" style={{ color: '#83769C' }}>{time}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium" style={{ color: '#FFF1E8' }}>
                        {record.nama_aset || 'Unknown Asset'}
                      </div>
                      <div className="text-sm font-mono" style={{ color: '#83769C' }}>{assetId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm" style={{ color: '#FFF1E8' }}>
                        {record.rssi ? `${record.rssi} dBm` : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(record.new_status)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}