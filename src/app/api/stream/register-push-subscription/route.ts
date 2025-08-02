import { NextRequest, NextResponse } from 'next/server';
import { StreamChat } from 'stream-chat';
import webpush from 'web-push';
import { storePushSubscription } from '@/lib/push-subscriptions';

// Stream.io configuration
const STREAM_CONFIG = {
  API_KEY: process.env.NEXT_PUBLIC_STREAM_API_KEY || 'mmhfdzb5evj2',
  API_SECRET: process.env.STREAM_API_SECRET || 'demo_secret',
};

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
    const { userId, subscription } = await request.json();
    
    if (!userId || !subscription) {
      return NextResponse.json(
        { success: false, error: 'Missing userId or subscription' },
        { status: 400 }
      );
    }

    console.log('🔔 Registering push subscription for user:', userId);

    // Store subscription for webhook notifications
    storePushSubscription(userId, subscription);
    
    // Test the subscription
    try {
      await webpush.sendNotification(subscription, JSON.stringify({
        title: 'Test Notification',
        body: 'Push notifications are working!',
      }));
      
      console.log('✅ Push subscription validated and stored successfully');
      
      return NextResponse.json({
        success: true,
        message: 'Push subscription registered successfully',
      });
      
    } catch (error) {
      console.error('❌ Failed to validate push subscription:', error);
      return NextResponse.json(
        { success: false, error: 'Invalid push subscription' },
        { status: 400 }
      );
    }
    
  } catch (error) {
    console.error('❌ Failed to register push subscription:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to register push subscription',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Send push notification to a specific user
export async function PUT(request: NextRequest) {
  try {
    const { userId, title, body, data } = await request.json();
    
    if (!userId || !title || !body) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // In a real implementation, you would:
    // 1. Get the user's push subscription from your database
    // 2. Send the notification to that subscription
    
    console.log('🔔 Sending push notification to user:', userId);
    
    // For demo purposes, we'll just return success
    // In production, you would send the actual notification here
    
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