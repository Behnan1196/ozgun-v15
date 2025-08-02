import { StreamChat } from 'stream-chat';

// Notification configuration
export const NOTIFICATION_CONFIG = {
  // Web push notification settings
  webPush: {
    vapidPublicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
    vapidPrivateKey: process.env.VAPID_PRIVATE_KEY || '',
  },
  
  // Notification templates
  templates: {
    message: {
      title: 'New message from {{ sender.name }}',
      body: '{{ truncate message.text 100 }}',
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      tag: 'chat-message',
      requireInteraction: false,
      silent: false,
      vibrate: [200, 100, 200],
    },
  },
};

// Register device for push notifications
export const registerDeviceForNotifications = async (
  chatClient: StreamChat,
  userId: string
): Promise<void> => {
  try {
    console.log('🔔 Setting up web push notifications...');
    
    // Check if service worker is supported
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('⚠️ Push notifications not supported in this browser');
      return;
    }

    // Request notification permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('⚠️ Notification permission denied');
      return;
    }

    // Register service worker
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('✅ Service worker registered');

    // Get push subscription
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: NOTIFICATION_CONFIG.webPush.vapidPublicKey,
    });

    // Store subscription in localStorage for server-side use
    const subscriptionData = subscription.toJSON();
    localStorage.setItem('push_subscription', JSON.stringify(subscriptionData));
    
    // Register subscription with our server
    try {
      const response = await fetch('/api/stream/register-push-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          subscription: subscriptionData,
        }),
      });
      
      if (response.ok) {
        console.log('✅ Push subscription registered with server');
      } else {
        console.warn('⚠️ Failed to register subscription with server');
      }
    } catch (error) {
      console.warn('⚠️ Could not register subscription with server:', error);
    }
    
    console.log('✅ Web push subscription created and stored locally');
    console.log('ℹ️ Notifications will be handled through server-side push');

  } catch (error) {
    console.error('❌ Failed to setup web push notifications:', error);
    throw error;
  }
};

// Remove device from push notifications
export const removeDeviceFromNotifications = async (
  chatClient: StreamChat
): Promise<void> => {
  try {
    console.log('🔔 Removing web push notifications...');
    
    // Remove web push subscription
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        localStorage.removeItem('push_subscription');
      }
    }
    
    console.log('✅ Web push notifications removed');
  } catch (error) {
    console.error('❌ Failed to remove web push notifications:', error);
    throw error;
  }
};

// Handle incoming push notifications
export const handlePushNotification = (
  notification: any,
  onMessageReceived?: (channelId: string, messageId: string) => void
): void => {
  try {
    console.log('🔔 Received push notification:', notification);
    
    // Extract data from notification
    const data = notification.data || notification;
    const channelId = data.channel_id;
    const messageId = data.id;
    const senderName = data.sender_name || 'Someone';
    const messageText = data.message_text || 'New message';
    
    // Show local notification if app is in foreground
    if (document.hasFocus()) {
      showLocalNotification(senderName, messageText, data);
    }
    
    // Call callback if provided
    if (onMessageReceived && channelId && messageId) {
      onMessageReceived(channelId, messageId);
    }
    
  } catch (error) {
    console.error('❌ Error handling push notification:', error);
  }
};

// Show local notification (for when app is in foreground)
const showLocalNotification = (
  title: string,
  body: string,
  data?: any
): void => {
  if ('Notification' in window && Notification.permission === 'granted') {
    const notification = new Notification(title, {
      body,
      icon: NOTIFICATION_CONFIG.templates.message.icon,
      badge: NOTIFICATION_CONFIG.templates.message.badge,
      tag: NOTIFICATION_CONFIG.templates.message.tag,
      requireInteraction: false,
      silent: false,
      vibrate: NOTIFICATION_CONFIG.templates.message.vibrate,
      data,
    });
    
    // Auto-close after 5 seconds
    setTimeout(() => {
      notification.close();
    }, 5000);
    
    // Handle click
    notification.onclick = () => {
      window.focus();
      notification.close();
      
      // Navigate to chat if data is provided
      if (data?.channel_id) {
        // You can implement navigation logic here
        console.log('Navigate to channel:', data.channel_id);
      }
    };
  }
};

