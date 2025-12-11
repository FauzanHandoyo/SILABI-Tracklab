import React, { useEffect, useState } from 'react'
import { assetAPI, userAPI, requestAPI } from '../utils/api'
import AddAssetForm from './AddAssetForm'
import EditAssetForm from './EditAssetForm'
import { supabase } from '../utils/supabase'

type Asset = {
    id: string
    name: string
    assetType: string
    location: string
    lastSeen: string
    rssi: number
    status: 'Present' | 'Missing' | 'Inactive'
    rawId?: number
}

type RequestModalState = {
    isOpen: boolean
    assetId?: string
    assetName?: string
    notes: string
    submitting: boolean
}

export default function Assets() {
    const [assets, setAssets] = useState<Asset[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [search, setSearch] = useState('')
    const [showForm, setShowForm] = useState(false)
    const [editingAsset, setEditingAsset] = useState<any | null>(null)
    const [role, setRole] = useState<string | null>(null)
    const [roleLoaded, setRoleLoaded] = useState(false)
    const [userId, setUserId] = useState<number | null>(null)
    const [submittedRequests, setSubmittedRequests] = useState<Set<number>>(new Set())
    const [requestModal, setRequestModal] = useState<RequestModalState>({
        isOpen: false,
        notes: '',
        submitting: false
    })

    useEffect(() => {
        let cancelled = false

        async function resolveRole() {
            const stored = localStorage.getItem('user')

            // 1) try localStorage
            if (stored) {
                try {
                    const parsed = JSON.parse(stored)
                    if (parsed?.role) {
                        setRole(parsed.role)
                        if (parsed?.id) setUserId(parsed.id)
                        if (!cancelled) setRoleLoaded(true)
                        return
                    }
                } catch {
                    // ignore parse error
                }
            }

            // 2) try Supabase metadata
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (user) {
                    const r =
                        (user.user_metadata as any)?.role ||
                        (user.app_metadata as any)?.role ||
                        null
                    if (r) {
                        setRole(r)
                        const existing = stored ? JSON.parse(stored || '{}') : {}
                        localStorage.setItem('user', JSON.stringify({ ...existing, role: r }))
                        if (!cancelled) setRoleLoaded(true)
                        return
                    }
                }
            } catch (e) {
                console.error('Supabase getUser failed', e)
            }

            // 3) fallback to backend API
            try {
                const resp = await userAPI.getCurrentUser()
                const candidateRole = resp?.data?.role ?? resp?.role ?? null
                const candidateId = resp?.data?.id ?? resp?.id ?? null
                if (candidateRole) {
                    setRole(candidateRole)
                    if (candidateId) setUserId(candidateId)
                    const existing = stored ? JSON.parse(stored || '{}') : {}
                    localStorage.setItem('user', JSON.stringify({ ...existing, role: candidateRole, id: candidateId }))
                }
            } catch (e) {
                console.error('userAPI.getCurrentUser failed', e)
            } finally {
                if (!cancelled) setRoleLoaded(true)
            }
        }

        resolveRole()

        return () => {
            cancelled = true
        }
    }, [])

    useEffect(() => {
        const fetchAssets = async () => {
            try {
                const response = await assetAPI.getAll()
                console.log('Backend response:', response.data);
                
                const transformedData = response.data.map((asset: any) => {
                    console.log('Transforming asset:', asset);
                    return {
                        id: `LAB-${String(asset.id).padStart(3, '0')}`,
                        rawId: Number(asset.id),
                        name: asset.nama_aset,
                        assetType: asset.category || 'Unknown',
                        location: asset.location || 'Unknown',
                        lastSeen: asset.last_updated || new Date().toISOString(),
                        rssi: asset.latitude && asset.longitude ? -60 : 0,
                        status: asset.status_hilang 
                            ? 'Missing' 
                            : asset.status_aset === 'Tersedia' 
                            ? 'Present' 
                            : asset.status_aset === 'Dipinjam'
                            ? 'Inactive'
                            : 'Inactive'
                    }
                })
                console.log('Transformed assets:', transformedData);
                setAssets(transformedData)
                setError(null)
            } catch (err) {
                setError('Failed to load assets')
                console.error('Error loading assets:', err)
            } finally {
                setLoading(false)
            }
        }

        fetchAssets()
    }, [])

    const filteredAssets = assets.filter(asset => 
        asset.name.toLowerCase().includes(search.toLowerCase()) ||
        asset.id.toLowerCase().includes(search.toLowerCase())
    )

    const handleAddClick = () => setShowForm(true)
    const handleCancel = () => setShowForm(false)

    const handleCreated = (created: any) => {
        const newAsset: Asset = {
            id: `LAB-${String(created.id).padStart(3, '0')}`,
            name: created.nama_aset,
            assetType: created.category || 'Unknown',
            location: created.location || 'Unknown',
            lastSeen: created.last_updated || new Date().toISOString(),
            rssi: created.latitude && created.longitude ? -60 : 0,
            status: created.status_hilang ? 'Missing' : created.status_aset === 'Tersedia' ? 'Present' : 'Inactive'
        }
        setAssets(prev => [newAsset, ...prev])
        setShowForm(false)
    }

    const handleEditClick = (a: any) => {
        if (role === 'user') {
            setError('Permission denied')
            return
        }

        setEditingAsset({
            id: a.rawId,
            nama_aset: a.name,
            category: a.assetType === 'Unknown' ? '' : a.assetType,
            location: a.location === 'Unknown' ? '' : a.location,
            status_aset: a.status === 'Present' ? 'Tersedia' : a.status === 'Missing' ? 'Tersedia' : 'Dipinjam',
            assigned_to: '',
            peminjam: '',
            status_hilang: a.status === 'Missing',
            latitude: null,
            longitude: null
        })
    }

    const handleUpdate = (updatedRow: any) => {
        const updatedAsset: Asset & { rawId: number } = {
            id: `LAB-${String(updatedRow.id).padStart(3, '0')}`,
            rawId: updatedRow.id,
            name: updatedRow.nama_aset,
            assetType: updatedRow.category || 'Unknown',
            location: updatedRow.location || 'Unknown',
            lastSeen: updatedRow.last_updated || new Date().toISOString(),
            rssi: updatedRow.latitude && updatedRow.longitude ? -60 : 0,
            status: updatedRow.status_hilang ? 'Missing' : updatedRow.status_aset === 'Tersedia' ? 'Present' : 'Inactive'
        }
        setAssets(prev => prev.map(a => (a.rawId === updatedAsset.rawId ? updatedAsset : a)))
        setEditingAsset(null)
    }

    const handleDelete = async (a: any) => {
        if (role === 'user') {
            setError('Permission denied')
            return
        }

        console.log('Delete called with asset:', a);
        console.log('rawId:', a.rawId);
        
        if (!a.rawId) {
            setError('Invalid asset ID');
            console.error('Asset rawId is undefined');
            return;
        }
        
        if (!confirm(`Delete asset ${a.name}?`)) return;
        
        try {
            console.log('Deleting asset with rawId:', a.rawId);
            await assetAPI.delete(a.rawId)
            setAssets(prev => prev.filter(x => x.rawId !== a.rawId))
            setError(null)
        } catch (err) {
            console.error('Delete failed', err)
            setError('Failed to delete asset')
        }
    }

    const handleOpenBorrowModal = (asset: Asset) => {
        setRequestModal({
            isOpen: true,
            assetId: asset.id,
            assetName: asset.name,
            notes: '',
            submitting: false
        })
    }

    const handleCloseBorrowModal = () => {
        setRequestModal({
            isOpen: false,
            notes: '',
            submitting: false
        })
    }

    const handleSubmitBorrowRequest = async () => {
        if (!userId || !requestModal.assetId) {
            setError('Invalid request data')
            return
        }

        setRequestModal(prev => ({ ...prev, submitting: true }))

        try {
            const asset = assets.find(a => a.id === requestModal.assetId)
            const assetRawId = asset?.rawId

            await requestAPI.createRequest({
                asset_id: assetRawId,
                user_id: userId,
                request_type: 'borrow',
                status: 'pending',
                request_date: new Date().toISOString(),
                approval_date: null,
                return_date: null,
                notes: requestModal.notes
            })

            if (assetRawId) {
                setSubmittedRequests(prev => new Set([...prev, assetRawId]))
            }

            setError(null)
            handleCloseBorrowModal()
            alert('Asset borrow request submitted successfully!')
        } catch (err) {
            console.error('Failed to submit request:', err)
            setError('Failed to submit borrow request')
        } finally {
            setRequestModal(prev => ({ ...prev, submitting: false }))
        }
    }

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold">Assets</h1>
                <div className="flex items-center gap-2">
                  {roleLoaded && (role == 'admin' || role == 'technician') && (
                    <button onClick={handleAddClick} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                        Add Asset
                    </button>
                  )}
                </div>
            </div>

            {showForm && <AddAssetForm onCreated={handleCreated} onCancel={handleCancel} />}

           {editingAsset && (
             <EditAssetForm
               asset={editingAsset}
               onUpdated={handleUpdate}
               onCancel={() => setEditingAsset(null)}
             />
           )}

            {/* Borrow Request Modal */}
            {requestModal.isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
                        <h2 className="text-xl font-semibold mb-4">Request to Borrow</h2>
                        <p className="text-gray-600 mb-4">Asset: <strong>{requestModal.assetName}</strong></p>
                        
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Notes (optional)
                            </label>
                            <textarea
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows={4}
                                placeholder="Add any additional details about your request..."
                                value={requestModal.notes}
                                onChange={(e) => setRequestModal(prev => ({ ...prev, notes: e.target.value }))}
                            />
                        </div>

                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={handleCloseBorrowModal}
                                disabled={requestModal.submitting}
                                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmitBorrowRequest}
                                disabled={requestModal.submitting}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                            >
                                {requestModal.submitting ? 'Submitting...' : 'Submit Request'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Search assets..."
                    className="w-full px-4 py-2 border rounded-lg"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {error && <div className="text-red-600 mb-4">{error}</div>}

            {loading ? (
                <div className="text-center py-8">Loading...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredAssets.map(asset => (
                        <div key={asset.rawId || asset.id} className="bg-white p-4 rounded-lg shadow">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="font-medium">{asset.name}</h3>
                                    <div className="text-sm text-gray-500">{asset.id}</div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                  <span
                                      className={`px-2 py-1 rounded-full text-xs ${
                                          asset.status === 'Present'
                                              ? 'bg-green-100 text-green-800'
                                              : asset.status === 'Missing'
                                              ? 'bg-red-100 text-red-800'
                                              : 'bg-yellow-100 text-yellow-800'
                                      }`}
                                  >
                                      {asset.status}
                                  </span>
                                  <div className="flex gap-2">
                                    {roleLoaded && (role == 'admin' || role == 'technician') && (
                                      <>
                                        <button onClick={() => handleEditClick(asset)} className="px-2 py-1 text-sm bg-yellow-100 rounded hover:bg-yellow-200">Edit</button>
                                        <button onClick={() => handleDelete(asset)} className="px-2 py-1 text-sm bg-red-100 rounded hover:bg-red-200">Delete</button>
                                      </>
                                    )}
                                    {roleLoaded && role == 'user' && asset.status === 'Present' && (
                                      <>
                                        {submittedRequests.has(asset.rawId!) ? (
                                          <span className="px-2 py-1 text-sm text-gray-500 font-medium">Request Sent</span>
                                        ) : (
                                          <button onClick={() => handleOpenBorrowModal(asset)} className="px-2 py-1 text-sm bg-blue-100 rounded hover:bg-blue-200">Request to Borrow</button>
                                        )}
                                      </>
                                    )}
                                  </div>
                                </div>
                            </div>
                            <div className="mt-2 text-sm text-gray-600">
                                <div>Location: {asset.location}</div>
                                <div>Signal: {asset.rssi} dBm</div>
                                <div>Last seen: {new Date(asset.lastSeen).toLocaleString()}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}