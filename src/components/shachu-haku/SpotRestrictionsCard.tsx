import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CampingSpotWithId } from '@/data/schemas/campingSpot';

type SpotRestrictionsCardProps = {
  spot: CampingSpotWithId;
};

export function SpotRestrictionsCard({ spot }: SpotRestrictionsCardProps) {
  if (!spot.restrictions || spot.restrictions.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>制限事項</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-1'>
          {spot.restrictions.map((restriction, index) => (
            <div
              key={index}
              className='text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2'
            >
              <span className='text-red-500 mt-1'>•</span>
              <span>{restriction}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
