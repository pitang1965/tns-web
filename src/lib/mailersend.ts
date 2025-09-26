interface EmailData {
  to: string;
  subject: string;
  text: string;
  html?: string;
  from?: {
    email: string;
    name?: string;
  };
}

interface MailerSendResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export class MailerSendClient {
  private apiToken: string;
  private baseUrl = 'https://api.mailersend.com/v1';
  private defaultFrom: { email: string; name?: string };

  constructor(
    apiToken: string,
    defaultFromEmail: string,
    defaultFromName?: string
  ) {
    this.apiToken = apiToken;
    this.defaultFrom = {
      email: defaultFromEmail,
      name: defaultFromName,
    };
  }

  async sendEmail(emailData: EmailData): Promise<MailerSendResponse> {
    try {
      const payload = {
        from: emailData.from || this.defaultFrom,
        to: [
          {
            email: emailData.to,
          },
        ],
        subject: emailData.subject,
        text: emailData.text,
        html: emailData.html || emailData.text.replace(/\n/g, '<br>'),
      };

      const response = await fetch(`${this.baseUrl}/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiToken}`,
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.message || `HTTP Error: ${response.status}`,
        };
      }

      return {
        success: true,
        message: 'Email sent successfully',
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async sendContactForm(data: {
    name: string;
    email: string;
    subject: string;
    message: string;
    adminEmail: string;
  }): Promise<MailerSendResponse> {
    const emailHtml = `
      <h2>新しいお問い合わせ</h2>
      <p><strong>お名前:</strong> ${data.name}</p>
      <p><strong>メールアドレス:</strong> ${data.email}</p>
      <p><strong>件名:</strong> ${data.subject}</p>
      <p><strong>メッセージ:</strong></p>
      <p>${data.message.replace(/\n/g, '<br>')}</p>
      <hr>
      <p><small>このメールは旅のしおりのお問い合わせフォームから送信されました。</small></p>
    `;

    const emailText = `
新しいお問い合わせ

お名前: ${data.name}
メールアドレス: ${data.email}
件名: ${data.subject}

メッセージ:
${data.message}

---
このメールは旅のしおりのお問い合わせフォームから送信されました。
    `;

    return this.sendEmail({
      to: data.adminEmail,
      subject: `【お問い合わせ】${data.subject}`,
      text: emailText,
      html: emailHtml,
    });
  }
}

const mailerSend = new MailerSendClient(
  process.env.MAILERSEND_API_TOKEN || '',
  process.env.MAILERSEND_FROM_EMAIL || '',
  process.env.MAILERSEND_FROM_NAME || '旅のしおり'
);

export default mailerSend;
