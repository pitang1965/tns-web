import { ClientItineraryDocument } from '@/data/schemas/itinerarySchema';
import {
  TransportationBadge,
  TransportationType,
} from '@/components/TransportationBadge';

const getTransportationType = (
  transportation: ClientItineraryDocument['transportation']
): TransportationType | undefined => {
  if (transportation && 'type' in transportation) {
    return transportation.type as TransportationType;
  }
  return undefined;
};

export const ItineraryHeader: React.FC<{
  itinerary: ClientItineraryDocument;
}> = ({ itinerary }) => {
  const transportationType = getTransportationType(itinerary.transportation);

  // 日付表示用の文字列を生成
  const dateDisplay = itinerary.startDate
    ? `${itinerary.startDate} ～ ${
        new Date(itinerary.startDate).getDate() + itinerary.numberOfDays - 1
      }日`
    : `${itinerary.numberOfDays}日間`;

  const formatDateDisplay = (date: string) => {
    return new Date(date).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    });
  };

  const periodDisplay = itinerary.startDate
    ? `${formatDateDisplay(itinerary.startDate)} ～ ${formatDateDisplay(
        new Date(
          new Date(itinerary.startDate).setDate(
            new Date(itinerary.startDate).getDate() + itinerary.numberOfDays - 1
          )
        ).toISOString()
      )}`
    : `${itinerary.numberOfDays}日間`;

  return (
    <div className='flex flex-col items-center justify-between p-6 bg-background text-foreground w-full'>
      <h1 className='text-3xl font-bold mb-4'>{itinerary.title}</h1>
      {transportationType && <TransportationBadge type={transportationType} />}
      <p className='text-lg mt-2'>{itinerary.description}</p>
      <p className='mt-2'>期間: {periodDisplay}</p>
    </div>
  );
};
