'use client';

import { useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { H1, LargeText } from '@/components/common/Typography';
import { ClientItineraryDocument } from '@/data/schemas/itinerarySchema';
import { ItineraryItem } from '@/components/itinerary/ItineraryItem';
import { PublicItineraryItem } from '@/components/itinerary/PublicItineraryItem';

const TAB_STORAGE_KEY = 'itineraries-active-tab';

type TabValue = 'public' | 'mine';

// Module-level listener set so same-window writes also trigger re-renders
const tabListeners = new Set<() => void>();

function subscribeToTab(callback: () => void) {
  tabListeners.add(callback);
  return () => { tabListeners.delete(callback); };
}

function getTabSnapshot(): TabValue | null {
  const saved = localStorage.getItem(TAB_STORAGE_KEY);
  return saved === 'mine' || saved === 'public' ? saved : null;
}

function getTabServerSnapshot(): null {
  return null;
}

function persistTab(tab: TabValue): void {
  localStorage.setItem(TAB_STORAGE_KEY, tab);
  tabListeners.forEach((fn) => fn());
}

type Props = {
  publicItineraries: ClientItineraryDocument[];
  myItineraries: ClientItineraryDocument[] | null;
  isAuthenticated: boolean;
};

export function ItinerariesClient({
  publicItineraries,
  myItineraries,
  isAuthenticated,
}: Props) {
  const router = useRouter();
  const savedTab = useSyncExternalStore(
    subscribeToTab,
    getTabSnapshot,
    getTabServerSnapshot
  );
  const activeTab: TabValue = savedTab ?? (isAuthenticated ? 'mine' : 'public');

  const handleTabChange = (value: string) => {
    persistTab(value as TabValue);
  };

  const handleCreateNew = () => {
    router.push('/itineraries/new');
  };

  return (
    <main className="container mx-auto p-4 md:p-6">
      <H1>旅程一覧</H1>
      <LargeText>
        みんなの旅程を探索したり、自分の旅程を管理できます。
      </LargeText>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="mt-6">
        <TabsList>
          <TabsTrigger value="public">みんなの旅程</TabsTrigger>
          <TabsTrigger value="mine">自分の旅程</TabsTrigger>
        </TabsList>

        <TabsContent value="public" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {publicItineraries.length > 0 ? (
              publicItineraries.map((itinerary) => (
                <PublicItineraryItem key={itinerary.id} itinerary={itinerary} />
              ))
            ) : (
              <div className="col-span-full text-center py-8">
                <LargeText className="text-gray-600">
                  現在公開されている旅程がありません。
                </LargeText>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="mine" className="mt-4">
          {isAuthenticated && myItineraries ? (
            <div className="flex flex-col gap-4">
              <Button
                onClick={handleCreateNew}
                size="sm"
                className="w-fit cursor-pointer"
              >
                <Plus className="w-4 h-4 mr-1" />
                新規作成
              </Button>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {myItineraries.length > 0 ? (
                  myItineraries.map((itinerary) => (
                    <ItineraryItem key={itinerary.id} itinerary={itinerary} />
                  ))
                ) : (
                  <div className="col-span-full">
                    <LargeText>保存された旅程はまだありません。</LargeText>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <LargeText className="text-gray-600">
                自分の旅程を表示するにはログインが必要です。
              </LargeText>
              <Button asChild className="mt-4">
                <a href="/auth/login?returnTo=/itineraries">ログイン</a>
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </main>
  );
}
