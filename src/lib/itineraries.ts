import { Itinerary } from '@/data/types/itinerary';
import { v4 as uuidv4 } from 'uuid';
import { sampleItineraries } from '@/data/sampleData/sampleItineraries';

// メモリ内データストアとして使用
let itineraries: Itinerary[] = [...sampleItineraries];

type ItinerarySummary = {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
};

export async function createItinerary(
  newItinerary: Omit<Itinerary, 'id'>
): Promise<ItinerarySummary> {
  return new Promise((resolve) => {
    console.log('createItinerary: ', newItinerary);
    setTimeout(() => {
      const id = uuidv4(); // UUIDを使用してIDを生成
      const createdItinerary: Itinerary = {
        id,
        ...newItinerary,
      };
      itineraries.push(createdItinerary);
      resolve({
        id: createdItinerary.id,
        title: createdItinerary.title,
        startDate: createdItinerary.startDate,
        endDate: createdItinerary.endDate,
      });
    }, 100);
  });
}

export async function getItineraries(): Promise<Itinerary[]> {
  // TODO: 将来的にここでデータベースからデータを取得する
  // 現在はサンプルデータを返す
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(itineraries);
    }, 100); // 非同期処理をシミュレート
  });
}

export async function getItineraryById(id: string): Promise<Itinerary | null> {
  const itineraries = await getItineraries();
  console.log('itineraries:', itineraries);
  return itineraries.find((itinerary) => itinerary.id === id) || null;
}

// 他の必要なAPI関数をここに追加
// 例: createItinerary, updateItinerary, deleteItinerary など
