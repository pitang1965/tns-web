import { ClientItineraryDocument } from '@/data/schemas/itinerarySchema';
import { H1, LargeText, Text } from '@/components/common/Typography';
import { Badge } from '@/components/ui/badge';

// どちらの形式のデータも受け入れられるユニオン型を作成
type ItineraryHeaderProps = {
  itinerary:
    | ClientItineraryDocument
    | {
        title: string;
        description: string;
        startDate?: string;
        numberOfDays?: number;
        totalDays?: number; // API が返す形式
        isPublic?: boolean;
      };
};


const calculateEndDate = (startDate: string, days: number): Date => {
  const start = new Date(startDate);
  const end = new Date(start);
  end.setDate(start.getDate() + days - 1);
  return end;
};

export const ItineraryHeader: React.FC<ItineraryHeaderProps> = ({
  itinerary,
}) => {

  // numberOfDays か totalDays のどちらかを使用
  const days =
    'numberOfDays' in itinerary
      ? itinerary.numberOfDays
      : 'totalDays' in itinerary
      ? itinerary.totalDays
      : 0;

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
        calculateEndDate(itinerary.startDate, days || 1)
      )}`
    : `${days}日間`;

  return (
    <div className='flex flex-col items-center justify-between p-6 bg-background text-foreground w-full'>
      <div className='flex items-center gap-2'>
        <H1>{itinerary.title}</H1>
        {'isPublic' in itinerary && (
          <Badge variant={itinerary.isPublic ? 'default' : 'outline'}>
            {itinerary.isPublic ? '公開' : '非公開'}
          </Badge>
        )}
      </div>
      <LargeText>{itinerary.description}</LargeText>
      <Text>期間: {periodDisplay}</Text>
    </div>
  );
};
