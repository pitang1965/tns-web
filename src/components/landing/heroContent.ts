// ヒーローのコピーは HeroPreview（マップ読み込み前）と HeroMapSection の
// 両方で表示するため、ここで一元管理する

export const HERO_SUBTITLE =
  'トイレ・入浴施設・静けさまでわかる。見つけたらそのまま旅程に追加。';

export function buildHeroHeadline(spotCount: number): string {
  if (spotCount >= 100) {
    const rounded = Math.floor(spotCount / 100) * 100;
    return `全国${rounded.toLocaleString()}件超の車中泊スポットを、地図でサクッと検索`;
  }
  return '全国の車中泊スポットを、地図でサクッと検索';
}