// Setup notification listeners
export const setupNotificationListeners = (
  chatClient: StreamChat,
  onMessageReceived?: (channelId: string, messageId: string) => void
): (() => void) => {
  console.log('🔔 Setting up notification listeners...');
  
  // Listen for new messages
  const handleNewMessage = async (event: any) => {
    console.log('📨 New message event:', event);
    console.log('🔍 Current user ID:', chatClient.userID);
    console.log('🔍 Message sender ID:', event.user?.id);
    console.log('🔍 Document has focus:', document.hasFocus());
    
    // Only show notification if message is from someone else
    if (event.user?.id !== chatClient.userID) {
      console.log('✅ Message is from someone else, processing notification...');
      
      const channelId = event.channel?.id;
      const messageId = event.message?.id;
      
      if (channelId && messageId) {
        console.log('✅ Channel and message IDs found:', { channelId, messageId });
        
        // Show local notification if app is in focus
        if (document.hasFocus()) {
          console.log('📱 App is focused, showing local notification');
          handlePushNotification({
            data: {
              channel_id: channelId,
              id: messageId,
              sender_name: event.user?.name || 'Someone',
              message_text: event.message?.text || 'New message',
            }
          }, onMessageReceived);
        } else {
          console.log('🔔 App is not focused, sending push notification');
          // Send push notification if app is not in focus
          await sendPushNotificationToServer({
            title: `New message from ${event.user?.name || 'Someone'}`,
            body: event.message?.text || 'New message',
            data: {
              channelId,
              messageId,
              senderId: event.user?.id,
              senderName: event.user?.name,
            },
          });
        }
      } else {
        console.log('❌ Missing channel or message ID');
      }
    } else {
      console.log('❌ Message is from current user, ignoring');
    }
  };
  
  // Listen for message.new events
  chatClient.on('message.new', handleNewMessage);
  
  // Return cleanup function
  return () => {
    console.log('🧹 Cleaning up notification listeners...');
    chatClient.off('message.new', handleNewMessage);
  };
};

// Send push notification to server
async function sendPushNotificationToServer(notification: any) {
  try {
    console.log('🚀 Attempting to send push notification:', notification);
    
    // Get the current user's push subscription from localStorage
    const subscriptionData = localStorage.getItem('push_subscription');
    
    if (!subscriptionData) {
      console.warn('⚠️ No push subscription found in localStorage');
      return;
    }

    console.log('📋 Found subscription data in localStorage');
    console.log('📤 Sending request to /api/stream/send-push-notification');

    const response = await fetch('/api/stream/send-push-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-push-subscription': subscriptionData,
      },
      body: JSON.stringify(notification),
    });
    
    console.log('📥 Response status:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Push notification sent to server:', result);
    } else {
      const error = await response.json();
      console.warn('⚠️ Failed to send push notification to server:', error);
    }
  } catch (error) {
    console.warn('⚠️ Could not send push notification to server:', error);
  }
}

// Check if notifications are supported
export const isNotificationsSupported = (): boolean => {
  return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
};

// Check notification permission
export const getNotificationPermission = (): NotificationPermission => {
  return Notification.permission;
};

// Request notification permission
export const requestNotificationPermission = async (): Promise<boolean> => {
  const permission = await Notification.requestPermission();
  return permission === 'granted';
};

// Setup service worker for push notifications
export const setupServiceWorker = async (): Promise<void> => {
  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('✅ Service worker registered for notifications');
      
      // Listen for push events
      registration.addEventListener('push', (event) => {
        console.log('🔔 Push event received:', event);
        
        if (event.data) {
          const data = event.data.json();
          handlePushNotification(data);
        }
      });
      
      // Listen for notification clicks
      registration.addEventListener('notificationclick', (event) => {
        console.log('🔔 Notification clicked:', event);
        
        event.notification.close();
        
        // Focus the window
        event.waitUntil(
          clients.matchAll({ type: 'window' }).then((clientList) => {
            for (const client of clientList) {
              if (client.url === '/' && 'focus' in client) {
                return client.focus();
              }
            }
            if (clients.openWindow) {
              return clients.openWindow('/');
            }
          })
        );
      });
    }
  } catch (error) {
    console.error('❌ Failed to setup service worker:', error);
  }
}; 