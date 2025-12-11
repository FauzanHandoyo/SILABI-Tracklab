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
    status: 'Present' | 'Missing' | 'Inactive' | 'Borrowed'
    rawId?: number
}

type RequestModalState = {
    isOpen: boolean
    assetId?: string
    assetName?: string
    notes: string
    submitting: boolean
}

type DeleteModalState = {
    isOpen: boolean
    asset: Asset | null
    deleting: boolean
}

export default function Assets() {
    const [assets, setAssets] = useState<Asset[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [categoryFilter, setCategoryFilter] = useState<string>('all')
    const [showAddModal, setShowAddModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
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
    const [deleteModal, setDeleteModal] = useState<DeleteModalState>({
        isOpen: false,
        asset: null,
        deleting: false
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
                    let status: 'Present' | 'Missing' | 'Inactive' | 'Borrowed' = 'Inactive'
                    
                    if (asset.status_hilang) {
                        status = 'Missing'
                    } else if (asset.status_aset === 'Tersedia') {
                        status = 'Present'
                    } else if (asset.status_aset === 'Dipinjam') {
                        status = 'Borrowed'
                    } else if (asset.status_aset === 'Dalam Perbaikan') {
                        status = 'Inactive'
                    }
                    
                    return {
                        id: `LAB-${String(asset.id).padStart(3, '0')}`,
                        rawId: Number(asset.id),
                        name: asset.nama_aset,
                        assetType: asset.category || 'Unknown',
                        location: asset.location || 'Unknown',
                        lastSeen: asset.last_updated || new Date().toISOString(),
                        rssi: asset.latitude && asset.longitude ? -60 : 0,
                        status: status
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

    // Fetch pending requests for current user
    useEffect(() => {
        if (role === 'user' && userId) {
            const fetchUserRequests = async () => {
                try {
                    const response = await requestAPI.getAll()
                    const userRequests = response.data?.filter(
                        (r: any) => r.user_id === userId && r.status === 'pending'
                    ) || []
                    const assetIds = new Set(userRequests.map((r: any) => r.asset_id))
                    setSubmittedRequests(assetIds)
                } catch (err) {
                    console.error('Failed to fetch user requests:', err)
                }
            }
            fetchUserRequests()
        }
    }, [role, userId])

    // Get unique categories for filter
    const categories = ['all', ...Array.from(new Set(assets.map(a => a.assetType).filter(t => t !== 'Unknown')))]

    const filteredAssets = assets.filter(asset => {
        const matchesSearch = 
            asset.name.toLowerCase().includes(search.toLowerCase()) ||
            asset.id.toLowerCase().includes(search.toLowerCase())
        
        const matchesStatus = statusFilter === 'all' || asset.status === statusFilter
        const matchesCategory = categoryFilter === 'all' || asset.assetType === categoryFilter
        
        return matchesSearch && matchesStatus && matchesCategory
    })

    const handleAddClick = () => setShowAddModal(true)
    const handleCancelAdd = () => setShowAddModal(false)

    const handleCreated = (created: any) => {
        let status: 'Present' | 'Missing' | 'Inactive' | 'Borrowed' = 'Inactive'
        
        if (created.status_hilang) {
            status = 'Missing'
        } else if (created.status_aset === 'Tersedia') {
            status = 'Present'
        } else if (created.status_aset === 'Dipinjam') {
            status = 'Borrowed'
        } else if (created.status_aset === 'Dalam Perbaikan') {
            status = 'Inactive'
        }
        
        const newAsset: Asset = {
            id: `LAB-${String(created.id).padStart(3, '0')}`,
            name: created.nama_aset,
            assetType: created.category || 'Unknown',
            location: created.location || 'Unknown',
            lastSeen: created.last_updated || new Date().toISOString(),
            rssi: created.latitude && created.longitude ? -60 : 0,
            status: status,
            rawId: created.id
        }
        setAssets(prev => [newAsset, ...prev])
        setShowAddModal(false)
    }

    const handleEditClick = (a: any) => {
        if (role === 'user') {
            setError('Permission denied')
            return
        }

        let statusAset = 'Tersedia'
        if (a.status === 'Borrowed') statusAset = 'Dipinjam'
        else if (a.status === 'Inactive') statusAset = 'Dalam Perbaikan'
        else if (a.status === 'Present') statusAset = 'Tersedia'

        setEditingAsset({
            id: a.rawId,
            nama_aset: a.name,
            category: a.assetType === 'Unknown' ? '' : a.assetType,
            status_aset: statusAset,
        })
        setShowEditModal(true)
    }

    const handleCancelEdit = () => {
        setShowEditModal(false)
        setEditingAsset(null)
    }

    const handleUpdate = (updatedRow: any) => {
        let status: 'Present' | 'Missing' | 'Inactive' | 'Borrowed' = 'Inactive'
        
        if (updatedRow.status_hilang) {
            status = 'Missing'
        } else if (updatedRow.status_aset === 'Tersedia') {
            status = 'Present'
        } else if (updatedRow.status_aset === 'Dipinjam') {
            status = 'Borrowed'
        } else if (updatedRow.status_aset === 'Dalam Perbaikan') {
            status = 'Inactive'
        }
        
        const updatedAsset: Asset & { rawId: number } = {
            id: `LAB-${String(updatedRow.id).padStart(3, '0')}`,
            rawId: updatedRow.id,
            name: updatedRow.nama_aset,
            assetType: updatedRow.category || 'Unknown',
            location: updatedRow.location || 'Unknown',
            lastSeen: updatedRow.last_updated || new Date().toISOString(),
            rssi: updatedRow.latitude && updatedRow.longitude ? -60 : 0,
            status: status
        }
        setAssets(prev => prev.map(a => (a.rawId === updatedAsset.rawId ? updatedAsset : a)))
        setShowEditModal(false)
        setEditingAsset(null)
    }

    const handleOpenDeleteModal = (asset: Asset) => {
        if (role === 'user') {
            setError('Permission denied')
            return
        }
        
        setDeleteModal({
            isOpen: true,
            asset: asset,
            deleting: false
        })
    }

    const handleCloseDeleteModal = () => {
        setDeleteModal({
            isOpen: false,
            asset: null,
            deleting: false
        })
    }

    const handleConfirmDelete = async () => {
        if (!deleteModal.asset?.rawId) {
            setError('Invalid asset ID')
            return
        }

        setDeleteModal(prev => ({ ...prev, deleting: true }))

        try {
            await assetAPI.delete(deleteModal.asset.rawId)
            setAssets(prev => prev.filter(x => x.rawId !== deleteModal.asset?.rawId))
            setError(null)
            handleCloseDeleteModal()
        } catch (err) {
            console.error('Delete failed', err)
            setError('Failed to delete asset')
        } finally {
            setDeleteModal(prev => ({ ...prev, deleting: false }))
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

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#000000' }}>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#29ADFF' }}></div>
            </div>
        )
    }

    return (
        <div className="p-8 min-h-screen" style={{ backgroundColor: '#000000' }}>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold" style={{ color: '#29ADFF' }}>Assets</h1>
                    <p className="text-sm mt-1" style={{ color: '#83769C' }}>Manage laboratory assets</p>
                </div>
                <div className="flex items-center gap-2">
                  {roleLoaded && (role == 'admin' || role == 'technician') && (
                    <button 
                        onClick={handleAddClick} 
                        className="px-4 py-2 rounded-lg font-semibold transition"
                        style={{ 
                            backgroundColor: '#29ADFF',
                            color: '#000000'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#00E436'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#29ADFF'}
                    >
                        Add Asset
                    </button>
                  )}
                </div>
            </div>

            {/* Add Asset Modal */}
            {showAddModal && (
                <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}>
                    <div className="rounded-lg shadow-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" style={{ 
                        backgroundColor: '#1D2B53',
                        border: '2px solid #5F574F'
                    }}>
                        <AddAssetForm onCreated={handleCreated} onCancel={handleCancelAdd} />
                    </div>
                </div>
            )}

            {/* Edit Asset Modal */}
            {showEditModal && editingAsset && (
                <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}>
                    <div className="rounded-lg shadow-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" style={{ 
                        backgroundColor: '#1D2B53',
                        border: '2px solid #5F574F'
                    }}>
                        <EditAssetForm
                            asset={editingAsset}
                            onUpdated={handleUpdate}
                            onCancel={handleCancelEdit}
                        />
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteModal.isOpen && deleteModal.asset && (
                <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}>
                    <div className="rounded-lg shadow-lg p-6 max-w-md w-full" style={{ 
                        backgroundColor: '#1D2B53',
                        border: '2px solid #FF004D'
                    }}>
                        <h2 className="text-xl font-semibold mb-4" style={{ color: '#FF004D' }}>Delete Asset</h2>
                        <p className="mb-4" style={{ color: '#C2C3C7' }}>
                            Are you sure you want to delete <strong style={{ color: '#FFF1E8' }}>{deleteModal.asset.name}</strong>?
                        </p>
                        <p className="mb-6 text-sm" style={{ color: '#83769C' }}>
                            This action cannot be undone.
                        </p>

                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={handleCloseDeleteModal}
                                disabled={deleteModal.deleting}
                                className="px-4 py-2 rounded-lg transition disabled:opacity-50"
                                style={{ 
                                    backgroundColor: '#7E2553',
                                    color: '#C2C3C7'
                                }}
                                onMouseEnter={(e) => !deleteModal.deleting && (e.currentTarget.style.backgroundColor = '#AB5236')}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#7E2553'}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                disabled={deleteModal.deleting}
                                className="px-4 py-2 rounded-lg transition disabled:opacity-50"
                                style={{ 
                                    backgroundColor: '#FF004D',
                                    color: '#FFF1E8'
                                }}
                                onMouseEnter={(e) => !deleteModal.deleting && (e.currentTarget.style.backgroundColor = '#7E2553')}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FF004D'}
                            >
                                {deleteModal.deleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Borrow Request Modal */}
            {requestModal.isOpen && (
                <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}>
                    <div className="rounded-lg shadow-lg p-6 max-w-md w-full" style={{ 
                        backgroundColor: '#1D2B53',
                        border: '2px solid #5F574F'
                    }}>
                        <h2 className="text-xl font-semibold mb-4" style={{ color: '#29ADFF' }}>Request to Borrow</h2>
                        <p className="mb-4" style={{ color: '#C2C3C7' }}>Asset: <strong style={{ color: '#FFF1E8' }}>{requestModal.assetName}</strong></p>
                        
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2" style={{ color: '#C2C3C7' }}>
                                Notes (optional)
                            </label>
                            <textarea
                                className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2"
                                style={{ 
                                    backgroundColor: '#000000',
                                    border: '1px solid #5F574F',
                                    color: '#FFF1E8'
                                }}
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
                                className="px-4 py-2 rounded-lg transition disabled:opacity-50"
                                style={{ 
                                    backgroundColor: '#7E2553',
                                    color: '#C2C3C7'
                                }}
                                onMouseEnter={(e) => !requestModal.submitting && (e.currentTarget.style.backgroundColor = '#AB5236')}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#7E2553'}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmitBorrowRequest}
                                disabled={requestModal.submitting}
                                className="px-4 py-2 rounded-lg transition disabled:opacity-50"
                                style={{ 
                                    backgroundColor: '#29ADFF',
                                    color: '#000000'
                                }}
                                onMouseEnter={(e) => !requestModal.submitting && (e.currentTarget.style.backgroundColor = '#00E436')}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#29ADFF'}
                            >
                                {requestModal.submitting ? 'Submitting...' : 'Submit Request'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Search and Filters */}
            <div className="mb-6 space-y-4">
                <input
                    type="text"
                    placeholder="Search by asset name or ID..."
                    className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2"
                    style={{ 
                        backgroundColor: '#1D2B53',
                        border: '1px solid #5F574F',
                        color: '#FFF1E8'
                    }}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                
                <div className="flex gap-4">
                    <div className="flex-1">
                        <label className="block text-sm font-medium mb-1" style={{ color: '#C2C3C7' }}>
                            Status
                        </label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2"
                            style={{ 
                                backgroundColor: '#1D2B53',
                                border: '1px solid #5F574F',
                                color: '#FFF1E8'
                            }}
                        >
                            <option value="all">All Status</option>
                            <option value="Present">Present</option>
                            <option value="Borrowed">Borrowed</option>
                            <option value="Missing">Missing</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                    </div>
                    
                    <div className="flex-1">
                        <label className="block text-sm font-medium mb-1" style={{ color: '#C2C3C7' }}>
                            Category
                        </label>
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2"
                            style={{ 
                                backgroundColor: '#1D2B53',
                                border: '1px solid #5F574F',
                                color: '#FFF1E8'
                            }}
                        >
                            {categories.map(cat => (
                                <option key={cat} value={cat}>
                                    {cat === 'all' ? 'All Categories' : cat}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                
                <div className="text-sm" style={{ color: '#83769C' }}>
                    Showing {filteredAssets.length} of {assets.length} assets
                </div>
            </div>

            {error && (
                <div className="mb-4 p-3 rounded" style={{ 
                    backgroundColor: '#7E2553',
                    border: '1px solid #FF004D',
                    color: '#FF77A8'
                }}>
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAssets.map(asset => (
                    <div 
                        key={asset.rawId || asset.id} 
                        className="p-4 rounded-lg shadow-lg transition"
                        style={{ 
                            backgroundColor: '#1D2B53',
                            border: '1px solid #5F574F'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.borderColor = '#29ADFF'}
                        onMouseLeave={(e) => e.currentTarget.style.borderColor = '#5F574F'}
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <h3 className="font-semibold" style={{ color: '#FFF1E8' }}>{asset.name}</h3>
                                <div className="text-sm font-mono" style={{ color: '#83769C' }}>{asset.id}</div>
                            </div>
                            <span
                                className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                                style={{
                                    backgroundColor: 
                                        asset.status === 'Present' ? '#00E436' : 
                                        asset.status === 'Missing' ? '#FF004D' : 
                                        asset.status === 'Borrowed' ? '#29ADFF' :
                                        '#FFA300'
                                }}
                            >
                                {asset.status}
                            </span>
                        </div>
                        
                        <div className="mb-3 text-sm space-y-1" style={{ color: '#C2C3C7' }}>
                            <div><span style={{ color: '#83769C' }}>Type:</span> {asset.assetType}</div>
                            
                            {/* Signal - only shown for Present and Inactive */}
                            {(asset.status === 'Present' || asset.status === 'Inactive') && (
                                <div><span style={{ color: '#83769C' }}>Signal:</span> {asset.rssi} dBm</div>
                            )}
                            
                            {/* Last seen - shown for all statuses */}
                            <div><span style={{ color: '#83769C' }}>Last seen:</span> {new Date(asset.lastSeen).toLocaleString()}</div>
                            
                            {/* Status-specific information */}
                            {asset.status === 'Missing' && (
                                <div className="mt-2 pt-2" style={{ borderTop: '1px solid #5F574F' }}>
                                    <span style={{ color: '#FF004D' }}>⚠️ Asset reported missing</span>
                                </div>
                            )}
                            
                            {asset.status === 'Borrowed' && (
                                <div className="mt-2 pt-2" style={{ borderTop: '1px solid #5F574F' }}>
                                    <span style={{ color: '#29ADFF' }}>📋 Currently borrowed</span>
                                </div>
                            )}
                            
                            {asset.status === 'Inactive' && (
                                <div className="mt-2 pt-2" style={{ borderTop: '1px solid #5F574F' }}>
                                    <span style={{ color: '#FFA300' }}>🔧 Under maintenance</span>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-2 justify-end">
                            {roleLoaded && (role == 'admin' || role == 'technician') && (
                              <>
                                <button 
                                    onClick={() => handleEditClick(asset)} 
                                    className="px-3 py-1 text-sm rounded transition"
                                    style={{ 
                                        backgroundColor: '#FFA300',
                                        color: '#000000'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FFEC27'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFA300'}
                                >
                                    Edit
                                </button>
                                <button 
                                    onClick={() => handleOpenDeleteModal(asset)} 
                                    className="px-3 py-1 text-sm rounded transition"
                                    style={{ 
                                        backgroundColor: '#FF004D',
                                        color: '#FFF1E8'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#7E2553'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FF004D'}
                                >
                                    Delete
                                </button>
                              </>
                            )}
                            {roleLoaded && role == 'user' && asset.status === 'Present' && (
                              <>
                                {submittedRequests.has(asset.rawId!) ? (
                                  <span className="px-3 py-1 text-sm font-medium" style={{ color: '#83769C' }}>Request Sent</span>
                                ) : (
                                  <button 
                                      onClick={() => handleOpenBorrowModal(asset)} 
                                      className="px-3 py-1 text-sm rounded transition"
                                      style={{ 
                                          backgroundColor: '#29ADFF',
                                          color: '#000000'
                                      }}
                                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#00E436'}
                                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#29ADFF'}
                                  >
                                      Request to Borrow
                                  </button>
                                )}
                              </>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {filteredAssets.length === 0 && (
                <div className="text-center py-12 rounded-lg" style={{ 
                    backgroundColor: '#1D2B53',
                    border: '1px solid #5F574F'
                }}>
                    <p style={{ color: '#83769C' }}>No assets found matching your filters.</p>
                </div>
            )}
        </div>
    )
}