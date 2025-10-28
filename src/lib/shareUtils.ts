import { formatDateWithWeekday } from '@/lib/date';

// ==================================================
// 旅程用の共有機能
// ==================================================

export type ShareItineraryData = {
  title: string;
  dayIndex: number;
  date?: string;
  id?: string;
  isPublic?: boolean;
};

/**
 * 旅程用の共有データを作成する
 */
export const createItineraryShareData = (shareData: ShareItineraryData) => {
  const { title, dayIndex, date, id } = shareData;

  // 日付をフォーマット（dateがundefinedの場合は空文字列を使用）
  const formattedDate = date ? formatDateWithWeekday(date) : '';

  // 共有データの作成
  const shareUrl = `https://tabi.over40web.club/itineraries/${id}?day=${dayIndex}`;
  const shareTitle = `${title} ${dayIndex}日目`;
  const shareText = `${formattedDate}の旅程です。`;

  return {
    title: shareTitle,
    text: shareText,
    url: shareUrl,
  };
};

/**
 * 旅程用のWeb Share API共有機能
 */
const shareWithWebAPIForItinerary = async (shareData: ShareItineraryData) => {
  if (!shareData.id) return false;

  const { title, text, url } = createItineraryShareData(shareData);

  // Web Share APIが利用可能かチェック
  if (navigator.share) {
    try {
      await navigator.share({
        title,
        text,
        url,
      });
      return true;
    } catch (error) {
      // ユーザーがキャンセルした場合など
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Web Share API error:', error);
      }
      return false;
    }
  }

  return false;
};

/**
 * 旅程用のクリップボードコピー機能
 */
const shareWithClipboardForItinerary = async (
  shareData: ShareItineraryData
) => {
  if (!shareData.id) return false;

  const { title, text, url } = createItineraryShareData(shareData);
  const shareContent = `${title}\n${text}\n${url}`;

  try {
    await navigator.clipboard.writeText(shareContent);
    console.log('URLをクリップボードにコピーしました');
    return true;
  } catch (error) {
    console.error('Clipboard API error:', error);

    // 最終フォールバック：テキスト選択
    try {
      const textArea = document.createElement('textarea');
      textArea.value = shareContent;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      console.log('テキスト選択でコピーしました');
      return true;
    } catch (fallbackError) {
      console.error('Fallback copy error:', fallbackError);
      return false;
    }
  }
};

/**
 * 旅程用のメイン共有機能
 */
export const handleItineraryShare = async (shareData: ShareItineraryData) => {
  if (!shareData.id) return false;

  // Web Share APIを試す
  const webAPISuccess = await shareWithWebAPIForItinerary(shareData);
  if (webAPISuccess) return true;

  // フォールバック：クリップボードコピー
  return await shareWithClipboardForItinerary(shareData);
};

// ==================================================
// 車中泊スポット用の共有機能
// ==================================================

/**
 * 車中泊スポット用の共有データ型
 */
export type CampingSpotShareData = {
  searchTerm?: string;
  typeFilter?: string;
  tab?: 'map' | 'list';
  zoom?: number;
  center?: [number, number];
  bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  } | null;
  clientFilters?: {
    pricingFilter?: string;
    minSecurityLevel?: number;
    minQuietnessLevel?: number;
    maxToiletDistance?: number | null;
    minElevation?: number | null;
    maxElevation?: number | null;
  };
};

/**
 * 車中泊スポット用の共有URLとテキストを作成する
 */
