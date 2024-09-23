'use client';

import { Button } from '@/components/ui/button';

export function LoginButton() {
  return (
    <Button onClick={() => (window.location.href = '/api/auth/login')}>
      ログイン
    </Button>
  );
}
