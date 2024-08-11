import { Itinerary } from '../types/itinerary';

export const sampleItineraries: Itinerary[] = [
  {
    id: '1',
    title: '西日本大旅行',
    startDate: '2025-03-12',
    endDate: '2025-04-05',
    description: '近畿、中国、四国、九州を巡る旅',
    dayPlans: [],
    transportation: {
      type: 'CAR',
      details: '車中泊',
    },
  },
  {
    id: '2',
    title: '水郷佐原と銚子',
    startDate: '2024-05-18',
    endDate: '2024-05-19',
    description: '市営愛宕山 無料駐車場で車中泊',
    dayPlans: [],
    transportation: {
      type: 'CAR',
      details: '車中泊',
    },
  },
];
