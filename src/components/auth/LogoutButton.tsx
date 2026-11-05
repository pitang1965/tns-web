'use client';

import { Button } from '@/components/ui/button';
import { clearItineraryCache } from '@/lib/cacheUtils';

export function LogoutButton() {
  return (
    <Button
      onClick={async () => {
        // 同じブラウザの次の利用者に旅程キャッシュを残さない
        await clearItineraryCache();
        window.location.href = '/auth/logout';
      }}
      className="cursor-pointer"
    >
      ログアウト
    </Button>
  );
}
