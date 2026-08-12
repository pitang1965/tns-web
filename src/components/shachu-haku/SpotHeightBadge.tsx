import { Badge } from '@/components/ui/badge';

type SpotHeightBadgeProps = {
  maxVehicleHeight?: number;
  noHeightLimit?: boolean;
  heightLimitCaution?: boolean;
  className?: string;
};

/**
 * スポットの全高制限を表すバッジ。
 * - noHeightLimit: 「高さ制限なし」
 * - maxVehicleHeight(数値): 「高さ○○cm」
 * - heightLimitCaution: ⚠ を付与（区画差・入口小屋根など要注意）
 * - いずれも無い（不明）: 何も表示しない
 */
export function SpotHeightBadge({
  maxVehicleHeight,
  noHeightLimit,
  heightLimitCaution,
  className = '',
}: SpotHeightBadgeProps) {
  const hasInfo = noHeightLimit || maxVehicleHeight != null;
  if (!hasInfo) return null;

  const label = noHeightLimit ? '高さ制限なし' : `高さ${maxVehicleHeight}cm`;

  // 色: 要注意=アンバー / 制限なし=グリーン / 数値制限=スレート
  const color = heightLimitCaution
    ? 'bg-amber-600 hover:bg-amber-700'
    : noHeightLimit
      ? 'bg-emerald-600 hover:bg-emerald-700'
      : 'bg-slate-600 hover:bg-slate-700';

  const title = heightLimitCaution
    ? '要注意：区画により制限が異なる、または入口などに高さ制限があります'
    : undefined;

  return (
    <Badge className={`${color} text-white ${className}`} title={title}>
      {heightLimitCaution ? '⚠ ' : ''}
      {label}
    </Badge>
  );
}
