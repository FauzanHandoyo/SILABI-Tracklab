import React, { useEffect, useState } from 'react'
import { assetAPI, requestAPI } from '../utils/api'

type AssetRequest = {
  id: string
  userId: string
  userName: string
  assetId: string
  assetName: string
  requestedAt: string
  reason?: string
  status: 'pending' | 'approved' | 'denied'
}

export default function AssetRequests() {
  const [requests, setRequests] = useState<AssetRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'pending' | 'all'>('pending')

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    try {
      const response = await requestAPI.getAll()
      const data = response.data || []
      const mapped = data.map((r: any) => ({
        id: r.id,
        userId: r.user_id,
        userName: r.user_name,
        assetId: r.asset_id,
        assetName: r.asset_name,
        requestedAt: r.request_date,
        reason: r.notes,
        status: r.status,
      }))
      setRequests(mapped)
      setError(null)
    } catch (err) {
      console.error('Failed to load asset requests:', err)
      setError('Failed to load asset requests')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (requestId: string) => {
    if (!confirm('Approve this asset request?')) return

    try {
      const response = await requestAPI.approveRequest(requestId)
      const assetId = response.data?.asset_id
      
      // Update asset status to "Dipinjam"
      if (assetId) {
        await assetAPI.update(assetId, { status_aset: 'Dipinjam' })
      }
      
      setRequests(prev =>
        prev.map(r => (r.id === requestId ? { ...r, status: 'approved' as const } : r))
      )
      setError(null)
    } catch (err) {
      console.error('Approval failed:', err)
      setError('Failed to approve request')
    }
  }

  const handleDeny = async (requestId: string) => {
    if (!confirm('Deny this asset request?')) return

    try {
      await requestAPI.denyRequest(requestId)
      setRequests(prev =>
        prev.map(r => (r.id === requestId ? { ...r, status: 'denied' as const } : r))
      )
      setError(null)
    } catch (err) {
      console.error('Denial failed:', err)
      setError('Failed to deny request')
    }
  }

  const filteredRequests = 
    filter === 'pending'
      ? requests.filter(r => r.status === 'pending')
      : requests

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#000000' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#29ADFF' }}></div>
      </div>
    )
  }

  return (
    <div className="p-8 min-h-screen" style={{ backgroundColor: '#000000' }}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: '#29ADFF' }}>Asset Requests</h1>
          <p className="text-sm mt-1" style={{ color: '#83769C' }}>
            {requests.filter(r => r.status === 'pending').length} pending request{requests.filter(r => r.status === 'pending').length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('pending')}
            className="px-4 py-2 rounded-full text-sm font-medium transition"
            style={{
              backgroundColor: filter === 'pending' ? '#29ADFF' : '#7E2553',
              color: filter === 'pending' ? '#000000' : '#C2C3C7'
            }}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter('all')}
            className="px-4 py-2 rounded-full text-sm font-medium transition"
            style={{
              backgroundColor: filter === 'all' ? '#29ADFF' : '#7E2553',
              color: filter === 'all' ? '#000000' : '#C2C3C7'
            }}
          >
            All
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-lg" style={{ 
          backgroundColor: '#7E2553',
          border: '1px solid #FF004D'
        }}>
          <p style={{ color: '#FF77A8' }}>{error}</p>
        </div>
      )}

      {filteredRequests.length === 0 ? (
        <div className="rounded-lg shadow p-12 text-center" style={{ 
          backgroundColor: '#1D2B53',
          border: '1px solid #5F574F'
        }}>
          <div className="text-6xl mb-4">📋</div>
          <p style={{ color: '#83769C' }}>
            No {filter === 'pending' ? 'pending' : ''} requests
          </p>
        </div>
      ) : (
        <div className="rounded-lg shadow-lg overflow-hidden" style={{ 
          backgroundColor: '#1D2B53',
          border: '1px solid #5F574F'
        }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{ borderBottom: '2px solid #5F574F' }}>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#C2C3C7' }}>
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#C2C3C7' }}>
                    Asset
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#C2C3C7' }}>
                    Reason
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#C2C3C7' }}>
                    Requested
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#C2C3C7' }}>
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#C2C3C7' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((req, index) => (
                  <tr 
                    key={req.id} 
                    className="transition"
                    style={{ borderBottom: index < filteredRequests.length - 1 ? '1px solid #5F574F' : 'none' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#7E255320'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td className="px-6 py-4" style={{ color: '#FFF1E8' }}>
                      {req.userName}
                    </td>
                    <td className="px-6 py-4" style={{ color: '#FFF1E8' }}>
                      {req.assetName}
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: '#C2C3C7' }}>
                      {req.reason || <span style={{ color: '#5F574F' }}>-</span>}
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: '#83769C' }}>
                      {new Date(req.requestedAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                        style={{
                          backgroundColor: 
                            req.status === 'pending' ? '#FFA300' :
                            req.status === 'approved' ? '#00E436' :
                            '#FF004D'
                        }}
                      >
                        {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {req.status === 'pending' ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(req.id)}
                            className="px-3 py-1 rounded-lg text-sm font-medium transition"
                            style={{ 
                              backgroundColor: '#00E436',
                              color: '#000000'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#008751'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#00E436'}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleDeny(req.id)}
                            className="px-3 py-1 rounded-lg text-sm font-medium transition"
                            style={{ 
                              backgroundColor: '#FF004D',
                              color: '#FFF1E8'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#7E2553'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FF004D'}
                          >
                            Deny
                          </button>
                        </div>
                      ) : (
                        <span className="text-sm" style={{ color: '#5F574F' }}>-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}