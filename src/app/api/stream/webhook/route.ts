import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';

// Web push configuration
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  console.error('❌ VAPID keys not configured');
}

webpush.setVapidDetails(
  'mailto:your-email@example.com',
  VAPID_PUBLIC_KEY!,
  VAPID_PRIVATE_KEY!
);

// In-memory storage for push subscriptions (in production, use a database)
const pushSubscriptions = new Map<string, any>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🔔 Stream.io webhook received:', body);

    // Handle different webhook events
    if (body.type === 'message.new') {
      await handleNewMessage(body);
    } else if (body.type === 'user.presence') {
      // Handle presence updates if needed
      console.log('👤 Presence update:', body);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Webhook error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

async function handleNewMessage(data: any) {
  try {
    const message = data.message;
    const channel = data.channel;
    const sender = data.user;

    console.log('📨 New message webhook:', {
      messageId: message.id,
      channelId: channel.id,
      senderId: sender.id,
      text: message.text,
    });

    // Get all users in the channel except the sender
    const recipients = channel.members || {};
    const recipientIds = Object.keys(recipients).filter(id => id !== sender.id);

    console.log('📤 Sending notifications to:', recipientIds);

    // Send push notifications to all recipients
    for (const recipientId of recipientIds) {
      await sendPushNotification(recipientId, {
        title: `New message from ${sender.name || 'Someone'}`,
        body: message.text || 'New message',
        data: {
          channelId: channel.id,
          messageId: message.id,
          senderId: sender.id,
          senderName: sender.name,
        },
      });
    }

  } catch (error) {
    console.error('❌ Error handling new message:', error);
  }
}

async function sendPushNotification(userId: string, notification: any) {
  try {
    // Get user's push subscription from storage
    const subscription = pushSubscriptions.get(userId);
    
    if (!subscription) {
      console.log(`⚠️ No push subscription found for user: ${userId}`);
      return;
    }

    // Send the push notification
    await webpush.sendNotification(subscription, JSON.stringify(notification));
    console.log(`✅ Push notification sent to user: ${userId}`);

  } catch (error) {
    console.error(`❌ Failed to send push notification to user ${userId}:`, error);
    
    // If subscription is invalid, remove it
    if (error.statusCode === 410) {
      pushSubscriptions.delete(userId);
      console.log(`🗑️ Removed invalid subscription for user: ${userId}`);
    }
  }
}

// Store push subscription (called from register-push-subscription endpoint)
export function storePushSubscription(userId: string, subscription: any) {
  pushSubscriptions.set(userId, subscription);
  console.log(`💾 Stored push subscription for user: ${userId}`);
}

// Get push subscription (for testing)
export function getPushSubscription(userId: string) {
  return pushSubscriptions.get(userId);
} 