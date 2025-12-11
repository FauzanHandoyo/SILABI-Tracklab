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
        await assetAPI.update(assetId, { status_aset: 'Inactive' })
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
      // Call backend to deny request
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

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold mb-4">Asset Requests</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'pending'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All
          </button>
        </div>
      </div>

      {error && <div className="text-red-600 mb-4 p-3 bg-red-50 rounded-lg">{error}</div>}

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading requests...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No {filter === 'pending' ? 'pending' : ''} requests</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-white shadow rounded-lg">
            <thead>
              <tr className="bg-gray-100 border-b">
                <th className="px-6 py-3 text-left font-semibold text-gray-700">User</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Asset</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Reason</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Requested</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Status</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map(req => (
                <tr key={req.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-3 text-gray-900">{req.userName}</td>
                  <td className="px-6 py-3 text-gray-900">{req.assetName}</td>
                  <td className="px-6 py-3 text-gray-600 text-sm">{req.reason || '-'}</td>
                  <td className="px-6 py-3 text-gray-600 text-sm">
                    {new Date(req.requestedAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        req.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : req.status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    {req.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(req.id)}
                          className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleDeny(req.id)}
                          className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition"
                        >
                          Deny
                        </button>
                      </div>
                    )}
                    {req.status !== 'pending' && (
                      <span className="text-gray-500 text-sm">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}