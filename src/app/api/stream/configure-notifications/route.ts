import { NextRequest, NextResponse } from 'next/server';
import { StreamChat } from 'stream-chat';

// Stream.io configuration
const STREAM_CONFIG = {
  API_KEY: process.env.NEXT_PUBLIC_STREAM_API_KEY || 'mmhfdzb5evj2',
  API_SECRET: process.env.STREAM_API_SECRET || 'demo_secret',
};

export async function POST(request: NextRequest) {
  try {
    console.log('🔔 Configuring Stream.io push notifications...');
    
    // Create Stream.io server client
    const serverClient = StreamChat.getInstance(STREAM_CONFIG.API_KEY, STREAM_CONFIG.API_SECRET);
    
    // Configure push notification settings
    const pushConfig = {
      // Web push notifications
      web_push: {
        vapid_public_key: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        vapid_private_key: process.env.VAPID_PRIVATE_KEY,
      },
      
      // Push notification templates
      push_notification_template: {
        version: 'v2',
        default: {
          title: 'New message from {{ sender.name }}',
          body: '{{ truncate message.text 100 }}',
          sound: 'default',
          badge: '{{ unread_count }}',
          category: 'message',
          mutable_content: true,
          thread_id: '{{ channel.id }}',
        },
        web: {
          title: 'New message from {{ sender.name }}',
          body: '{{ truncate message.text 100 }}',
          icon: '/icon-192x192.png',
          badge: '/badge-72x72.png',
          tag: 'chat-message',
          require_interaction: false,
          silent: false,
          vibrate: [200, 100, 200],
          actions: [
            {
              action: 'open',
              title: 'Open Chat',
            },
            {
              action: 'mark_read',
              title: 'Mark as Read',
            },
          ],
        },
        ios: {
          title: 'New message from {{ sender.name }}',
          body: '{{ truncate message.text 100 }}',
          sound: 'default',
          badge: '{{ unread_count }}',
          category: 'message',
          mutable_content: true,
          thread_id: '{{ channel.id }}',
        },
        android: {
          title: 'New message from {{ sender.name }}',
          body: '{{ truncate message.text 100 }}',
          sound: 'default',
          priority: 'high',
          channel_id: 'chat-messages',
          click_action: 'OPEN_ACTIVITY_1',
          icon: 'ic_notification',
          color: '#3B82F6',
        },
      },
      
      // Push notification rules
      push_notification_rules: {
        // Only send notifications for new messages
        message_new: {
          enabled: true,
          channels: ['messaging'],
          user_roles: ['user', 'admin'],
        },
        // Don't send notifications for message updates/deletes
        message_updated: {
          enabled: false,
        },
        message_deleted: {
          enabled: false,
        },
        // Don't send notifications for reactions
        message_reaction_new: {
          enabled: false,
        },
        message_reaction_updated: {
          enabled: false,
        },
        message_reaction_deleted: {
          enabled: false,
        },
      },
    };
    
    // Update Stream.io app settings
    await serverClient.updateAppSettings({
      push_notification_template: pushConfig.push_notification_template,
      push_notification_rules: pushConfig.push_notification_rules,
    });
    
    console.log('✅ Stream.io push notifications configured successfully');
    
    return NextResponse.json({
      success: true,
      message: 'Push notifications configured successfully',
    });
    
  } catch (error) {
    console.error('❌ Failed to configure push notifications:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to configure push notifications',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    console.log('🔔 Getting Stream.io push notification configuration...');
    
    // Create Stream.io server client
    const serverClient = StreamChat.getInstance(STREAM_CONFIG.API_KEY, STREAM_CONFIG.API_SECRET);
    
    // Get current app settings
    const appSettings = await serverClient.getAppSettings();
    
    return NextResponse.json({
      success: true,
      data: {
        push_notification_template: appSettings.push_notification_template,
        push_notification_rules: appSettings.push_notification_rules,
      },
    });
    
  } catch (error) {
    console.error('❌ Failed to get push notification configuration:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get push notification configuration',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
} 