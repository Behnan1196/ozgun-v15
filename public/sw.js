// Service Worker for Push Notifications
// This handles push events when the app is in the background

self.addEventListener('install', (event) => {
  console.log('🔔 Service Worker: Installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('🔔 Service Worker: Activating...');
  event.waitUntil(self.clients.claim());
});

// Handle push events (when app is in background)
self.addEventListener('push', (event) => {
  console.log('🔔 Service Worker: Push event received');
  console.log('🔔 Event data:', event.data);
  
  let notificationData = {
    title: 'New Message',
    body: 'You have a new message',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'chat-message',
    requireInteraction: false,
    silent: false,
    vibrate: [200, 100, 200],
    data: {}
  };
  
  try {
    if (event.data) {
      const data = event.data.json();
      console.log('🔔 Push data:', data);
      
      // Use the data directly if it has title and body
      if (data.title) {
        notificationData.title = data.title;
      }
      if (data.body) {
        notificationData.body = data.body;
      }
      
      // Extract notification data from Stream.io push payload
      if (data.notification) {
        notificationData.title = data.notification.title || notificationData.title;
        notificationData.body = data.notification.body || notificationData.body;
      }
      
      if (data.data) {
        notificationData.data = data.data;
      }
    }
  } catch (error) {
    console.error('❌ Error parsing push data:', error);
  }
  
  console.log('🔔 Final notification data:', notificationData);
  
  // Show the notification
  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
      .then(() => {
        console.log('✅ Notification shown successfully');
      })
      .catch((error) => {
        console.error('❌ Error showing notification:', error);
      })
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Service Worker: Notification clicked');
  
  event.notification.close();
  
  // Focus the app window or open a new one
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      // Check if there's already a window/tab open with the target URL
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      
      // If no window is open, open a new one
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('🔔 Service Worker: Notification closed');
});

// Handle background sync (if needed)
self.addEventListener('sync', (event) => {
  console.log('🔔 Service Worker: Background sync event:', event.tag);
});

// Handle message events from the main app
self.addEventListener('message', (event) => {
  console.log('🔔 Service Worker: Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
}); 