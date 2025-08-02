'use client'

import React, { useState, useEffect } from 'react'
import {
  isNotificationsSupported,
  getNotificationPermission,
  requestNotificationPermission,
} from '@/lib/notifications'

// Optional Stream context hook
const useStreamContext = () => {
  // Always return default values to avoid conditional hook calls
  return {
    notificationsEnabled: false,
    enableNotifications: () => Promise.resolve(),
    disableNotifications: () => Promise.resolve(),
  }
}

interface NotificationSettingsProps {
  className?: string
}

export function NotificationSettings({ className = '' }: NotificationSettingsProps) {
  const { notificationsEnabled } = useStreamContext()
  const [isSupported, setIsSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isLoading, setIsLoading] = useState(false)

  // Debug logging
  console.log('🔍 NotificationSettings Debug:', {
    notificationsEnabled,
    isSupported,
    permission,
    isLoading
  })

  useEffect(() => {
    // Check if notifications are supported
    setIsSupported(isNotificationsSupported())
    setPermission(getNotificationPermission())
  }, [])

  const handleEnableNotifications = async () => {
    setIsLoading(true)
    try {
      const granted = await requestNotificationPermission()
      setPermission(granted ? 'granted' : 'denied')
      
      if (granted) {
        // The Stream context will handle the rest
        console.log('✅ Notification permission granted')
      } else {
        console.log('❌ Notification permission denied')
      }
    } catch (error) {
      console.error('❌ Error requesting notification permission:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isSupported) {
    return (
      <div className={`p-4 bg-yellow-50 border border-yellow-200 rounded-lg ${className}`}>
        <div className="flex items-center space-x-2">
          <div className="text-yellow-600">⚠️</div>
          <div>
            <h3 className="text-sm font-medium text-yellow-800">
              Push Notifications Not Supported
            </h3>
            <p className="text-sm text-yellow-700">
              Your browser doesn't support push notifications. Please use a modern browser.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`p-4 bg-white border rounded-lg ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-900">
            Chat Notifications
          </h3>
          <p className="text-sm text-gray-500">
            Get notified when you receive new messages
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {permission === 'denied' && (
            <div className="text-xs text-red-600">
              Permission denied
            </div>
          )}
          
          {permission === 'default' && (
            <button
              onClick={handleEnableNotifications}
              disabled={isLoading}
              className="px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Enabling...' : 'Enable'}
            </button>
          )}
          
          {permission === 'granted' && (
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs text-green-600">
                {notificationsEnabled ? 'Enabled' : 'Permission granted'}
              </span>
            </div>
          )}
        </div>
      </div>
      
      {permission === 'denied' && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-xs text-red-700">
            Notification permission was denied. Please enable notifications in your browser settings and refresh the page.
          </p>
        </div>
      )}
      
      {permission === 'granted' && !notificationsEnabled && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-xs text-blue-700">
            Permission granted! Notifications will be fully enabled when you visit the chat page.
          </p>
        </div>
      )}
      
      {permission === 'granted' && notificationsEnabled && (
        <div className="mt-3">
          <button
            onClick={async () => {
              try {
                const subscriptionData = localStorage.getItem('push_subscription');
                if (!subscriptionData) {
                  console.error('❌ No push subscription found');
                  return;
                }
                
                const response = await fetch('/api/stream/send-push-notification', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'x-push-subscription': subscriptionData,
                  },
                  body: JSON.stringify({
                    title: 'Test Notification',
                    body: 'This is a test notification from the button!',
                  }),
                });
                
                if (response.ok) {
                  console.log('✅ Test notification sent successfully');
                } else {
                  const error = await response.json();
                  console.error('❌ Failed to send test notification:', error);
                }
              } catch (error) {
                console.error('❌ Error sending test notification:', error);
              }
            }}
            className="w-full px-3 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Test Bildirimi Gönder
          </button>
        </div>
      )}
    </div>
  )
}

export default NotificationSettings 