'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { capture } from '@/lib/analytics';

// nafuda広告のクリック導線（UTM付き）。CONTEXT.md の「nafuda広告」を参照。
const NAFUDA_URL =
  'https://nafuda.me/?utm_source=tabi&utm_medium=header_ad&utm_campaign=nafuda';

type NafudaAdProps = {
  // nafuda対象検索のスポット種別（計測プロパティ用）
  spotType: 'rv_park' | 'auto_campground';
};

/**
 * nafuda対象検索（RVパーク / オートキャンプ場での絞り込み）のとき、
 * 上部広告枠に AdSense の代わりに差し込む自社系プロモバナー。
 * 表示条件の判定は呼び出し側（AdSense）が行う。
 *
 * 4:1 のイラストを全面に敷き、左側にスクリム（暗いグラデーション）を重ねて
 * ブランド名・一言・CTA を HTML テキストで表示する。文字を画像に焼き込まないため
 * 画面幅に依らず鮮明で、編集・アクセシビリティ・テーマ対応に強い。
 */
export function NafudaAd({ spotType }: NafudaAdProps) {
  useEffect(() => {
    capture('nafuda_ad_impression', { spot_type: spotType });
  }, [spotType]);

  return (
    <div className="w-full bg-background border-b border-gray-200 dark:border-gray-700">
      {/* PCは最大728px中央寄せ、モバイルは幅いっぱい。4:1比率をwidth/heightで固定しCLSを防ぐ */}
      <div className="mx-auto w-full max-w-182">
        <a
          href={NAFUDA_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => capture('nafuda_ad_click', { spot_type: spotType })}
          className="group relative block"
        >
          <Image
            src="/ads/nafuda/nafuda-header.webp"
            alt="なふだ ― その場で会った人とSNSでつながるQRサービス"
            width={1600}
            height={400}
            sizes="(max-width: 768px) 100vw, 728px"
            className="w-full h-auto"
            priority
          />

          {/* 左側スクリム＋テキスト。文字はイラストと干渉しないよう左に寄せる */}
          <div
            className="absolute inset-y-0 left-0 flex w-3/5 flex-col justify-center
              bg-linear-to-r from-black/60 via-black/35 to-transparent
              px-3 text-white sm:w-1/2 sm:px-5"
          >
            <span className="text-base font-bold leading-tight [text-shadow:0_1px_3px_rgba(0,0,0,0.6)] sm:text-2xl">
              なふだ
            </span>
            <span className="mt-1 hidden text-sm leading-snug [text-shadow:0_1px_3px_rgba(0,0,0,0.6)] sm:block">
              その場で会った人とSNSでつながる
            </span>
            {/* nafuda.me のテーマカラー #f6339b に合わせたピル型CTA */}
            <span className="mt-1.5 inline-flex w-fit items-center gap-1 rounded-full bg-[#f6339b] px-3 py-1 text-xs font-bold text-white shadow-sm sm:mt-2.5 sm:px-4 sm:py-1.5 sm:text-sm">
              今すぐ試す
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5 sm:h-4 sm:w-4" />
            </span>
          </div>
        </a>
      </div>
    </div>
  );
}
