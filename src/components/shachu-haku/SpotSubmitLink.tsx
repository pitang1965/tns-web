'use client';

import Link from 'next/link';
import { capture } from '@/lib/analytics';

/** スポット投稿フォームへの導線がどこから押されたか。入口ごとの効きを比べるために使う */
export type SpotSubmitSource = 'list' | 'landing' | 'contact';

type SpotSubmitLinkProps = {
  source: SpotSubmitSource;
  className?: string;
  children: React.ReactNode;
};

/**
 * スポット投稿フォームへのリンク。クリックを source 付きで計測する。
 *
 * 到着（/shachu-haku/submit の $pageview）と成功（camping_spot_submitted）は既に
 * 計測できているため、足りないのは「どの入口が押されているか」だけ。
 * サーバーコンポーネントからも使えるようにクライアント部品として切り出している。
 */
export function SpotSubmitLink({
  source,
  className,
  children,
}: SpotSubmitLinkProps) {
  return (
    <Link
      href="/shachu-haku/submit"
      className={className}
      onClick={() => capture('spot_submit_cta_clicked', { source })}
    >
      {children}
    </Link>
  );
}
