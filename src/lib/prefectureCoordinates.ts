/**
 * 都道府県の中心座標データ
 * lat_span/lng_span: 表示する緯度・経度の範囲（度数）
 * PCとモバイルで同じ地理的範囲が表示されます
 */
export const PREFECTURE_COORDINATES: Record<
  string,
  { lng: number; lat: number; lat_span: number; lng_span: number }
> = {
  北海道: { lng: 142.3649, lat: 43.0642, lat_span: 4.0, lng_span: 10.0 },
  青森県: { lng: 140.7408, lat: 40.8244, lat_span: 1.8, lng_span: 4.5 },
  岩手県: { lng: 141.152, lat: 39.7036, lat_span: 2.5, lng_span: 6.0 },
  宮城県: { lng: 140.8719, lat: 38.2682, lat_span: 1.2, lng_span: 3.0 },
  秋田県: { lng: 140.1028, lat: 39.7186, lat_span: 1.8, lng_span: 4.5 },
  山形県: { lng: 140.3633, lat: 38.2404, lat_span: 1.2, lng_span: 3.0 },
  福島県: { lng: 140.4676, lat: 37.7503, lat_span: 1.8, lng_span: 4.5 },
  茨城県: { lng: 140.4467, lat: 36.3418, lat_span: 1.2, lng_span: 3.0 },
  栃木県: { lng: 139.8836, lat: 36.5657, lat_span: 1.2, lng_span: 3.0 },
  群馬県: { lng: 139.0608, lat: 36.3911, lat_span: 1.2, lng_span: 3.0 },
  埼玉県: { lng: 139.6489, lat: 35.8571, lat_span: 0.8, lng_span: 2.0 },
  千葉県: { lng: 140.1233, lat: 35.6051, lat_span: 1.2, lng_span: 3.0 },
  東京都: { lng: 139.6917, lat: 35.6895, lat_span: 0.5, lng_span: 1.3 },
  神奈川県: { lng: 139.6425, lat: 35.4478, lat_span: 0.8, lng_span: 2.0 },
  新潟県: { lng: 139.0236, lat: 37.9026, lat_span: 2.5, lng_span: 6.0 },
  富山県: { lng: 137.2114, lat: 36.6953, lat_span: 1.2, lng_span: 3.0 },
  石川県: { lng: 136.6256, lat: 36.5946, lat_span: 1.2, lng_span: 3.0 },
  福井県: { lng: 136.2218, lat: 36.0652, lat_span: 1.2, lng_span: 3.0 },
  山梨県: { lng: 138.5684, lat: 35.6642, lat_span: 0.8, lng_span: 2.0 },
  長野県: { lng: 138.1811, lat: 36.6513, lat_span: 1.8, lng_span: 4.5 },
  岐阜県: { lng: 136.9854, lat: 35.3912, lat_span: 1.8, lng_span: 4.5 },
  静岡県: { lng: 138.3831, lat: 34.9769, lat_span: 1.8, lng_span: 4.5 },
  愛知県: { lng: 137.0218, lat: 35.1802, lat_span: 1.2, lng_span: 3.0 },
  三重県: { lng: 136.5086, lat: 34.7303, lat_span: 1.2, lng_span: 3.0 },
  滋賀県: { lng: 136.0688, lat: 35.0045, lat_span: 0.8, lng_span: 2.0 },
  京都府: { lng: 135.7681, lat: 35.0211, lat_span: 0.8, lng_span: 2.0 },
  大阪府: { lng: 135.5022, lat: 34.6863, lat_span: 0.5, lng_span: 1.3 },
  兵庫県: { lng: 134.6903, lat: 34.6913, lat_span: 1.8, lng_span: 4.5 },
  奈良県: { lng: 135.8329, lat: 34.6851, lat_span: 0.8, lng_span: 2.0 },
  和歌山県: { lng: 135.1675, lat: 34.2261, lat_span: 1.2, lng_span: 3.0 },
  鳥取県: { lng: 134.2375, lat: 35.5036, lat_span: 1.2, lng_span: 3.0 },
  島根県: { lng: 132.5556, lat: 35.4723, lat_span: 1.8, lng_span: 4.5 },
  岡山県: { lng: 133.9345, lat: 34.6617, lat_span: 1.2, lng_span: 3.0 },
  広島県: { lng: 132.4596, lat: 34.3965, lat_span: 1.8, lng_span: 4.5 },
  山口県: { lng: 131.4706, lat: 34.186, lat_span: 1.8, lng_span: 4.5 },
  徳島県: { lng: 134.5594, lat: 34.0658, lat_span: 1.2, lng_span: 3.0 },
  香川県: { lng: 134.0434, lat: 34.3401, lat_span: 0.8, lng_span: 2.0 },
  愛媛県: { lng: 132.7657, lat: 33.8416, lat_span: 1.8, lng_span: 4.5 },
  高知県: { lng: 133.5311, lat: 33.5597, lat_span: 1.8, lng_span: 4.5 },
  福岡県: { lng: 130.4181, lat: 33.6064, lat_span: 1.2, lng_span: 3.0 },
  佐賀県: { lng: 130.2988, lat: 33.2494, lat_span: 0.8, lng_span: 2.0 },
  長崎県: { lng: 129.8737, lat: 32.7503, lat_span: 1.8, lng_span: 4.5 },
  熊本県: { lng: 130.7416, lat: 32.7898, lat_span: 1.8, lng_span: 4.5 },
  大分県: { lng: 131.6126, lat: 33.2382, lat_span: 1.8, lng_span: 4.5 },
  宮崎県: { lng: 131.4202, lat: 31.9111, lat_span: 1.8, lng_span: 4.5 },
  鹿児島県: { lng: 130.5581, lat: 31.5602, lat_span: 2.5, lng_span: 6.0 },
  沖縄県: { lng: 127.6809, lat: 26.2124, lat_span: 1.8, lng_span: 4.5 },
};

