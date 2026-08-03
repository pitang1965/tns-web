import React from 'react';
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
import { Badge } from '@/components/ui/badge';
import { formatItineraryDuration } from '@/lib/date';

type Props = {
  itinerary: ClientItineraryDocument;
  currentUserSub: string;
};

export const AdminItineraryItem: React.FC<Props> = ({
  itinerary,
  currentUserSub,
}) => {
  const router = useRouter();

  // 詳細取得側の認可ガード canAccessItinerary と同じ条件で閲覧可否を判定する。
  // 管理者でも他人の非公開旅程は開けない（プライバシー配慮）ため、
  // 開けないものは「見る」を無効化し、壊れた導線でエラー画面に飛ばさない。
  const canView =
    itinerary.isPublic ||
    itinerary.owner?.id === currentUserSub ||
    (itinerary.sharedWith?.some((u) => u?.id === currentUserSub) ?? false);

  // Format date helper
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '不明';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '不明';
    }
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <div className="flex flex-col gap-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="line-clamp-2 flex-1">
              {itinerary.title}
            </CardTitle>
            {itinerary.isPublic ? (
              <Badge className="shrink-0">公開</Badge>
            ) : (
              <Badge variant="outline" className="shrink-0">
                非公開
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <CardDescription className="mb-2">
          {formatItineraryDuration(itinerary.startDate, itinerary.numberOfDays)}
        </CardDescription>
        <CardDescription className="line-clamp-3">
          {itinerary.description}
        </CardDescription>
        <div className="pt-2 space-y-1 text-xs text-muted-foreground border-t">
          <div>作成者: {itinerary.owner?.name || '不明'}</div>
          <div>作成日: {formatDate(itinerary.createdAt)}</div>
          <div>更新日: {formatDate(itinerary.updatedAt)}</div>
        </div>
      </CardContent>
      <CardFooter className="mt-auto">
        {canView ? (
          <Button
            size="sm"
            variant="secondary"
            className="w-full cursor-pointer"
            onClick={() => router.push(`/itineraries/${itinerary.id}`)}
          >
            見る
          </Button>
        ) : (
          <Button
            size="sm"
            variant="secondary"
            className="w-full"
            disabled
            title="非公開のため閲覧できません"
          >
            非公開のため閲覧不可
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
