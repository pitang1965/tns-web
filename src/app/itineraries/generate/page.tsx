import { GenerateItineraryClient } from './GenerateItineraryClient';

// ADR-0009 / ADR-0010: AI旅程ドラフト生成は候補プール構築＋LLM＋検証で数十秒かかりうる。
// Vercel の関数は既定10秒で強制終了するため、生成が失敗し（かつ旧・予約方式では消費が消える）不具合が本番で発生した。
// Fluid compute（Hobbyでも利用可・無料）を有効にすると Hobby でも最大300秒まで延ばせる（Pro化＝非商用崩れを避けられる）。
// このページ（Server Component）で最大実行時間を延ばすと、ページ上の Server Action
// （generateItineraryDraftAction）のタイムアウトも延びる。'use client' の本体は
// GenerateItineraryClient 側にあり、そこには route segment config を置けないためラッパーで指定する。
// ※ Vercel プロジェクトで Fluid compute が有効であることが前提（無効だと従来の上限に丸められる）。
export const maxDuration = 300;

export default function Page() {
  return <GenerateItineraryClient />;
}
