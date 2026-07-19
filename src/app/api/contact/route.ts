import { NextRequest, NextResponse } from 'next/server';
import { contactFormSchema } from '@/data/schemas/contactSchema';
import resend from '@/lib/resend';
import { logger } from '@/lib/logger';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

// 未認証エンドポイントのため、メール爆撃・クォータ枯渇対策として
// IPごとに10分間で3回までに制限
const RATE_LIMIT = 3;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rateLimitResult = checkRateLimit({
      key: `contact:${ip}`,
      limit: RATE_LIMIT,
      windowMs: RATE_LIMIT_WINDOW_MS,
    });

    if (!rateLimitResult.allowed) {
      logger.warn('[お問い合わせ] レート制限超過', { ip });
      return NextResponse.json(
        {
          error:
            '送信回数の上限に達しました。しばらく時間をおいて再度お試しください。',
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimitResult.retryAfterSeconds),
          },
        },
      );
    }

    const body = await request.json();

    const validatedData = contactFormSchema.parse(body);

    if (!process.env.ADMIN_EMAIL) {
      logger.error(new Error('ADMIN_EMAIL is not configured'));
      return NextResponse.json(
        {
          error:
            'メール送信サービスの設定に問題があります。管理者にお問い合わせください。',
        },
        { status: 500 },
      );
    }

    const result = await resend.sendContactForm({
      name: validatedData.name,
      email: validatedData.email,
      subject: validatedData.subject,
      message: validatedData.message,
      adminEmail: process.env.ADMIN_EMAIL,
    });

    if (!result.success) {
      const userMessage = result.isConfigError
        ? 'メール送信サービスの設定に問題があります。管理者にお問い合わせください。'
        : 'メール送信に失敗しました。しばらく時間をおいて再度お試しください。';
      return NextResponse.json({ error: userMessage }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'お問い合わせを受け付けました',
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: '入力内容に不備があります' },
        { status: 400 },
      );
    }

    logger.error(
      error instanceof Error ? error : new Error('Contact form error'),
    );
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 },
    );
  }
}