export const createCampingSpotShareData = (data: CampingSpotShareData) => {
  const params = new URLSearchParams();

  // タブ
  if (data.tab === 'list') {
    params.set('tab', 'list');
  }

  // 検索キーワード
  if (data.searchTerm) {
    params.set('q', data.searchTerm);
  }

  // 種別フィルター
  if (data.typeFilter && data.typeFilter !== 'all') {
    params.set('type', data.typeFilter);
  }

  // クライアント側フィルター
  if (data.clientFilters) {
    if (
      data.clientFilters.pricingFilter &&
      data.clientFilters.pricingFilter !== 'all'
    ) {
      params.set('pricing', data.clientFilters.pricingFilter);
    }
    if (
      data.clientFilters.minSecurityLevel &&
      data.clientFilters.minSecurityLevel > 0
    ) {
      params.set(
        'min_security',
        data.clientFilters.minSecurityLevel.toString()
      );
    }
    if (
      data.clientFilters.minQuietnessLevel &&
      data.clientFilters.minQuietnessLevel > 0
    ) {
      params.set(
        'min_quietness',
        data.clientFilters.minQuietnessLevel.toString()
      );
    }
    if (data.clientFilters.maxToiletDistance !== null) {
      params.set(
        'max_toilet_dist',
        data.clientFilters.maxToiletDistance!.toString()
      );
    }
    if (data.clientFilters.minElevation !== null) {
      params.set('min_elevation', data.clientFilters.minElevation!.toString());
    }
    if (data.clientFilters.maxElevation !== null) {
      params.set('max_elevation', data.clientFilters.maxElevation!.toString());
    }
  }

  // マップの位置とズーム
  if (data.zoom !== undefined && data.center) {
    params.set('zoom', data.zoom.toFixed(2));
    params.set('lat', data.center[1].toFixed(6));
    params.set('lng', data.center[0].toFixed(6));
  }

  // 境界（地図表示範囲）
  if (data.bounds) {
    params.set('bounds_north', data.bounds.north.toFixed(6));
    params.set('bounds_south', data.bounds.south.toFixed(6));
    params.set('bounds_east', data.bounds.east.toFixed(6));
    params.set('bounds_west', data.bounds.west.toFixed(6));
  }

  // URLとテキストの作成
  const shareUrl = `https://tabi.over40web.club/shachu-haku${
    params.toString() ? '?' + params.toString() : ''
  }`;

  // タイトルとテキストを作成
  let shareTitle = '車中泊スポット';
  const descriptionParts: string[] = [];

  if (data.searchTerm) {
    shareTitle = `「${data.searchTerm}」の車中泊スポット`;
    descriptionParts.push(`「${data.searchTerm}」で検索`);
  }

  if (data.typeFilter && data.typeFilter !== 'all') {
    const typeLabels: Record<string, string> = {
      roadside_station: '道の駅',
      sa_pa: 'SA・PA',
      rv_park: 'RVパーク',
      convenience_store: 'コンビニ',
      parking_lot: '駐車場',
      other: 'その他',
    };
    const typeLabel = typeLabels[data.typeFilter];
    if (typeLabel) {
      descriptionParts.push(typeLabel);
    }
  }

  const shareText =
    descriptionParts.length > 0
      ? `${descriptionParts.join('・')}の車中泊スポット情報です。`
      : '車中泊スポット情報を共有します。';

  return {
    title: `${shareTitle} | 車旅のしおり`,
    text: shareText,
    url: shareUrl,
  };
};

/**
 * 車中泊スポット用のWeb Share API共有機能
 */
const shareWithWebAPIForCampingSpot = async (data: CampingSpotShareData) => {
  const { title, text, url } = createCampingSpotShareData(data);

  // Web Share APIが利用可能かチェック
  if (navigator.share) {
    try {
      await navigator.share({
        title,
        text,
        url,
      });
      return true;
    } catch (error) {
      // ユーザーがキャンセルした場合など
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Web Share API error:', error);
      }
      return false;
    }
  }

  return false;
};

/**
 * 車中泊スポット用のクリップボードコピー機能
 */
const shareWithClipboardForCampingSpot = async (data: CampingSpotShareData) => {
  const { title, text, url } = createCampingSpotShareData(data);
  const shareContent = `${title}\n${text}\n${url}`;

  try {
    await navigator.clipboard.writeText(shareContent);
    console.log('URLをクリップボードにコピーしました');
    return true;
  } catch (error) {
    console.error('Clipboard API error:', error);

    // 最終フォールバック：テキスト選択
    try {
      const textArea = document.createElement('textarea');
      textArea.value = shareContent;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      console.log('テキスト選択でコピーしました');
      return true;
    } catch (fallbackError) {
      console.error('Fallback copy error:', fallbackError);
      return false;
    }
  }
};

/**
 * 車中泊スポット用のメイン共有機能
 */
export const handleCampingSpotShare = async (data: CampingSpotShareData) => {
  // Web Share APIを試す
  const webAPISuccess = await shareWithWebAPIForCampingSpot(data);
  if (webAPISuccess) return true;

  // フォールバック：クリップボードコピー
  return await shareWithClipboardForCampingSpot(data);
};
