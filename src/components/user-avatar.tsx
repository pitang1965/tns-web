import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

type UserAvatarProps = {
  user: {
    picture?: string | null;
    name?: string | null;
  };
};

export function UserAvatar({ user }: UserAvatarProps) {
  return (
    <Link href='/account'>
      <Avatar>
        <AvatarImage src={user.picture || undefined} />
        <AvatarFallback>{user?.name}</AvatarFallback>
      </Avatar>
    </Link>
  );
}
