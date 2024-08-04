'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function LoginButton() {
  return (
    <Button asChild>
      <Link href='/api/auth/login'>ログイン</Link>
    </Button>
  );
}
