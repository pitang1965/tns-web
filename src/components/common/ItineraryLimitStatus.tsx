'use client';

import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Crown, Infinity } from 'lucide-react';
import { UserProfile } from '@auth0/nextjs-auth0/client';
import { ClientItineraryDocument } from '@/data/schemas/itinerarySchema';
import { getItineraryLimitStatus } from '@/lib/userUtils';

type ItineraryLimitStatusProps = {
  user: UserProfile | undefined;
  itineraries: ClientItineraryDocument[];
};

export default function ItineraryLimitStatus({ user, itineraries }: ItineraryLimitStatusProps) {
  const status = getItineraryLimitStatus(user, itineraries);

  if (status.isPremium) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Crown size={16} className="text-amber-500" />
            旅程作成制限
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Badge className="bg-gradient-to-r from-amber-400 to-amber-600 text-white">
              <Infinity size={12} className="mr-1" />
              無制限
            </Badge>
            <span className="text-sm text-muted-foreground">
              {status.currentCount}個の旅程を作成済み
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const progressPercentage = (status.currentCount / status.limit) * 100;
  const isNearLimit = progressPercentage >= 80;
  const isAtLimit = !status.canCreate;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          {isAtLimit ? (
            <AlertCircle size={16} className="text-red-500" />
          ) : (
            <CheckCircle size={16} className="text-green-500" />
          )}
          旅程作成制限
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span>作成済み旅程</span>
          <span className={isNearLimit ? 'text-orange-600 font-medium' : 'text-muted-foreground'}>
            {status.currentCount} / {status.limit}
          </span>
        </div>

        <Progress
          value={progressPercentage}
          className="h-2"
        />

        <div className="flex items-center justify-between">
          {isAtLimit ? (
            <Badge variant="destructive" className="text-xs">
              制限に達しています
            </Badge>
          ) : isNearLimit ? (
            <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">
              あと{status.remaining}個
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-xs">
              あと{status.remaining}個作成可能
            </Badge>
          )}

          <span className="text-xs text-muted-foreground">
            プレミアム会員は無制限
          </span>
        </div>
      </CardContent>
    </Card>
  );
}