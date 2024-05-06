'use client';
import { useUser } from '@auth0/nextjs-auth0/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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

export default function Account() {
  const { user, error, isLoading } = useUser();
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>{error.message}</div>;
  console.log(user);

  return (
    <div className='flex flex-col items-center justify-between p-24 bg-background text-foreground'>
      <div>
        <p className='text-5xl py-4'>アカウント</p>
        {user ? (
          <div>
            <Avatar>
              <AvatarImage src={user.picture || undefined} />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <UserInfo label='name' value={user.name} />
            <UserInfo label='email' value={user.email} />
            <UserInfo label='email_verified' value={user.email_verified} />
            <UserInfo label='nickname' value={user.nickname} />
          </div>
        ) : (
          <p>ログインしてください。</p>
        )}
      </div>
    </div>
  );
}
