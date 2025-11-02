import React, { useEffect, useState } from 'react'
import { assetAPI } from '../utils/api'
import AddAssetForm from './AddAssetForm'
import EditAssetForm from './EditAssetForm'

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

export default function Assets() {
    const [assets, setAssets] = useState<Asset[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [search, setSearch] = useState('')
    const [showForm, setShowForm] = useState(false)
    const [editingAsset, setEditingAsset] = useState<any | null>(null)

    useEffect(() => {
        const fetchAssets = async () => {
            try {
                const response = await assetAPI.getAll()
                // Transform backend data to match frontend type
                const transformedData = response.data.map((asset: any) => ({
                    id: `LAB-${String(asset.id).padStart(3, '0')}`,
                    rawId: asset.id, // keep numeric id for edit/delete
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
                }))
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
        // transform backend row to frontend Asset type
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
        // convert frontend asset back to backend-ish shape for form
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
        // transform updated backend row to frontend Asset type
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
        if (!confirm(`Delete asset ${a.name}?`)) return;
        try {
            await assetAPI.delete(a.rawId)
            setAssets(prev => prev.filter(x => x.rawId !== a.rawId))
        } catch (err) {
            console.error('Delete failed', err)
            setError('Failed to delete asset')
        }
    }

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold">Assets</h1>
                <div className="flex items-center gap-2">
                  <button onClick={handleAddClick} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                      Add Asset
                  </button>
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
                                    <button onClick={() => handleEditClick(asset)} className="px-2 py-1 text-sm bg-yellow-100 rounded hover:bg-yellow-200">Edit</button>
                                    <button onClick={() => handleDelete(asset)} className="px-2 py-1 text-sm bg-red-100 rounded hover:bg-red-200">Delete</button>
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