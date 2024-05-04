import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function LoginButton() {
  return (
    <Button asChild>
      <Link href='/login'>Login</Link>
    </Button>
  );
}
