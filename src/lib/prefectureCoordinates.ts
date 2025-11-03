/**
 * 都道府県の中心座標データ
 * lng_span: 表示する経度の範囲（度数）
 * aspect_ratio: 地理的縦横比 (lng_span / lat_span)
 * lat_spanは lng_span / aspect_ratio で計算されます
 * PCとモバイルで同じ地理的範囲・同じ地理的縦横比で表示されます
 *
 * aspect_ratioは 1.6 / cos(緯度) で計算（緯度による経度の見かけの幅を補正）
 */
export const PREFECTURE_COORDINATES: Record<
  string,
  { lng: number; lat: number; lng_span: number; aspect_ratio: number }
> = {
  北海道: {
    lng: 143.4440516,
    lat: 43.4988653,
    lng_span: 12.7281228,
    aspect_ratio: 2.94,
  },
  青森県: {
    lng: 140.6704744,
    lat: 40.8795366,
    lng_span: 3.9585493,
    aspect_ratio: 2.64,
  },
  岩手県: {
    lng: 141.21478732,
    lat: 39.6453702,
    lng_span: 4.7128465,
    aspect_ratio: 2.59,
  },
  宮城県: {
    lng: 140.9382801,
    lat: 38.3475145,
    lng_span: 3.3487097,
    aspect_ratio: 2.55,
  },
  秋田県: {
    lng: 140.4645118,
    lat: 39.6664364,
    lng_span: 4.4567871,
    aspect_ratio: 2.6,
  },
  山形県: {
    lng: 140.1698805,
    lat: 38.4391964,
    lng_span: 3.7586046,
    aspect_ratio: 2.55,
  },
  福島県: {
    lng: 140.0940713,
    lat: 37.4041528,
    lng_span: 3.15367735,
    aspect_ratio: 2.51,
  },
  茨城県: {
    lng: 140.3750079,
    lat: 36.3110893,
    lng_span: 3.3464195,
    aspect_ratio: 2.48,
  },
  栃木県: {
    lng: 139.9891828,
    lat: 36.6830752,
    lng_span: 2.6485948,
    aspect_ratio: 2.49,
  },
  群馬県: {
    lng: 139.022,
    lat: 36.5036165,
    lng_span: 2.9822242,
    aspect_ratio: 2.49,
  },
  埼玉県: {
    lng: 139.305363,
    lat: 36.0268586,
    lng_span: 1.466372,
    aspect_ratio: 2.47,
  },
  千葉県: {
    lng: 140.3508923,
    lat: 35.5944195,
    lng_span: 1.4880221,
    aspect_ratio: 2.46,
  },
  東京都: {
    lng: 139.4245478,
    lat: 35.7037174,
    lng_span: 1.0259597,
    aspect_ratio: 2.46,
  },
  神奈川県: {
    lng: 139.3530778,
    lat: 35.40859,
    lng_span: 1.4019021,
    aspect_ratio: 2.45,
  },
  新潟県: {
    lng: 138.4896377,
    lat: 37.6317638,
    lng_span: 4.7316768,
    aspect_ratio: 2.52,
  },
  富山県: {
    lng: 137.1777158,
    lat: 36.6146017,
    lng_span: 1.8741317,
    aspect_ratio: 2.49,
  },
  石川県: {
    lng: 136.5536462,
    lat: 36.7952588,
    lng_span: 3.7508013,
    aspect_ratio: 2.49,
  },
  福井県: {
    lng: 136.0414359,
    lat: 35.8252622,
    lng_span: 2.4032693,
    aspect_ratio: 2.46,
  },
  山梨県: {
    lng: 138.6667538,
    lat: 35.5870023,
    lng_span: 1.7989725,
    aspect_ratio: 2.46,
  },
  長野県: {
    lng: 137.8459251,
    lat: 36.1247235,
    lng_span: 3.5841074,
    aspect_ratio: 2.47,
  },
  岐阜県: {
    lng: 136.8862592,
    lat: 35.8613835,
    lng_span: 2.5004105,
    aspect_ratio: 2.46,
  },
  静岡県: {
    lng: 138.3150624,
    lat: 35.0035701,
    lng_span: 2.0435972,
    aspect_ratio: 2.44,
  },
  愛知県: {
    lng: 136.9663672,
    lat: 34.9645999,
    lng_span: 1.9333036,
    aspect_ratio: 2.44,
  },
  三重県: {
    lng: 136.5726315,
    lat: 34.5130473,
    lng_span: 3.3474802,
    aspect_ratio: 2.42,
  },
  滋賀県: {
    lng: 136.0600569,
    lat: 35.2625991,
    lng_span: 1.7668393,
    aspect_ratio: 2.45,
  },
  京都府: {
    lng: 135.6188738,
    lat: 35.2153875,
    lng_span: 2.2280033,
    aspect_ratio: 2.44,
  },
  大阪府: {
    lng: 135.4118073,
    lat: 34.6490073,
    lng_span: 1.4862777,
    aspect_ratio: 2.43,
  },
  兵庫県: {
    lng: 134.8916078,
    lat: 35.1221215,
    lng_span: 2.7293094,
    aspect_ratio: 2.44,
  },
  奈良県: {
    lng: 135.8319102,
    lat: 34.4084746,
    lng_span: 1.7690677,
    aspect_ratio: 2.42,
  },
  和歌山県: {
    lng: 135.4593659,
    lat: 33.9136346,
    lng_span: 2.3626087,
    aspect_ratio: 2.41,
  },
  鳥取県: {
    lng: 133.7965425,
    lat: 35.3504501,
    lng_span: 1.3239257,
    aspect_ratio: 2.45,
  },
  島根県: {
    lng: 132.3794823,
    lat: 35.0405144,
    lng_span: 2.8527774,
    aspect_ratio: 2.44,
  },
  岡山県: {
    lng: 133.8434908,
    lat: 34.8237422,
    lng_span: 2.3627188,
    aspect_ratio: 2.43,
  },
  広島県: {
    lng: 132.8157703,
    lat: 34.5400409,
    lng_span: 2.0198731,
    aspect_ratio: 2.42,
  },
  山口県: {
    lng: 131.4030665,
    lat: 34.2321401,
    lng_span: 1.9848691,
    aspect_ratio: 2.42,
  },
  徳島県: {
    lng: 134.1552609,
    lat: 33.8977701,
    lng_span: 1.7164417,
    aspect_ratio: 2.41,
  },
  香川県: {
    lng: 133.9343125,
    lat: 34.3034055,
    lng_span: 1.2125038,
    aspect_ratio: 2.42,
  },
  愛媛県: {
    lng: 132.7230907,
    lat: 33.6457941,
    lng_span: 2.1311676,
    aspect_ratio: 2.4,
  },
  高知県: {
    lng: 133.1515481,
    lat: 33.2532103,
    lng_span: 2.8460995,
    aspect_ratio: 2.39,
  },
  福岡県: {
    lng: 130.5865934,
    lat: 33.5564475,
    lng_span: 2.027841,
    aspect_ratio: 2.4,
  },
  佐賀県: {
    lng: 130.1181049,
    lat: 33.2535274,
    lng_span: 1.4230498,
    aspect_ratio: 2.39,
  },
  長崎県: {
    lng: 129.1230207,
    lat: 33.0782682,
    lng_span: 2.5781035,
    aspect_ratio: 2.38,
  },
  熊本県: {
    lng: 130.5655623,
    lat: 32.6582215,
    lng_span: 2.5397832,
    aspect_ratio: 2.37,
  },
  大分県: {
    lng: 131.3731411,
    lat: 33.2166039,
    lng_span: 1.7941168,
    aspect_ratio: 2.39,
  },
  宮崎県: {
    lng: 131.3361859,
    lat: 32.1238331,
    lng_span: 2.7676077,
    aspect_ratio: 2.369,
  },
  鹿児島県: {
    lng: 130.673366,
    lat: 31.6218669,
    lng_span: 3.0613722,
    aspect_ratio: 2.35,
  },
  沖縄県: {
    lng: 125.6561867,
    lat: 25.6662015,
    lng_span: 7.3123734,
    aspect_ratio: 2.22,
  },
};

