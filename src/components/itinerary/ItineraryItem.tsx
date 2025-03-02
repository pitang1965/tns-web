import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ClientItineraryDocument } from '@/data/schemas/itinerarySchema';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import {
  TransportationBadge,
  TransportationType,
} from '@/components/TransportationBadge';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';
import { useDeleteItinerary } from '@/hooks/useDeleteItinerary';

type Props = {
  itinerary: ClientItineraryDocument;
};

export const ItineraryItem: React.FC<Props> = ({ itinerary }) => {
  const deleteItinerary = useDeleteItinerary();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!itinerary.id) {
      throw new Error('無効な旅程IDです。');
    }
    return deleteItinerary(itinerary.id);
  };

  return (
    <Card className='flex flex-col h-full'>
      <Link
        href={`/itineraries/${itinerary.id}`}
        className='flex-grow hover:opacity-80 transition-opacity duration-300'
      >
        <CardHeader>
          <CardTitle className='line-clamp-2'>{itinerary.title}</CardTitle>
          {itinerary.transportation && (
            <TransportationBadge
              type={
                (itinerary.transportation.type as TransportationType) || 'OTHER'
              }
            />
          )}
        </CardHeader>
        <CardContent>
          <CardDescription className='mb-2'>
            {itinerary.startDate} から {itinerary.numberOfDays}日間
          </CardDescription>
          <CardDescription className='line-clamp-3'>
            {itinerary.description}
          </CardDescription>
        </CardContent>
      </Link>
      <CardFooter className='mt-auto'>
        <div className='flex gap-2 w-full'>
          <Button
            size='sm'
            className='flex-1'
            onClick={() => router.push(`/itineraries/${itinerary.id}/edit`)}
          >
            編集
          </Button>
          <Button
            variant='destructive'
            size='sm'
            className='flex-1'
            onClick={() => setIsConfirmOpen(true)}
          >
            削除
          </Button>
        </div>
      </CardFooter>
      <ConfirmationDialog
        isOpen={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title='旅程の削除'
        description='この旅程を削除してもよろしいですか？この操作は取り消せません。'
        confirmLabel='削除'
        onConfirm={handleDelete}
        variant='destructive'
      />
    </Card>
  );
};
