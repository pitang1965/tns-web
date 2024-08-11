import React from 'react';
import Link from 'next/link';
import { Itinerary } from '@/data/types/itinerary';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface Props {
  itinerary: Itinerary;
}

export const ItineraryCard: React.FC<Props> = ({ itinerary }) => {
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
