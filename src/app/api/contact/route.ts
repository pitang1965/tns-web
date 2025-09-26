import { NextRequest, NextResponse } from 'next/server';
import { contactFormSchema } from '@/data/schemas/contactSchema';
import mailerSend from '@/lib/mailersend';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validatedData = contactFormSchema.parse(body);

    if (!process.env.MAILERSEND_API_TOKEN) {
      console.error('MAILERSEND_API_TOKEN is not configured');
      return NextResponse.json(
        { error: 'メール送信サービスの設定に問題があります' },
        { status: 500 }
      );
    }

    if (!process.env.ADMIN_EMAIL) {
      console.error('ADMIN_EMAIL is not configured');
      return NextResponse.json(
        { error: '管理者メールアドレスが設定されていません' },
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
      console.error('Failed to send email:', result.error);
      return NextResponse.json(
        { error: result.error || 'メール送信に失敗しました' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'お問い合わせを受け付けました',
    });

  } catch (error) {
    console.error('Contact form error:', error);

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: '入力内容に不備があります' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}