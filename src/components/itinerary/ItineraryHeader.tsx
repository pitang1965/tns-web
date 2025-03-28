import { ClientItineraryDocument } from '@/data/schemas/itinerarySchema';
import {
  TransportationBadge,
  TransportationType,
} from '@/components/itinerary/TransportationBadge';
import { H1, LargeText, Text } from '@/components/common/Typography';

const getTransportationType = (
  transportation: ClientItineraryDocument['transportation']
): TransportationType | undefined => {
  if (transportation && 'type' in transportation) {
    return transportation.type as TransportationType;
  }
  return undefined;
};

const calculateEndDate = (startDate: string, numberOfDays: number): Date => {
  const start = new Date(startDate);
  const end = new Date(start);
  end.setDate(start.getDate() + numberOfDays - 1);
  return end;
};

export const ItineraryHeader: React.FC<{
  itinerary: ClientItineraryDocument;
}> = ({ itinerary }) => {
  const transportationType = getTransportationType(itinerary.transportation);

  const formatDate = (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    });
  };
  const periodDisplay = itinerary.startDate
    ? `${formatDate(itinerary.startDate)} ～ ${formatDate(
        calculateEndDate(itinerary.startDate, itinerary.numberOfDays)
      )}`
    : `${itinerary.numberOfDays}日間`;

  return (
    <div className='flex flex-col items-center justify-between p-6 bg-background text-foreground w-full'>
      <H1>{itinerary.title}</H1>
      {transportationType && <TransportationBadge type={transportationType} />}
      <LargeText>{itinerary.description}</LargeText>
      <Text>期間: {periodDisplay}</Text>
    </div>
  );
};
