'use client';

import { Suspense, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0/client';
import posthog from 'posthog-js';

function isLoaded(): boolean {
  return (posthog as unknown as { __loaded?: boolean }).__loaded === true;
}

// App Router ではクライアント遷移で $pageview が自動発火しないため、
// pathname / searchParams の変化を監視して手動で送る。
function PostHogPageview() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!isLoaded()) return;
    let url = window.origin + pathname;
    const query = searchParams?.toString();
    if (query) url += `?${query}`;
    posthog.capture('$pageview', { $current_url: url });
  }, [pathname, searchParams]);

  return null;
}

// ログインユーザーは Auth0 の sub（不透明ID）のみで識別する。
// email・氏名などの PII は送らない（ADR-0005）。
function PostHogIdentify() {
  const { user, isLoading } = useUser();

  useEffect(() => {
    if (!isLoaded() || isLoading) return;
    if (user?.sub) {
      posthog.identify(user.sub);
    } else {
      // ログアウト時は匿名に戻す
      posthog.reset();
    }
  }, [user?.sub, isLoading]);

  return null;
}

type PostHogProviderProps = {
  children: React.ReactNode;
};

export function PostHogProvider({ children }: PostHogProviderProps) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    // 本番のみ初期化（自分の dev 操作で本番データを汚さない / ADR-0005）
    if (process.env.NODE_ENV !== 'production' || !key || isLoaded()) return;

    posthog.init(key, {
      api_host:
        process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
      person_profiles: 'identified_only',
      capture_pageview: false, // 手動で $pageview を送る
      capture_pageleave: true,
    });
  }, []);

  return (
    <>
      <Suspense fallback={null}>
        <PostHogPageview />
      </Suspense>
      <PostHogIdentify />
      {children}
    </>
  );
}
