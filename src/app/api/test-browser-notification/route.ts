import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { title, body } = await request.json();
    
    return NextResponse.json({
      success: true,
      message: 'Test notification data',
      notification: {
        title: title || 'Test Notification',
        body: body || 'This is a test notification',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'test-notification',
        require_interaction: false,
        silent: false,
        vibrate: [200, 100, 200],
      },
    });
    
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process test notification',
      },
      { status: 500 }
    );
  }
} 