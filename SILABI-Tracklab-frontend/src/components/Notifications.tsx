import React, { useEffect, useState } from 'react'

type Notification = {
    id: string
    title: string
    message: string
    type: 'info' | 'warning' | 'error'
    timestamp: string
    isRead: boolean
}

export default function Notifications() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const response = await fetch('/api/notifications')
                if (!response.ok) throw new Error('Failed to fetch notifications')
                const data = await response.json()
                setNotifications(data)
            } catch (err) {
                setError('Failed to load notifications')
                // Fallback to mock data during development
                setNotifications(getMockNotifications())
            } finally {
                setLoading(false)
            }
        }

        fetchNotifications()
    }, [])

    const markAsRead = async (id: string) => {
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, isRead: true } : n)
        )
    }

    const deleteNotification = async (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id))
    }

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold">Notifications</h1>
                <button 
                    onClick={() => setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))}
                    className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800"
                >
                    Mark all as read
                </button>
            </div>

            {error && <div className="text-red-600 mb-4">{error}</div>}

            {loading ? (
                <div className="text-center py-8">Loading...</div>
            ) : notifications.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                    No notifications
                </div>
            ) : (
                <div className="space-y-4">
                    {notifications.map(notification => (
                        <div 
                            key={notification.id}
                            className={`p-4 rounded-lg border ${
                                notification.isRead ? 'bg-white' : 'bg-blue-50'
                            }`}
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-medium">
                                        {notification.title}
                                        {!notification.isRead && (
                                            <span className="ml-2 inline-block w-2 h-2 bg-blue-600 rounded-full"/>
                                        )}
                                    </h3>
                                    <p className="text-gray-600 mt-1">{notification.message}</p>
                                    <div className="text-sm text-gray-500 mt-2">
                                        {new Date(notification.timestamp).toLocaleString()}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {!notification.isRead && (
                                        <button
                                            onClick={() => markAsRead(notification.id)}
                                            className="text-sm text-blue-600 hover:text-blue-800"
                                        >
                                            Mark as read
                                        </button>
                                    )}
                                    <button
                                        onClick={() => deleteNotification(notification.id)}
                                        className="text-sm text-red-600 hover:text-red-800"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

function getMockNotifications(): Notification[] {
    return Array.from({ length: 5 }, (_, i) => ({
        id: `notif_${i}`,
        title: `Test Notification ${i + 1}`,
        message: ['Asset went missing', 'Low battery warning', 'New asset detected'][i % 3],
        type: ['info', 'warning', 'error'][i % 3] as Notification['type'],
        timestamp: new Date(Date.now() - i * 1000 * 60 * 30).toISOString(),
        isRead: i % 2 === 0
    }))
}