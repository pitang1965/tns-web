import { Volume2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CampingSpotWithId } from '@/data/schemas/campingSpot';
import { calculateQuietnessLevel } from '@/lib/campingSpotUtils';
import { getRatingColor } from '@/lib/spotColorUtils';

type SpotNightNoiseCardProps = {
  spot: CampingSpotWithId;
};

export function SpotNightNoiseCard({ spot }: SpotNightNoiseCardProps) {
  const quietnessLevel = calculateQuietnessLevel(spot);

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Volume2 className='w-5 h-5' />
          夜間環境情報
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-3'>
          <div className='flex items-center justify-between'>
            <span className='text-gray-700 dark:text-gray-300'>
              静けさレベル
            </span>
            <Badge className={`${getRatingColor(quietnessLevel)} text-white`}>
              {quietnessLevel}/5
            </Badge>
          </div>

          {spot.nightNoise && (
            <div className='space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700'>
              <div className='text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2'>
                騒音環境
              </div>
              <div className='grid grid-cols-1 gap-2 text-sm'>
                <div className='flex items-center gap-2'>
                  <div
                    className={`w-2 h-2 rounded-full ${
                      spot.nightNoise.hasNoiseIssues
                        ? 'bg-red-500'
                        : 'bg-green-500'
                    }`}
                  />
                  <span className='text-gray-700 dark:text-gray-300'>
                    騒音問題:{' '}
                    {spot.nightNoise.hasNoiseIssues ? 'あり' : 'なし'}
                  </span>
                </div>
                <div className='flex items-center gap-2'>
                  <div
                    className={`w-2 h-2 rounded-full ${
                      spot.nightNoise.nearBusyRoad
                        ? 'bg-orange-500'
                        : 'bg-green-500'
                    }`}
                  />
                  <span className='text-gray-700 dark:text-gray-300'>
                    交通量の多い道路:{' '}
                    {spot.nightNoise.nearBusyRoad ? '近い' : '離れている'}
                  </span>
                </div>
                <div className='flex items-center gap-2'>
                  <div
                    className={`w-2 h-2 rounded-full ${
                      spot.nightNoise.isQuietArea
                        ? 'bg-green-500'
                        : 'bg-gray-400'
                    }`}
                  />
                  <span className='text-gray-700 dark:text-gray-300'>
                    静かなエリア:{' '}
                    {spot.nightNoise.isQuietArea ? 'はい' : 'いいえ'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
