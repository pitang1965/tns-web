'use client';

import { Button } from '@/components/ui/button';

export function LogoutButton() {
  return (
    <Button onClick={() => (window.location.href = '/api/auth/logout')}>
      ログアウト
    </Button>
  );
}
