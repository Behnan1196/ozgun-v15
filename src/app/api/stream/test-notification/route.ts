import { NextRequest, NextResponse } from 'next/server';
import { StreamChat } from 'stream-chat';

// Stream.io configuration
const STREAM_CONFIG = {
  API_KEY: process.env.NEXT_PUBLIC_STREAM_API_KEY || 'mmhfdzb5evj2',
  API_SECRET: process.env.STREAM_API_SECRET || 'demo_secret',
};

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing Stream.io push notifications...');
    
    // Create Stream.io server client
    const serverClient = StreamChat.getInstance(STREAM_CONFIG.API_KEY, STREAM_CONFIG.API_SECRET);
    
    // Get current app settings to verify configuration
    const appSettings = await serverClient.getAppSettings();
    
    console.log('📋 Current notification settings:', {
      push_notification_template: !!appSettings.push_notification_template,
      push_notification_rules: !!appSettings.push_notification_rules,
    });
    
    return NextResponse.json({
      success: true,
      message: 'Notification system is configured',
      settings: {
        has_template: !!appSettings.push_notification_template,
        has_rules: !!appSettings.push_notification_rules,
        template_version: appSettings.push_notification_template?.version,
      },
    });
    
  } catch (error) {
    console.error('❌ Failed to test notifications:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to test notifications',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
} 