import React, { useEffect, useState } from 'react'

type Asset = {
    id: string
    name: string
    assetType: string
    location: string
    lastSeen: string
    rssi: number
    status: 'Present' | 'Missing' | 'Inactive'
}

export default function Assets() {
    const [assets, setAssets] = useState<Asset[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [search, setSearch] = useState('')

    useEffect(() => {
        const fetchAssets = async () => {
            try {
                const response = await fetch('/api/assets')
                if (!response.ok) throw new Error('Failed to fetch assets')
                const data = await response.json()
                setAssets(data)
            } catch (err) {
                setError('Failed to load assets')
                // Fallback to mock data during development
                setAssets(getMockAssets())
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

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold">Assets</h1>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                    Add Asset
                </button>
            </div>

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
                        <div key={asset.id} className="bg-white p-4 rounded-lg shadow">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="font-medium">{asset.name}</h3>
                                    <div className="text-sm text-gray-500">{asset.id}</div>
                                </div>
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

function getMockAssets(): Asset[] {
    return Array.from({ length: 12 }, (_, i) => ({
        id: `TAG-${1000 + i}`,
        name: `Asset ${i + 1}`,
        assetType: ['Equipment', 'Tool', 'Vehicle'][i % 3],
        location: ['Workshop', 'Storage', 'Field'][i % 3],
        lastSeen: new Date(Date.now() - i * 1000 * 60 * 15).toISOString(),
        rssi: -50 - Math.floor(Math.random() * 30),
        status: ['Present', 'Missing', 'Inactive'][i % 3] as Asset['status']
    }))
}