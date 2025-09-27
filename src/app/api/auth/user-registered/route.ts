import { NextRequest, NextResponse } from 'next/server';
import mailerSend from '@/lib/mailersend';
import { auth0Management } from '@/lib/auth0Management';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, email, name, createdAt } = body;

    if (!userId || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      console.error('ADMIN_EMAIL environment variable not set');
      return NextResponse.json(
        { error: 'Admin email not configured' },
        { status: 500 }
      );
    }

    // ユーザー統計を取得
    let userStats;
    try {
      userStats = await auth0Management.getUserStats();
    } catch (error) {
      console.warn('Failed to get user stats:', error);
      userStats = null;
    }

    // メール送信を試行（失敗してもWebhookは成功扱い）
    try {
      const result = await mailerSend.sendUserRegistrationNotification({
        userId,
        userEmail: email,
        userName: name || 'Unknown',
        createdAt,
        adminEmail,
        userStats,
      });

      if (!result.success) {
        console.error('Failed to send user registration notification:', result.error);
      }
    } catch (error) {
      console.error('Error sending user registration notification:', error);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in user registration webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}