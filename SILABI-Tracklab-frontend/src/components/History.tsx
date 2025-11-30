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

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('asset_history_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'asset_history'
        },
        (payload) => {
          console.log('Real-time update received:', payload);
          
          if (payload.eventType === 'INSERT') {
            // Add new record to the top of the list
            loadHistory(); // Reload to get full data with asset name
          } else if (payload.eventType === 'UPDATE') {
            // Update existing record
            loadHistory();
          } else if (payload.eventType === 'DELETE') {
            // Remove deleted record
            setHistory(prev => prev.filter(h => h.id !== payload.old.id));
          }
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
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
      'Tersedia': { bg: 'bg-green-100', text: 'text-green-700' },
      'Present': { bg: 'bg-green-100', text: 'text-green-700' },
      'Dipinjam': { bg: 'bg-gray-900', text: 'text-white' },
      'Missing': { bg: 'bg-red-100', text: 'text-red-700' },
      'Dalam Perbaikan': { bg: 'bg-yellow-100', text: 'text-yellow-700' }
    };

    const style = statusMap[status] || { bg: 'bg-gray-100', text: 'text-gray-700' };
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${style.bg} ${style.text}`}>
        {status}
      </span>
    );
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
    };
  };

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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">History</h1>
        <div className="flex items-center gap-2">
          <span className="text-gray-600">Last</span>
          <select 
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="1">1 day</option>
            <option value="7">7 days</option>
            <option value="30">30 days</option>
            <option value="365">1 year</option>
          </select>
          {/* Real-time indicator */}
          <span className="ml-2 flex items-center gap-1 text-sm text-green-600">
            <span className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></span>
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
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="text-right text-gray-500 mb-2">{filteredHistory.length} records</div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-400 rounded">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* History Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Asset
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                RSSI
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredHistory.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  No history records found
                </td>
              </tr>
            ) : (
              filteredHistory.map((record) => {
                const { date, time } = formatTimestamp(record.timestamp);
                const assetId = `LAB-${String(record.asset_id).padStart(3, '0')}`;
                
                return (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{date}</div>
                      <div className="text-sm text-gray-500">{time}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {record.nama_aset || 'Unknown Asset'}
                      </div>
                      <div className="text-sm text-gray-500">{assetId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
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