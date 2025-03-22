'use client';
import { useUser, withPageAuthRequired } from '@auth0/nextjs-auth0/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogoutButton } from '@/components/auth/LogoutButton';
import { LoadingSpinner } from '@/components/common/loading-spinner';

type UserInfoProps = {
  label: string;
  value: string | boolean | null | undefined;
};

function UserInfo({ label, value }: UserInfoProps) {
  return (
    <p className='text-lg py-2'>
      {label}: {value}
    </p>
  );
}

export default withPageAuthRequired(function Account() {
  const { user, error, isLoading } = useUser();
  if (isLoading) return <LoadingSpinner />;
  if (error) return <div>{error.message}</div>;
  if (!user) return <div>ユーザー情報が取得できませんでした</div>;

  return (
    <div className='flex flex-col items-center justify-between p-24 bg-background text-foreground'>
      <div>
        <p className='text-5xl py-4'>アカウント</p>
        <div>
          <Avatar>
            <AvatarImage src={user.picture || undefined} />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <UserInfo label='name' value={user.name} />
          <UserInfo label='email' value={user.email} />
          <UserInfo label='email_verified' value={user.email_verified} />
          <UserInfo label='nickname' value={user.nickname} />
          <LogoutButton />
        </div>
      </div>
    </div>
  );
});
