// 既知の問題アイコンのリスト
export const KNOWN_MISSING_ICONS = ['-11', 'skiing-11'];

// 空のダミー画像を作成する関数
export const createEmptyImage = () => {
  // 1x1の透明な画像を作成
  const size = 1;
  const data = new Uint8ClampedArray(size * size * 4);

  // 完全に透明に設定
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 0; // R
    data[i + 1] = 0; // G
    data[i + 2] = 0; // B
    data[i + 3] = 0; // Alpha (透明)
  }

  return { width: size, height: size, data };
};

// コンソール警告を一時的に抑制する関数
export const suppressImageWarnings = (): (() => void) => {
  const originalConsoleWarn = console.warn;

  console.warn = function (msg, ...args) {
    if (
      typeof msg === 'string' &&
      (msg.includes('Image') || msg.includes('image') || msg.includes('sprite'))
    ) {
      // 画像関連の警告を抑制
      return;
    }
    originalConsoleWarn.apply(console, [msg, ...args]);
  };

  // 元に戻す関数を返す
  return () => {
    console.warn = originalConsoleWarn;
  };
};

// 既知の問題アイコンを事前登録する関数
export const preRegisterKnownIcons = (mapInstance: mapboxgl.Map): void => {
  KNOWN_MISSING_ICONS.forEach((iconId) => {
    try {
      // 空の透明な画像を追加（表示されず警告も出ない）
      mapInstance.addImage(iconId, createEmptyImage(), {
        sdf: true, // SDFモードでアイコンを追加
      });
    } catch (err) {
      // エラーは無視（すでにアイコンが存在する場合など）
    }
  });
};

// 不足しているアイコンを空の透明アイコンで置き換える関数
export const handleMissingImage = (
  mapInstance: mapboxgl.Map,
  imageId: string
): void => {
  try {
    mapInstance.addImage(imageId, createEmptyImage(), {
      sdf: true, // SDFモードでアイコンを追加
    });
  } catch (err) {
    // エラーは無視
  }
};

// マップのエラーハンドリング関数
export const handleMapError = (e: mapboxgl.ErrorEvent): void => {
  // スタイルイメージに関するエラーを除外
  if (
    e.error &&
    e.error.message &&
    (e.error.message.includes('image') || e.error.message.includes('sprite'))
  ) {
    return;
  }
  console.error('Map error:', e.error);
};

// 日本語ラベルを設定する関数
export const setupJapaneseLabels = (mapInstance: mapboxgl.Map): void => {
  const layers = [
    'country-label',
    'state-label',
    'settlement-label',
    'poi-label',
  ];

  layers.forEach((layer) => {
    if (mapInstance.getLayer(layer)) {
      mapInstance.setLayoutProperty(layer, 'text-field', [
        'coalesce',
        ['get', 'name_ja'],
        ['get', 'name'],
      ]);
    }
  });
};

// POIアイコンフィルターを設定する関数
export const setupPOIFilters = (mapInstance: mapboxgl.Map): void => {
  if (mapInstance.getLayer('poi-label')) {
    // POIの表示フィルターを調整
    mapInstance.setFilter('poi-label', [
      'all',
      ['!=', ['get', 'maki'], 'skiing'], // スキーアイコンを除外
      ['!=', ['get', 'maki'], '-11'], // 問題のアイコンを除外
    ]);
  }
};
