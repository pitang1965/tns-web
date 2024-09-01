'use client';

import { Button } from '@/components/ui/button';

export function LoginButton() {
  return (
    <Button asChild>
      <a href='/api/auth/login'>ログイン</a>
    </Button>
  );
}
