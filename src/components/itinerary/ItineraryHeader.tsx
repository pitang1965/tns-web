import { Itinerary } from '@/data/types/itinerary';
import {
  TransportationBadge,
  TransportationType,
} from '@/components/TransportationBadge';

export const ItineraryHeader: React.FC<{ itinerary: Itinerary }> = ({
  itinerary,
}) => (
  <div className='flex flex-col items-center justify-between p-6 bg-background text-foreground w-full'>
    <h1 className='text-3xl font-bold mb-4'>{itinerary.title}</h1>
    <TransportationBadge
      type={itinerary.transportation.type as TransportationType}
    />
    <p className='text-lg mt-2'>{itinerary.description}</p>
    <p className='mt-2'>
      期間: {itinerary.startDate} ～ {itinerary.endDate}
    </p>
  </div>
);
