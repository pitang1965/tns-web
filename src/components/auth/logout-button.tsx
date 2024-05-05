import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function LogoutButton() {
  return (
    <Button asChild>
      <Link href='/api/auth/logout'>ログアウト</Link>
    </Button>
  );
}
