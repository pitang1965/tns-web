import React from 'react';
import Link from 'next/link';
import { Itinerary } from '@/types';
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
    <Link href={`/itineraries/${itinerary.id}`} passHref>
      <Card className='cursor-pointer hover:shadow-lg transition-shadow duration-300'>
        <CardHeader>
          <CardTitle>
            {itinerary.title}
          </CardTitle>
          <CardDescription>
            {itinerary.startDate} - {itinerary.endDate}
          </CardDescription>
          <CardDescription>{itinerary.description}</CardDescription>
        </CardHeader>
        <CardContent>内容・・・</CardContent>
      </Card>
    </Link>
  );
};
