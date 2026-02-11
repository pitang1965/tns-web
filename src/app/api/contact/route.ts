import { NextRequest, NextResponse } from 'next/server';
import { contactFormSchema } from '@/data/schemas/contactSchema';
import mailerSend from '@/lib/mailersend';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validatedData = contactFormSchema.parse(body);

    if (!process.env.ADMIN_EMAIL) {
      logger.error(new Error('ADMIN_EMAIL is not configured'));
      return NextResponse.json(
        { error: 'メール送信サービスの設定に問題があります。管理者にお問い合わせください。' },
        { status: 500 }
      );
    }

    const result = await mailerSend.sendContactForm({
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
      return NextResponse.json(
        { error: userMessage },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'お問い合わせを受け付けました',
    });

  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: '入力内容に不備があります' },
        { status: 400 }
      );
    }

    logger.error(
      error instanceof Error ? error : new Error('Contact form error'),
    );
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}