'use client';
import { useUser, withPageAuthRequired } from '@auth0/nextjs-auth0/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogoutButton } from '@/components/auth/LogoutButton';
import { LoadingSpinner } from '@/components/common/loading-spinner';
import { H1, LargeText } from '@/components/common/Typography';
import PremiumBadge from '@/components/common/PremiumBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  isPremiumMember,
  getPremiumMemberLabel,
  isAdmin,
} from '@/lib/userUtils';

type UserInfoProps = {
  label: string;
  value: string | boolean | null | undefined;
};

function UserInfo({ label, value }: UserInfoProps) {
  return (
    <LargeText>
      {label}: {value}
    </LargeText>
  );
}

export default withPageAuthRequired(function Account() {
  const { user, error, isLoading } = useUser();
  if (isLoading) return <LoadingSpinner />;
  if (error) return <div>{error.message}</div>;
  if (!user) return <div>ユーザー情報が取得できませんでした</div>;

  const premiumLabel = getPremiumMemberLabel(user);

  return (
    <div className='container mx-auto px-4 py-8 max-w-2xl'>
      <H1 className='text-center mb-8'>アカウント</H1>

      <div className='space-y-6'>
        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle>プロフィール</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='flex items-center gap-4'>
              <Avatar className='h-16 w-16'>
                <AvatarImage src={user.picture || undefined} />
                <AvatarFallback>{user.name?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className='text-xl font-semibold'>{user.name}</h2>
                <p className='text-muted-foreground'>{user.email}</p>
                <div className='mt-2'>
                  <PremiumBadge user={user} variant='large' />
                </div>
              </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t'>
              <UserInfo label='ニックネーム' value={user.nickname} />
              <UserInfo
                label='メール認証'
                value={user.email_verified ? '済み' : '未認証'}
              />
            </div>
          </CardContent>
        </Card>

        {/* Premium Status Card */}
        <Card>
          <CardHeader>
            <CardTitle>
              {isPremiumMember(user)
                ? 'プレミアム会員特典'
                : 'プレミアム会員になると'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              <div className='flex items-center gap-2'>
                <div
                  className={`w-2 h-2 rounded-full ${
                    isPremiumMember(user) ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                ></div>
                <span
                  className={
                    isPremiumMember(user) ? '' : 'text-muted-foreground'
                  }
                >
                  旅程作成数無制限（一般会員は10個まで）
                </span>
              </div>
              <div className='flex items-center gap-2'>
                <div
                  className={`w-2 h-2 rounded-full ${
                    isPremiumMember(user) ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                ></div>
                <span
                  className={
                    isPremiumMember(user) ? '' : 'text-muted-foreground'
                  }
                >
                  優先サポート
                </span>
              </div>
              <div className='flex items-center gap-2'>
                <div
                  className={`w-2 h-2 rounded-full ${
                    isPremiumMember(user) ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                ></div>
                <span
                  className={
                    isPremiumMember(user) ? '' : 'text-muted-foreground'
                  }
                >
                  新機能の先行利用
                </span>
              </div>
            </div>
            {!isPremiumMember(user) && (
              <div className='mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md'>
                <p className='text-sm text-amber-800'>
                  プレミアム会員へのアップグレード機能は近日公開予定です
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Admin Status Card */}
        {isAdmin(user) && (
          <Card>
            <CardHeader>
              <CardTitle>管理者権限</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-3'>
                <div className='flex items-center gap-2'>
                  <div className='w-2 h-2 bg-red-500 rounded-full'></div>
                  <span>車中泊スポット管理</span>
                </div>
                <div className='flex items-center gap-2'>
                  <div className='w-2 h-2 bg-red-500 rounded-full'></div>
                  <span>投稿管理・承認</span>
                </div>
                <div className='flex items-center gap-2'>
                  <div className='w-2 h-2 bg-red-500 rounded-full'></div>
                  <span>システム管理</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <Card>
          <CardContent className='pt-6'>
            <LogoutButton />
          </CardContent>
        </Card>
      </div>
    </div>
  );
});
