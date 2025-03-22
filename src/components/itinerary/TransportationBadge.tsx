import React from 'react';
import { Badge } from '@/components/ui/badge';

const transportationMap = {
  CAR: { color: 'bg-blue-500', label: '自動車' },
  TRAIN: { color: 'bg-green-500', label: '鉄道' },
  BUS: { color: 'bg-yellow-500', label: 'バス' },
  PLANE: { color: 'bg-purple-500', label: '飛行機' },
  SHIP: { color: 'bg-cyan-500', label: '船' },
  OTHER: { color: 'bg-gray-500', label: 'その他' },
} as const;

export type TransportationType = keyof typeof transportationMap;

type TransportationBadgeProps = {
  type: TransportationType;
};

export const TransportationBadge: React.FC<TransportationBadgeProps> = ({
  type,
}) => {
  const { color, label } = transportationMap[type] || transportationMap.OTHER;

  return <Badge className={`${color} text-white w-fit`}>{label}</Badge>;
};
