'use client';

import { useEffect, useState } from 'react';
import { WifiOff, RefreshCw, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  ClientItineraryDocument,
  ItineraryManager,
} from '@/data/schemas/itinerarySchema';
import {
  getCachedItinerary,
  getAllCachedItineraries,
} from '@/lib/itineraryCache';

export default function OfflinePage() {
  const [itinerary, setItinerary] = useState<ClientItineraryDocument | null>(
    null,
  );
  const [allItineraries, setAllItineraries] = useState<
    ClientItineraryDocument[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [targetId, setTargetId] = useState<string | null>(null);

  useEffect(() => {
    // window.location.pathname はSWフォールバック時も元のURLを返す
    const path = window.location.pathname;
    const match = path.match(/^\/itineraries\/([a-zA-Z0-9]+)/);
    const id = match?.[1] ?? null;
    setTargetId(id);

    const load = async () => {
      const [specific, all] = await Promise.all([
        id ? getCachedItinerary(id) : Promise.resolve(null),
        getAllCachedItineraries(),
      ]);
      setItinerary(specific);
      setAllItineraries(all);
      setLoading(false);
    };

    load();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-4 pt-8 text-center text-muted-foreground">
        読み込み中...
      </div>
    );
  }

  if (itinerary) {
    return <CachedItineraryView itinerary={itinerary} />;
  }

  return (
    <div className="container mx-auto p-4 pt-8 max-w-2xl">
      <div className="flex flex-col items-center text-center mb-8">
        <WifiOff className="h-14 w-14 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">オフラインです</h1>
        <p className="text-muted-foreground mb-4">
          {targetId
            ? 'この旅程のデータはキャッシュされていません。オンラインで一度開いてください。'
            : 'インターネット接続を確認してください。'}
        </p>
        <Button
          onClick={() => window.location.reload()}
          variant="outline"
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          再試行
        </Button>
      </div>

      {allItineraries.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">
            オフラインで閲覧できる旅程
          </h2>
          <div className="space-y-2">
            {allItineraries.map((item) => {
              const { dateRange, duration } =
                ItineraryManager.getDateDisplay(item);
              return (
                // aタグで強制フルリロード → SWが再度フォールバックページを提供し、
                // このページが正しい旅程データを読み込む
                <a
                  key={item.id}
                  href={`/itineraries/${item.id}`}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="min-w-0">
                    <div className="font-medium truncate">{item.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {dateRange} · {duration}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

type CachedItineraryViewProps = {
  itinerary: ClientItineraryDocument;
};

function CachedItineraryView({ itinerary }: CachedItineraryViewProps) {
  const { dateRange, duration } = ItineraryManager.getDateDisplay(itinerary);

  return (
    <div className="container mx-auto p-4 pt-8 max-w-3xl">
      <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2 mb-4">
        <WifiOff className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
        <span className="text-sm text-amber-800 dark:text-amber-200 flex-1">
          オフライン表示（キャッシュデータ）
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1 h-7 text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-800/40"
          onClick={() => window.location.reload()}
        >
          <RefreshCw className="h-3 w-3" />
          再試行
        </Button>
      </div>

      <h1 className="text-2xl font-bold mb-1">{itinerary.title}</h1>
      {itinerary.description && (
        <p className="text-muted-foreground mb-1">{itinerary.description}</p>
      )}
      <p className="text-sm text-muted-foreground mb-6">
        {dateRange} · {duration}
      </p>

      <div className="space-y-5">
        {itinerary.dayPlans.map((day, dayIndex) => (
          <div key={dayIndex} className="border rounded-lg overflow-hidden">
            <div className="bg-muted px-4 py-2 font-semibold text-sm flex items-center gap-2">
              <span>{dayIndex + 1}日目</span>
              {day.date && (
                <span className="font-normal text-muted-foreground">
                  {new Date(day.date).toLocaleDateString('ja-JP', {
                    month: 'long',
                    day: 'numeric',
                    weekday: 'short',
                  })}
                </span>
              )}
            </div>

            {day.notes && (
              <div className="px-4 py-2 text-sm text-muted-foreground bg-muted/30 border-b">
                {day.notes}
              </div>
            )}

            <div className="divide-y">
              {day.activities.length === 0 ? (
                <div className="px-4 py-3 text-sm text-muted-foreground">
                  アクティビティなし
                </div>
              ) : (
                day.activities.map((activity, actIndex) => (
                  <div key={actIndex} className="px-4 py-3">
                    <div className="flex items-start gap-3">
                      <span className="text-sm text-muted-foreground w-12 flex-shrink-0 pt-0.5 tabular-nums">
                        {activity.startTime ?? '　　'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{activity.title}</div>
                        {activity.place?.name && (
                          <div className="text-sm text-muted-foreground">
                            {activity.place.name}
                          </div>
                        )}
                        {activity.description && (
                          <div className="text-sm text-muted-foreground mt-0.5">
                            {activity.description}
                          </div>
                        )}
                        {activity.cost !== null &&
                          activity.cost !== undefined && (
                            <div className="text-sm text-muted-foreground">
                              {activity.cost === 0
                                ? '（無料）'
                                : `¥${activity.cost.toLocaleString()}`}
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
