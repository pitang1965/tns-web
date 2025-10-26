import { CampingSpot, CampingSpotType } from '@/data/schemas/campingSpot';

// Type別のデフォルト治安レベル
const getDefaultSecurityLevel = (type: CampingSpotType): number => {
  switch (type) {
    case 'rv_park':
      return 4; // RVパーク
    case 'roadside_station':
      return 4; // 道の駅・◯◯の駅
    case 'sa_pa':
      return 4; // SA/PA
    case 'auto_campground':
      return 4; // オートキャンプ場
    case 'onsen_facility':
      return 3; // 日帰り温泉施設
    case 'convenience_store':
      return 2; // コンビニ
    case 'parking_lot':
      return 2; // 駐車場
    default:
      return 3; // その他
  }
};

// 治安レベル自動計算
export function calculateSecurityLevel(spot: CampingSpot): number {
  let score = getDefaultSecurityLevel(spot.type);

  if (spot.security?.hasGate) score += 1;
  if (spot.security?.hasStaff) score += 1;
  if (spot.security?.hasLighting) score += 0.5;

  return Math.max(1, Math.min(5, Math.round(score)));
}

// 静けさレベル自動計算
export function calculateQuietnessLevel(spot: CampingSpot): number {
  let score = 3; // デフォルト

  if (spot.nightNoise?.hasNoiseIssues) score -= 2;
  if (spot.nightNoise?.nearBusyRoad) score -= 1;
  if (spot.nightNoise?.isQuietArea) score += 1.5;
  if (spot.security?.hasGate) score += 0.5;

  return Math.max(1, Math.min(5, Math.round(score)));
}

// 計算された評価付きのスポット情報を取得
export function getCampingSpotWithCalculatedRatings(spot: CampingSpot) {
  return {
    ...spot,
    calculatedSecurityLevel: calculateSecurityLevel(spot),
    calculatedQuietnessLevel: calculateQuietnessLevel(spot),
  };
}

// レベル説明テキスト
export const SecurityLevelLabels: Record<number, string> = {
  1: '不安',
  2: 'やや不安',
  3: '普通',
  4: '安全',
  5: '非常に安全',
};

export const QuietnessLevelLabels: Record<number, string> = {
  1: '非常にうるさい',
  2: 'うるさい',
  3: '普通',
  4: '静か',
  5: '非常に静か',
};
