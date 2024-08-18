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
    createdAt: new Date(), // 現在の日時
    updatedAt: new Date(), // 現在の日時
  },
  {
    id: '2',
    title: '水郷佐原と銚子',
    startDate: '2024-05-18',
    endDate: '2024-05-19',
    description: '市営愛宕山 無料駐車場で車中泊',
    dayPlans: [
      {
        date: '2024-05-18',
        activities: [
          {
            id: '1',
            title: '出発',
            place: {
              name: '自宅',
              type: 'HOME',
            },
            startTime: '11:19',
          },
          {
            id: '2',
            title: '給油&昼食',
            place: {
              name: 'ENEOS R16 春日部SS',
              type: 'GAS_STATION',
            },
          },
          {
            id: '3',
            title: '休憩',
            place: {
              name: '道の駅 庄和',
              type: 'PARKING_FREE_MICHINOEKI',
            },
          },
          {
            id: '4',
            title: '観光地到着',
            place: {
              name: '町並み観光駐車場',
              type: 'PARKING_PAID_OTHER',
            },
          },
          {
            id: '5',
            title: '観光地',
            place: {
              name: '小野川',
              type: 'ATTRACTION',
            },
          },
          {
            id: '6',
            title: '観光地',
            place: {
              name: '小野川',
              type: 'ATTRACTION',
            },
          },
          {
            id: '7',
            title: '銭湯',
            place: {
              name: '金平湯',
              type: 'BATHING_FACILITY',
            },
          },
          {
            id: '8',
            title: '出発',
            place: {
              name: '町並み観光駐車場',
              type: 'PARKING_PAID_OTHER',
            },
          },
          {
            id: '9',
            title: '休憩',
            place: {
              name: '道の駅 発酵の里こうざき',
              type: 'PARKING_FREE_MICHINOEKI',
            },
          },
          {
            id: '10',
            title: '宿泊地到着',
            place: {
              name: '市営愛宕山 無料駐車場',
              type: 'PARKING_FREE_OTHER',
              address: {
                postalCode: '288-0024',
                prefecture: '千葉県',
                city: '銚子市',
                town: '天王台',
                block: '１４２３−１',
                country: 'Japan'
              }
            },
            description: '夜は寂しい',
            startTime: '19:37',
          },
          {
            id: '11',
            title: '夕食（居酒屋）',
            place: {
              name: '錦',
              type: 'RESTAURANT',
            },
            startTime: '19:57',
            endTime: '22:08',
          },
        ],
      },
      {
        date: '2024-05-19',
        activities: [],
      },
    ],
    transportation: {
      type: 'CAR',
      details: '車中泊',
    },
    createdAt: new Date(), // 現在の日時
    updatedAt: new Date(), // 現在の日時
  },
];
