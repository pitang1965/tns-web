import { logger } from '@/lib/logger';

type Auth0ManagementToken = {
  access_token: string;
  token_type: string;
  expires_in: number;
};

type Auth0UserStats = {
  total: number;
  activeUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
};

export class Auth0ManagementClient {
  private domain: string;
  private clientId: string;
  private clientSecret: string;

  constructor() {
    this.domain = process.env.AUTH0_DOMAIN || '';
    this.clientId = process.env.AUTH0_M2M_CLIENT_ID || '';
    this.clientSecret = process.env.AUTH0_M2M_CLIENT_SECRET || '';
  }

  private async getManagementToken(): Promise<string> {
    try {
      const response = await fetch(`https://${this.domain}/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          audience: `https://${this.domain}/api/v2/`,
          grant_type: 'client_credentials',
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to get management token: ${response.status}`);
      }

      const data: Auth0ManagementToken = await response.json();
      return data.access_token;
    } catch (error) {
      logger.error(
        error instanceof Error ? error : new Error('Error getting Auth0 management token'),
      );
      throw error;
    }
  }

  async getUserStats(): Promise<Auth0UserStats> {
    try {
      const token = await this.getManagementToken();

      // 総ユーザー数を取得
      const usersResponse = await fetch(
        `https://${this.domain}/api/v2/users?per_page=0&include_totals=true`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!usersResponse.ok) {
        throw new Error(`Failed to get users: ${usersResponse.status}`);
      }

      const usersData = await usersResponse.json();
      const total = usersData.total || 0;

      // 日付範囲でのユーザー数を取得
      const today = new Date();
      const todayStart = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      );
      const weekStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

      const [newToday, newThisWeek, newThisMonth] = await Promise.all([
        this.getUserCountSince(token, todayStart),
        this.getUserCountSince(token, weekStart),
        this.getUserCountSince(token, monthStart),
      ]);

      return {
        total,
        activeUsers: total, // Auth0では直接的な「アクティブユーザー」の概念がないため、総数を使用
        newUsersToday: newToday,
        newUsersThisWeek: newThisWeek,
        newUsersThisMonth: newThisMonth,
      };
    } catch (error) {
      logger.error(
        error instanceof Error ? error : new Error('Error getting user stats'),
      );
      throw error;
    }
  }

  private async getUserCountSince(token: string, since: Date): Promise<number> {
    try {
      const query = `created_at:[${since.toISOString()} TO *]`;
      const response = await fetch(
        `https://${this.domain}/api/v2/users?q=${encodeURIComponent(
          query
        )}&per_page=0&include_totals=true`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        logger.warn(`Failed to get user count since ${since.toISOString()}`, {
          status: response.status,
        });
        return 0;
      }

      const data = await response.json();
      return data.total || 0;
    } catch (error) {
      logger.error(
        error instanceof Error ? error : new Error(`Error getting user count since ${since.toISOString()}`),
      );
      return 0;
    }
  }
}

export const auth0Management = new Auth0ManagementClient();
