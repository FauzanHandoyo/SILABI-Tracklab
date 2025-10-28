import React, { useEffect, useMemo, useState } from 'react'

type HistoryEntry = {
    id: string
    assetId: string
    name?: string
    t: string // ISO timestamp
    rssi: number
    status: string
}

type Props = {
    endpoint?: string
}

export default function History({ endpoint = '/api/history' }: Props): React.ReactElement {
    const [data, setData] = useState<HistoryEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [query, setQuery] = useState('')
    const [days, setDays] = useState<number>(7)

    useEffect(() => {
        const controller = new AbortController()
        let isMounted = true

        async function load() {
            setLoading(true)
            setError(null)

            try {
                // Check if backend is available
                const res = await fetch(endpoint, { 
                    signal: controller.signal,
                    headers: {
                        'Accept': 'application/json'
                    }
                })
                
                // Handle non-JSON responses
                const contentType = res.headers.get('content-type')
                if (!contentType?.includes('application/json')) {
                    throw new Error('Backend unavailable - using mock data')
                }

                if (!res.ok) {
                    throw new Error(`HTTP ${res.status}`)
                }

                const json = await res.json()
                if (!isMounted) return

                if (Array.isArray(json) && isHistoryArray(json)) {
                    setData(json)
                } else {
                    console.warn('Invalid API response format - using mock data')
                    setData(mockHistory())
                }
            } catch (err: any) {
                if (err.name === 'AbortError') return
                console.warn('History load failed:', err.message)
                // Use mock data for development
                setData(mockHistory())
                setError('Using mock data - ' + err.message)
            } finally {
                if (isMounted) setLoading(false)
            }
        }

        load()
        return () => {
            isMounted = false
            controller.abort()
        }
    }, [endpoint])

    // --- Derived filters ---
    const cutoff = useMemo(() => {
        const d = new Date()
        d.setDate(d.getDate() - days)
        return d
    }, [days])

    const filtered = useMemo(() => {
        return data
            .map((h) => ({ ...h, parsedTime: new Date(h.t) }))
            .filter((h) => !isNaN(h.parsedTime.getTime()))
            .filter((h) => h.parsedTime >= cutoff)
            .filter(
                (h) =>
                    !query ||
                    h.assetId.toLowerCase().includes(query.toLowerCase()) ||
                    (h.name && h.name.toLowerCase().includes(query.toLowerCase()))
            )
            .sort((a, b) => b.parsedTime.getTime() - a.parsedTime.getTime())
    }, [data, cutoff, query])

    // --- Render ---
    return (
        <div className="min-h-screen bg-gray-100">
            <div className="p-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-2xl font-semibold">History</h1>
                    <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">Last</label>
                    <select
                        value={days}
                        onChange={(e) => setDays(Number(e.target.value))}
                        className="border rounded px-2 py-1"
                    >
                        <option value={1}>1d</option>
                        <option value={7}>7d</option>
                        <option value={30}>30d</option>
                        <option value={90}>90d</option>
                    </select>
                </div>
            </div>

            {/* Search Bar */}
            <div className="mb-4 flex items-center gap-2">
                <input
                    aria-label="Search history"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by asset id or name"
                    className="flex-1 border rounded px-3 py-2"
                    disabled={loading}
                />
                <div className="text-sm text-gray-500">
                    {loading ? 'Loading…' : `${filtered.length} records`}
                </div>
            </div>

            {error && <div className="text-red-600 mb-3">{error}</div>}

            {/* Table */}
            <div className="overflow-auto bg-white rounded shadow">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 text-left text-gray-600">
                        <tr>
                            <th className="px-4 py-2">Time</th>
                            <th className="px-4 py-2">Asset</th>
                            <th className="px-4 py-2">RSSI</th>
                            <th className="px-4 py-2">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                                    Loading…
                                </td>
                            </tr>
                        ) : filtered.length > 0 ? (
                            filtered.map((h) => (
                                <tr key={h.id} className="border-t last:border-b">
                                    <td className="px-4 py-3 align-top w-48">
                                        <div className="text-xs text-gray-500">{formatDate(h.t)}</div>
                                        <div className="text-xs text-gray-400">
                                            {new Date(h.t).toLocaleTimeString()}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="font-medium">{h.name ?? h.assetId}</div>
                                        <div className="text-xs text-gray-500">{h.assetId}</div>
                                    </td>
                                    <td className="px-4 py-3">{h.rssi} dBm</td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`px-2 py-1 rounded text-xs ${
                                                h.status === 'Present'
                                                    ? 'bg-green-100 text-green-800'
                                                    : h.status === 'Missing'
                                                    ? 'bg-red-100 text-red-800'
                                                    : 'bg-yellow-100 text-yellow-800'
                                            }`}
                                        >
                                            {h.status}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                                    No records found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
    )
}

// --- Helpers ---
function formatDate(iso: string): string {
    const d = new Date(iso)
    return isNaN(d.getTime()) ? iso : d.toLocaleDateString()
}

function isHistoryArray(arr: unknown[]): arr is HistoryEntry[] {
    return arr.every((item) => {
        if (typeof item !== 'object' || item === null) return false
        const anyItem = item as any
        return (
            typeof anyItem.id === 'string' &&
            typeof anyItem.assetId === 'string' &&
            typeof anyItem.t === 'string' &&
            typeof anyItem.rssi === 'number' &&
            typeof anyItem.status === 'string'
        )
    })
}

function mockHistory(): HistoryEntry[] {
    const now = Date.now()
    const statuses = ['Present', 'Inactive', 'Missing']
    return Array.from({ length: 100 }, (_, i) => {
        const t = new Date(now - i * 1000 * 60 * 15).toISOString()
        const rssi = Math.floor(-80 + Math.random() * 50)
        return {
            id: `h_${i}`,
            assetId: `TAG-${1000 + (i % 12)}`,
            name: `Asset ${(i % 12) + 1}`,
            t,
            rssi,
            status: statuses[Math.floor(Math.random() * statuses.length)],
        }
    })
}