/**
 * 地方区分の座標データ
 * lat_span/lng_span: 表示する緯度・経度の範囲（度数）
 * PCとモバイルで同じ地理的範囲が表示されます
 */
export const REGION_COORDINATES: Record<
  string,
  { lng: number; lat: number; lat_span: number; lng_span: number }
> = {
  北海道: { lng: 142.3649, lat: 43.0642, lat_span: 5.0, lng_span: 13.5 },
  東北: { lng: 140.4676, lat: 39.5, lat_span: 5.0, lng_span: 12.0 },
  関東: { lng: 139.4, lat: 36.0, lat_span: 3.0, lng_span: 7.0 },
  中部: { lng: 137.5, lat: 36.0, lat_span: 4.0, lng_span: 10.0 },
  近畿: { lng: 135.5, lat: 34.8, lat_span: 2.5, lng_span: 6.0 },
  中国: { lng: 133.0, lat: 35.0, lat_span: 3.0, lng_span: 7.0 },
  四国: { lng: 133.5, lat: 33.75, lat_span: 2.5, lng_span: 6.0 },
  九州: { lng: 130.9, lat: 32.8, lat_span: 4.0, lng_span: 9.0 },
  沖縄: { lng: 127.6809, lat: 26.2124, lat_span: 5.0, lng_span: 12.0 },
};

/**
 * 地方区分ごとの都道府県リスト
 */
export const REGION_PREFECTURES: Record<string, string[]> = {
  北海道: ['北海道'],
  東北: ['青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県'],
  関東: ['茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県'],
  中部: [
    '新潟県',
    '富山県',
    '石川県',
    '福井県',
    '山梨県',
    '長野県',
    '岐阜県',
    '静岡県',
    '愛知県',
  ],
  近畿: ['三重県', '滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県'],
  中国: ['鳥取県', '島根県', '岡山県', '広島県', '山口県'],
  四国: ['徳島県', '香川県', '愛媛県', '高知県'],
  九州: [
    '福岡県',
    '佐賀県',
    '長崎県',
    '熊本県',
    '大分県',
    '宮崎県',
    '鹿児島県',
  ],
  沖縄: ['沖縄県'],
};
