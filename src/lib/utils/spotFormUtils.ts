import { CampingSpotWithId } from '@/data/schemas/campingSpot';
import { ShachuHakuFormData } from '@/components/admin/validationSchemas';

/**
 * フォームに入力があるかチェック
 * @param formValues - フォームの値
 * @returns 入力がある場合true
 */
export function hasFormInput(formValues: ShachuHakuFormData): boolean {
  return Object.entries(formValues).some(([key, value]) => {
    // 座標フィールドは除外（地図クリックで自動入力されるため）
    if (key === 'lat' || key === 'lng') return false;

    // 値が存在し、デフォルト値でないかチェック
    if (typeof value === 'string') {
      return value.trim() !== '';
    } else if (typeof value === 'boolean') {
      return value === true;
    } else if (value !== undefined && value !== null) {
      return true;
    }
    return false;
  });
}

/**
 * CampingSpotをフォーム値に変換
 * @param spot - 車中泊スポットデータ
 * @returns フォーム用のデータ
 */
export function convertSpotToFormValues(
  spot: CampingSpotWithId
): ShachuHakuFormData {
  return {
    name: spot.name,
    lat: spot.coordinates[1].toString(),
    lng: spot.coordinates[0].toString(),
    prefecture: spot.prefecture,
    address: spot.address || '',
    url: spot.url || '',
    type: spot.type,
    distanceToToilet: spot.distanceToToilet?.toString() || '',
    distanceToBath: spot.distanceToBath?.toString() || '',
    distanceToConvenience: spot.distanceToConvenience?.toString() || '',
    nearbyToiletLat:
      spot.nearbyToiletCoordinates && spot.nearbyToiletCoordinates.length >= 2
        ? spot.nearbyToiletCoordinates[1].toString()
        : '',
    nearbyToiletLng:
      spot.nearbyToiletCoordinates && spot.nearbyToiletCoordinates.length >= 2
        ? spot.nearbyToiletCoordinates[0].toString()
        : '',
    nearbyConvenienceLat:
      spot.nearbyConvenienceCoordinates &&
      spot.nearbyConvenienceCoordinates.length >= 2
        ? spot.nearbyConvenienceCoordinates[1].toString()
        : '',
    nearbyConvenienceLng:
      spot.nearbyConvenienceCoordinates &&
      spot.nearbyConvenienceCoordinates.length >= 2
        ? spot.nearbyConvenienceCoordinates[0].toString()
        : '',
    nearbyBathLat:
      spot.nearbyBathCoordinates && spot.nearbyBathCoordinates.length >= 2
        ? spot.nearbyBathCoordinates[1].toString()
        : '',
    nearbyBathLng:
      spot.nearbyBathCoordinates && spot.nearbyBathCoordinates.length >= 2
        ? spot.nearbyBathCoordinates[0].toString()
        : '',
    elevation: spot.elevation?.toString() || '',
    // 新評価システム（客観的データ）
    securityHasGate: spot.security?.hasGate || false,
    securityHasLighting: spot.security?.hasLighting || false,
    securityHasStaff: spot.security?.hasStaff || false,
    nightNoiseHasNoiseIssues: spot.nightNoise?.hasNoiseIssues || false,
    nightNoiseNearBusyRoad: spot.nightNoise?.nearBusyRoad || false,
    nightNoiseIsQuietArea: spot.nightNoise?.isQuietArea || false,
    // 旧評価システム（段階的廃止予定） - レガシーデータとの互換性のため
    quietnessLevel: (spot as any).quietnessLevel?.toString() || '',
    securityLevel: (spot as any).securityLevel?.toString() || '',
    overallRating: (spot as any).overallRating?.toString() || '',
    hasRoof: spot.hasRoof,
    hasPowerOutlet: spot.hasPowerOutlet,
    isFree: spot.pricing.isFree,
    pricePerNight: spot.pricing.pricePerNight?.toString() || '',
    priceNote: spot.pricing.priceNote || '',
    capacity: spot.capacity?.toString() || '',
    capacityLarge: spot.capacityLarge?.toString() || '',
    restrictions: spot.restrictions.join(', '),
    amenities: spot.amenities.join(', '),
    notes: spot.notes || '',
  };
}

/**
 * エラーの詳細情報を取得
 * @param error - エラーオブジェクト
 * @param isEdit - 編集モードかどうか
 * @returns エラータイトル、メッセージ、詳細
 */
export function getErrorDetails(
  error: unknown,
  isEdit: boolean
): {
  errorTitle: string;
  errorMessage: string;
  errorDetails: string;
} {
  let errorTitle = 'エラー';
  let errorMessage = '';
  let errorDetails = '';

  if (error instanceof Error) {
    const errorText = error.message.toLowerCase();

    // MongoDBタイムアウトエラー
    if (
      errorText.includes('timeout') ||
      errorText.includes('timed out') ||
      errorText.includes('server selection')
    ) {
      errorTitle = 'データベース接続エラー';
      errorMessage = 'データベースへの接続がタイムアウトしました';
      errorDetails =
        '入力したデータは自動的に保存されています。しばらく待ってから再度お試しください。';
    }
    // ネットワークエラー
    else if (
      errorText.includes('network') ||
      errorText.includes('fetch') ||
      errorText.includes('connection')
    ) {
      errorTitle = 'ネットワークエラー';
      errorMessage = 'ネットワーク接続に問題があります';
      errorDetails =
        '入力したデータは自動的に保存されています。インターネット接続を確認してから再度お試しください。';
    }
    // バリデーションエラー
    else if (
      errorText.includes('validation') ||
      errorText.includes('invalid')
    ) {
      errorTitle = '入力エラー';
      errorMessage = '入力内容に問題があります';
      errorDetails = error.message;
    }
    // その他のエラー
    else {
      errorMessage = isEdit
        ? 'スポットの更新に失敗しました'
        : 'スポットの作成に失敗しました';
      errorDetails =
        '入力したデータは自動的に保存されています。' +
        (error.message ? `\n詳細: ${error.message}` : '');
    }
  } else {
    errorMessage = isEdit
      ? 'スポットの更新に失敗しました'
      : 'スポットの作成に失敗しました';
    errorDetails = '入力したデータは自動的に保存されています。';
  }

  return { errorTitle, errorMessage, errorDetails };
}
