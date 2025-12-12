import React, { useEffect, useState } from 'react';
import { notificationAPI } from '../utils/api';
import { supabase } from '../utils/supabase';

interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadNotifications();

    // Subscribe to real-time notification updates
    const subscription = supabase
      .channel('notifications_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications'
        },
        (payload) => {
          console.log('Notification update received:', payload);
          
          if (payload.eventType === 'INSERT') {
            // Add new notification to the top
            setNotifications(prev => [payload.new as Notification, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            // Update existing notification
            setNotifications(prev => 
              prev.map(notif => 
                notif.id === payload.new.id ? payload.new as Notification : notif
              )
            );
          } else if (payload.eventType === 'DELETE') {
            // Remove deleted notification
            setNotifications(prev => prev.filter(notif => notif.id !== payload.old.id));
          }
        }
      )
      .subscribe((status) => {
        console.log('Notifications subscription status:', status);
      });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await notificationAPI.getAll();
      setNotifications(response.data);
    } catch (err: any) {
      console.error('Error loading notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationAPI.markAsRead(id);
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === id ? { ...notif, is_read: true } : notif
        )
      );
    } catch (err: any) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, is_read: true }))
      );
    } catch (err: any) {
      console.error('Error marking all as read:', err);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await notificationAPI.delete(id);
      setNotifications(prev => prev.filter(notif => notif.id !== id));
    } catch (err: any) {
      console.error('Error deleting notification:', err);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      timeZone: 'Asia/Jakarta'
    }) + ', ' + date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: 'Asia/Jakarta'
    });
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

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
          <h1 className="text-3xl font-bold" style={{ color: '#29ADFF' }}>Notifications</h1>
          <p className="text-sm mt-1" style={{ color: '#83769C' }}>
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {notifications.some(n => !n.is_read) && (
          <button
            onClick={handleMarkAllAsRead}
            className="font-medium hover:opacity-80 transition"
            style={{ color: '#29ADFF' }}
          >
            Mark all as read
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-lg" style={{ 
          backgroundColor: '#7E2553',
          border: '1px solid #FF004D'
        }}>
          <p style={{ color: '#FF77A8' }}>{error}</p>
        </div>
      )}

      {/* Notifications List */}
      <div className="space-y-4">
        {notifications.length === 0 ? (
          <div className="rounded-lg shadow p-8 text-center" style={{ 
            backgroundColor: '#1D2B53',
            border: '1px solid #5F574F'
          }}>
            <div className="text-6xl mb-4">🔔</div>
            <p style={{ color: '#83769C' }}>No notifications</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className="rounded-lg shadow p-6 transition"
              style={{
                backgroundColor: '#1D2B53',
                borderLeft: !notification.is_read ? '4px solid #29ADFF' : '4px solid transparent',
                border: !notification.is_read ? '1px solid #5F574F' : '1px solid #5F574F'
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold" style={{ color: '#FFF1E8' }}>
                      {notification.title}
                    </h3>
                    {!notification.is_read && (
                      <span 
                        className="w-2 h-2 rounded-full" 
                        style={{ backgroundColor: '#29ADFF' }}
                      ></span>
                    )}
                  </div>
                  <p className="mt-2" style={{ color: '#C2C3C7' }}>{notification.message}</p>
                  <p className="text-sm mt-2" style={{ color: '#83769C' }}>
                    {formatDate(notification.created_at)}
                  </p>
                </div>
                <div className="flex gap-2 ml-4">
                  {!notification.is_read && (
                    <button
                      onClick={() => handleMarkAsRead(notification.id)}
                      className="text-sm font-medium hover:opacity-80 transition"
                      style={{ color: '#29ADFF' }}
                    >
                      Mark as read
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(notification.id)}
                    className="text-sm font-medium hover:opacity-80 transition"
                    style={{ color: '#FF004D' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}