'use client';

import { Button } from '@/components/ui/button';

export function LogoutButton() {
  return (
    <Button asChild>
      <a href='/api/auth/logout'>ログアウト</a>
    </Button>
  );
}
