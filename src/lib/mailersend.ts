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
      <p><small>このメールは車旅のしおりのお問い合わせフォームから送信されました。</small></p>
    `;

    const emailText = `
新しいお問い合わせ

お名前: ${data.name}
メールアドレス: ${data.email}
件名: ${data.subject}

メッセージ:
${data.message}

---
このメールは車旅のしおりのお問い合わせフォームから送信されました。
    `;

    return this.sendEmail({
      to: data.adminEmail,
      subject: `【お問い合わせ】${data.subject}`,
      text: emailText,
      html: emailHtml,
    });
  }

  async sendCampingSpotSubmission(data: {
    name: string;
    prefecture: string;
    address?: string;
    type: string;
    submitterName?: string;
    submitterEmail?: string;
    adminEmail: string;
    submissionId: string;
  }): Promise<MailerSendResponse> {
    const typeLabels: Record<string, string> = {
      roadside_station: '道の駅',
      sa_pa: 'SA/PA',
      rv_park: 'RVパーク',
      convenience_store: 'コンビニ',
      parking_lot: '駐車場',
      other: 'その他',
    };

    const emailHtml = `
      <h2>新しい車中泊スポット投稿</h2>
      <p><strong>スポット名:</strong> ${data.name}</p>
      <p><strong>都道府県:</strong> ${data.prefecture}</p>
      <p><strong>住所:</strong> ${data.address || '未入力'}</p>
      <p><strong>スポットタイプ:</strong> ${
        typeLabels[data.type] || data.type
      }</p>
      ${
        data.submitterName
          ? `<p><strong>投稿者名:</strong> ${data.submitterName}</p>`
          : ''
      }
      ${
        data.submitterEmail
          ? `<p><strong>投稿者メール:</strong> ${data.submitterEmail}</p>`
          : ''
      }
      <p><strong>投稿ID:</strong> ${data.submissionId}</p>
      <hr>
      <p><small>このメールは車旅のしおりの車中泊スポット投稿フォームから送信されました。</small></p>
    `;

    const emailText = `
新しい車中泊スポット投稿

スポット名: ${data.name}
都道府県: ${data.prefecture}
住所: ${data.address || '未入力'}
スポットタイプ: ${typeLabels[data.type] || data.type}
${data.submitterName ? `投稿者名: ${data.submitterName}` : ''}
${data.submitterEmail ? `投稿者メール: ${data.submitterEmail}` : ''}
投稿ID: ${data.submissionId}

---
このメールは車旅のしおりの車中泊スポット投稿フォームから送信されました。
    `;

    return this.sendEmail({
      to: data.adminEmail,
      subject: `【車中泊スポット投稿】${data.name}`,
      text: emailText,
      html: emailHtml,
    });
  }

  async sendUserRegistrationNotification(data: {
    userId: string;
    userEmail: string;
    userName: string;
    createdAt?: string;
    adminEmail: string;
    userStats?: {
      total: number;
      activeUsers: number;
      newUsersToday: number;
      newUsersThisWeek: number;
      newUsersThisMonth: number;
    } | null;
  }): Promise<MailerSendResponse> {
    const userStatsHtml = data.userStats
      ? `
      <h3>📊 ユーザー統計</h3>
      <ul>
        <li><strong>総ユーザー数:</strong> ${data.userStats.total.toLocaleString()}人</li>
        <li><strong>今日の新規登録:</strong> ${
          data.userStats.newUsersToday
        }人</li>
        <li><strong>今週の新規登録:</strong> ${
          data.userStats.newUsersThisWeek
        }人</li>
        <li><strong>今月の新規登録:</strong> ${
          data.userStats.newUsersThisMonth
        }人</li>
      </ul>
    `
      : '';

    const emailHtml = `
      <h2>新しいユーザー登録</h2>
      <p><strong>ユーザーID:</strong> ${data.userId}</p>
      <p><strong>ユーザー名:</strong> ${data.userName}</p>
      <p><strong>メールアドレス:</strong> ${data.userEmail}</p>
      ${
        data.createdAt
          ? `<p><strong>登録日時:</strong> ${new Date(
              data.createdAt
            ).toLocaleString('ja-JP')}</p>`
          : ''
      }
      ${userStatsHtml}
      <hr>
      <p><small>このメールは車旅のしおりの新規ユーザー登録時に自動送信されました。</small></p>
    `;

    const userStatsText = data.userStats
      ? `
📊 ユーザー統計
- 総ユーザー数: ${data.userStats.total.toLocaleString()}人
- 今日の新規登録: ${data.userStats.newUsersToday}人
- 今週の新規登録: ${data.userStats.newUsersThisWeek}人
- 今月の新規登録: ${data.userStats.newUsersThisMonth}人
`
      : '';

    const emailText = `
新しいユーザー登録

ユーザーID: ${data.userId}
ユーザー名: ${data.userName}
メールアドレス: ${data.userEmail}
${
  data.createdAt
    ? `登録日時: ${new Date(data.createdAt).toLocaleString('ja-JP')}`
    : ''
}
${userStatsText}
---
このメールは車旅のしおりの新規ユーザー登録時に自動送信されました。
    `;

    return this.sendEmail({
      to: data.adminEmail,
      subject: `【新規ユーザー登録】${data.userName}`,
      text: emailText,
      html: emailHtml,
    });
  }
}

const mailerSend = new MailerSendClient(
  process.env.MAILERSEND_API_TOKEN || '',
  process.env.MAILERSEND_FROM_EMAIL || '',
  process.env.MAILERSEND_FROM_NAME || '車旅のしおり'
);

export default mailerSend;
