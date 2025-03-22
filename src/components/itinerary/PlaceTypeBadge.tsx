import React from 'react';
import { Badge } from '@/components/ui/badge';

const placeTypeMap = {
  HOME: { color: 'bg-gray-500', label: '自宅' },
  ATTRACTION: { color: 'bg-blue-500', label: '観光地' },
  RESTAURANT: { color: 'bg-red-500', label: 'レストラン' },
  HOTEL: { color: 'bg-indigo-500', label: 'ホテル' },
  PARKING_PAID_RV_PARK: { color: 'bg-yellow-500', label: '有料RVパーク' },
  PARKING_PAID_OTHER: { color: 'bg-yellow-400', label: '有料駐車場' },
  PARKING_FREE_SERVICE_AREA: { color: 'bg-green-500', label: 'SA/PA' },
  PARKING_FREE_MICHINOEKI: { color: 'bg-green-400', label: '道の駅' },
  PARKING_FREE_OTHER: { color: 'bg-green-300', label: '無料駐車場' },
  GAS_STATION: { color: 'bg-orange-500', label: 'ガソリンスタンド' },
  CONVENIENCE_SUPERMARKET: { color: 'bg-pink-500', label: 'コンビニ/スーパー' },
  BATHING_FACILITY: { color: 'bg-cyan-500', label: '入浴施設' },
  COIN_LAUNDRY: { color: 'bg-purple-500', label: 'コインランドリー' },
  OTHER: { color: 'bg-gray-400', label: 'その他' },
} as const;

export type PlaceType = keyof typeof placeTypeMap;

type PlaceTypeBadgeProps = {
  type: PlaceType;
};

export const PlaceTypeBadge: React.FC<PlaceTypeBadgeProps> = ({ type }) => {
  const { color, label } = placeTypeMap[type] || placeTypeMap.OTHER;

  return <Badge className={`${color} text-white w-fit`}>{label}</Badge>;
};
