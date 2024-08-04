import React from 'react';
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
    <Card>
      <CardHeader>
        <CardTitle>{itinerary.title}</CardTitle>
        <CardDescription>
          {itinerary.startDate} - {itinerary.endDate}
        </CardDescription>
        <CardDescription>{itinerary.description}</CardDescription>
      </CardHeader>
      <CardContent>内容・・・</CardContent>
    </Card>
  );
};
