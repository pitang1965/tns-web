import { Itinerary } from '@/data/types/itinerary';
import { sampleItineraries } from '@/data/sampleData/sampleItineraries';

export async function getItineraries(): Promise<Itinerary[]> {
  // TODO: 将来的にここでデータベースからデータを取得する
  // 現在はサンプルデータを返す
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(sampleItineraries);
    }, 100); // 非同期処理をシミュレート
  });
}

export async function getItineraryById(id: string): Promise<Itinerary | null> {
  const itineraries = await getItineraries();
  return itineraries.find((itinerary) => itinerary.id === id) || null;
}

// 他の必要なAPI関数をここに追加
// 例: createItinerary, updateItinerary, deleteItinerary など
