import React from 'react';
import Link from 'next/link';
import { Itinerary } from '@/data/types/itinerary';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

type Props = {
  itinerary: Itinerary;
};

const transportationColorMap = {
  CAR: 'bg-blue-500',
  TRAIN: 'bg-green-500',
  BUS: 'bg-yellow-500',
  PLANE: 'bg-purple-500',
  SHIP: 'bg-cyan-500',
  OTHER: 'bg-gray-500',
} as const;

const transportationLabelMap = {
  CAR: '自動車',
  TRAIN: '鉄道',
  BUS: 'バス',
  PLANE: '飛行機',
  SHIP: '船',
  OTHER: 'その他',
} as const;

type TransportationType = keyof typeof transportationColorMap;

const TransportationBadge: React.FC<{ type: TransportationType }> = ({
  type,
}) => {
  const badgeColor = transportationColorMap[type] || 'bg-gray-500';
  const label = transportationLabelMap[type] || 'その他';

  return (
    <Badge className={`${badgeColor} text-white self-start`}>{label}</Badge>
  );
};

export const ItineraryCard: React.FC<Props> = ({ itinerary }) => {
  const badgeColor =
    transportationColorMap[itinerary.transportation.type] || 'bg-gray-500';

  return (
    <>
      <Card className='cursor-pointer hover:shadow-lg transition-shadow duration-300 p-2'>
        <div className='flex flex-col gap-2'>
          <div className='flex gap-2'>
            <Button onClick={() => {}}>編集</Button>
            <Button
              onClick={() => {}}
              className='delete-itinerary'
              variant='destructive'
            >
              削除
            </Button>
          </div>
          <Link href={`/itineraries/${itinerary.id}`} passHref>
            <CardHeader>
              <CardTitle>{itinerary.title}</CardTitle>
              <TransportationBadge
                type={itinerary.transportation.type as TransportationType}
              />
              <CardDescription>
                {itinerary.startDate} - {itinerary.endDate}
              </CardDescription>
              <CardDescription>{itinerary.description}</CardDescription>
            </CardHeader>
            <CardContent>内容・・・</CardContent>
          </Link>
        </div>
      </Card>
    </>
  );
};
