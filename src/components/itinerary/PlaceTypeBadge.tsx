import React from 'react';
import { Badge } from '@/components/ui/badge';

const placeTypeMap = {
  HOME: { color: 'bg-gray-600', label: '自宅' },
  ATTRACTION: { color: 'bg-blue-700', label: '観光地' },
  RESTAURANT: { color: 'bg-red-700', label: 'レストラン' },
  HOTEL: { color: 'bg-indigo-700', label: 'ホテル' },
  PARKING_PAID_RV_PARK: { color: 'bg-amber-800', label: '有料RVパーク' },
  PARKING_PAID_OTHER: { color: 'bg-amber-700', label: '有料駐車場' },
  PARKING_FREE_SERVICE_AREA: { color: 'bg-green-800', label: 'SA/PA' },
  PARKING_FREE_MICHINOEKI: { color: 'bg-green-700', label: '道の駅・◯◯の駅' },
  PARKING_FREE_OTHER: { color: 'bg-emerald-700', label: '無料駐車場' },
  GAS_STATION: { color: 'bg-orange-800', label: 'ガソリンスタンド' },
  CONVENIENCE_SUPERMARKET: { color: 'bg-pink-700', label: 'コンビニ/スーパー' },
  BATHING_FACILITY: { color: 'bg-cyan-700', label: '入浴施設' },
  COIN_LAUNDRY: { color: 'bg-purple-700', label: 'コインランドリー' },
  OTHER: { color: 'bg-gray-600', label: 'その他' },
} as const;

export type PlaceType = keyof typeof placeTypeMap;

type PlaceTypeBadgeProps = {
  type: PlaceType;
};

export const PlaceTypeBadge: React.FC<PlaceTypeBadgeProps> = ({ type }) => {
  const { color, label } = placeTypeMap[type] || placeTypeMap.OTHER;

  return (
    <Badge className={`${color} text-white w-fit whitespace-nowrap`}>
      {label}
    </Badge>
  );
};