/**
 * 地方区分の座標データ
 * lng_span: 表示する経度の範囲（度数）
 * aspect_ratio: 地理的縦横比 (lng_span / lat_span)
 * lat_spanは lng_span / aspect_ratio で計算されます
 * PCとモバイルで同じ地理的範囲・同じ地理的縦横比で表示されます
 *
 * aspect_ratioは 1.6 / cos(緯度) で計算（緯度による経度の見かけの幅を補正）
 */
export const REGION_COORDINATES: Record<
  string,
  { lng: number; lat: number; lng_span: number; aspect_ratio: number }
> = {
  北海道: {
    lng: 144.2983781,
    lat: 43.5276972,
    lng_span: 10.0956372,
    aspect_ratio: 2.31,
  },
  東北: {
    lng: 140.97270446,
    lat: 39.1430295,
    lng_span: 11.1954296,
    aspect_ratio: 2.16,
  },
  関東: {
    lng: 139.3188163,
    lat: 36.0881547,
    lng_span: 5.5522296,
    aspect_ratio: 2.07,
  },
  中部: {
    lng: 137.2343704,
    lat: 35.4409538,
    lng_span: 5.187821,
    aspect_ratio: 1.97,
  },
  近畿: {
    lng: 135.766096,
    lat: 34.9904213,
    lng_span: 4.0628629,
    aspect_ratio: 2.44,
  },
  中国: {
    lng: 132.5505917,
    lat: 34.6059359,
    lng_span: 5.1222738,
    aspect_ratio: 2.43,
  },
  四国: {
    lng: 133.3924744,
    lat: 33.5536065,
    lng_span: 4.2073221,
    aspect_ratio: 2.4,
  },
  九州: {
    lng: 130.4083617,
    lat: 32.5129442,
    lng_span: 7.9398501,
    aspect_ratio: 2.37,
  },
  沖縄: {
    lng: 125.6561867,
    lat: 25.6662015,
    lng_span: 7.3123734,
    aspect_ratio: 2.22,
  },
};

/**
 * 地方区分ごとの都道府県リスト
 */
export const REGION_PREFECTURES: Record<string, string[]> = {
  北海道: ['北海道'],
  東北: ['青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県'],
  関東: [
    '茨城県',
    '栃木県',
    '群馬県',
    '埼玉県',
    '千葉県',
    '東京都',
    '神奈川県',
  ],
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
  近畿: [
    '三重県',
    '滋賀県',
    '京都府',
    '大阪府',
    '兵庫県',
    '奈良県',
    '和歌山県',
  ],
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
