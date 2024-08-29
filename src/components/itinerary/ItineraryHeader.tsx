import { Itinerary } from '@/data/types/itinerary';
import {
  TransportationBadge,
  TransportationType,
} from '@/components/TransportationBadge';

const getTransportationType = (
  transportation: Itinerary['transportation']
): TransportationType | undefined => {
  if (transportation && 'type' in transportation) {
    return transportation.type as TransportationType;
  }
  return undefined;
};

export const ItineraryHeader: React.FC<{ itinerary: Itinerary }> = ({
  itinerary,
}) => {
  const transportationType = getTransportationType(itinerary.transportation);

  return (
    <div className='flex flex-col items-center justify-between p-6 bg-background text-foreground w-full'>
      <h1 className='text-3xl font-bold mb-4'>{itinerary.title}</h1>
      {transportationType && <TransportationBadge type={transportationType} />}
      <p className='text-lg mt-2'>{itinerary.description}</p>
      <p className='mt-2'>
        期間: {itinerary.startDate} ～ {itinerary.endDate}
      </p>
    </div>
  );
};
