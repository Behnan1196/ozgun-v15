import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { getPushSubscription } from '../webhook/route';

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

export async function POST(request: NextRequest) {
  try {
    const { title, body, data } = await request.json();
    
    if (!title || !body) {
      return NextResponse.json(
        { success: false, error: 'Missing title or body' },
        { status: 400 }
      );
    }

    console.log('🔔 Sending push notification:', { title, body });

    // Get the current user's push subscription from localStorage
    // Note: This is a simplified approach - in production, you'd get the user ID from the session
    const subscriptionData = request.headers.get('x-push-subscription');
    
    if (!subscriptionData) {
      return NextResponse.json(
        { success: false, error: 'No push subscription provided' },
        { status: 400 }
      );
    }

    const subscription = JSON.parse(subscriptionData);

    // Send the push notification
    await webpush.sendNotification(subscription, JSON.stringify({
      title,
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'chat-message',
      requireInteraction: false,
      silent: false,
      vibrate: [200, 100, 200],
      data,
    }));
    
    console.log('✅ Push notification sent successfully');
    
    return NextResponse.json({
      success: true,
      message: 'Push notification sent successfully',
    });
    
  } catch (error) {
    console.error('❌ Failed to send push notification:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to send push notification',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
} 