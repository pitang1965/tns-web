import { Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CampingSpotWithId } from '@/data/schemas/campingSpot';
import { calculateSecurityLevel } from '@/lib/campingSpotUtils';
import { getRatingColor } from '@/lib/spotColorUtils';

type SpotSecurityCardProps = {
  spot: CampingSpotWithId;
};

export function SpotSecurityCard({ spot }: SpotSecurityCardProps) {
  const securityLevel = calculateSecurityLevel(spot);

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Shield className='w-5 h-5' />
          セキュリティ情報
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-3'>
          <div className='flex items-center justify-between'>
            <span className='text-gray-700 dark:text-gray-300'>
              総合治安レベル
            </span>
            <Badge className={`${getRatingColor(securityLevel)} text-white`}>
              {securityLevel}/5
            </Badge>
          </div>

          {spot.security && (
            <div className='space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700'>
              <div className='text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2'>
                セキュリティ設備
              </div>
              <div className='grid grid-cols-1 gap-2 text-sm'>
                <div className='flex items-center gap-2'>
                  <div
                    className={`w-2 h-2 rounded-full ${
                      spot.security.hasGate ? 'bg-green-500' : 'bg-gray-400'
                    }`}
                  />
                  <span className='text-gray-700 dark:text-gray-300'>
                    ゲート・門扉: {spot.security.hasGate ? 'あり' : 'なし'}
                  </span>
                </div>
                <div className='flex items-center gap-2'>
                  <div
                    className={`w-2 h-2 rounded-full ${
                      spot.security.hasLighting ? 'bg-green-500' : 'bg-gray-400'
                    }`}
                  />
                  <span className='text-gray-700 dark:text-gray-300'>
                    照明設備: {spot.security.hasLighting ? '十分' : '暗め'}
                  </span>
                </div>
                <div className='flex items-center gap-2'>
                  <div
                    className={`w-2 h-2 rounded-full ${
                      spot.security.hasStaff ? 'bg-green-500' : 'bg-gray-400'
                    }`}
                  />
                  <span className='text-gray-700 dark:text-gray-300'>
                    スタッフ常駐: {spot.security.hasStaff ? 'あり' : 'なし'}
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
