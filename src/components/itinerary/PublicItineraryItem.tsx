'use client';

import React from 'react';
import Link from 'next/link';
import { PublicItinerarySummary } from '@/data/schemas/itinerarySchema';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { formatItineraryDuration } from '@/lib/date';

type Props = {
  itinerary: PublicItinerarySummary;
};

export const PublicItineraryItem: React.FC<Props> = ({ itinerary }) => {
  return (
    <Card className="flex flex-col h-full interactive-card">
      <CardHeader>
        <CardTitle className="line-clamp-2">{itinerary.title}</CardTitle>
        {itinerary.owner && (
          <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            作成: {itinerary.owner.handle}
          </span>
        )}
      </CardHeader>
      <CardContent>
        <CardDescription className="mb-2">
          {formatItineraryDuration(itinerary.startDate, itinerary.numberOfDays)}
        </CardDescription>
        <CardDescription className="line-clamp-3">
          {itinerary.description}
        </CardDescription>
      </CardContent>
      <CardFooter className="mt-auto">
        <div className="flex gap-2 w-full">
          <Link href={`/itineraries/${itinerary.id}`} className="flex-1">
            <Button
              size="sm"
              variant="secondary"
              className="flex-1 cursor-pointer"
            >
              見る
            </Button>
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
};
