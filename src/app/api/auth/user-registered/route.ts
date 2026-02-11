import { NextRequest, NextResponse } from 'next/server';
import mailerSend from '@/lib/mailersend';
import { logger } from '@/lib/logger';
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
      logger.error(new Error('ADMIN_EMAIL environment variable not set'));
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
      logger.warn('Failed to get user stats', {
        error: error instanceof Error ? error.message : String(error),
      });
      userStats = null;
    }

    // メール送信を試行（失敗してもWebhookは成功扱い）
    const result = await mailerSend.sendUserRegistrationNotification({
      userId,
      userEmail: email,
      userName: name || 'Unknown',
      createdAt,
      adminEmail,
      userStats,
    });

    if (!result.success) {
      logger.error(
        new Error(`[ユーザー登録通知] メール送信失敗: ${result.error}`),
        { userId, isConfigError: result.isConfigError }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error(
      error instanceof Error ? error : new Error('Error in user registration webhook'),
    );
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}