import { ShachuHakuFormData } from '@/components/admin/validationSchemas';

export type MissingFields = {
  empty: string[];
  unchecked: string[];
};

/**
 * 車中泊スポットフォームの未入力項目をチェックするカスタムフック
 */
export const useCheckMissingFields = () => {
  /**
   * フォームデータから未入力の任意項目をチェック
   * @param data フォームデータ
   * @returns 未入力項目のリスト
   */
  const checkMissingFields = (data: ShachuHakuFormData): MissingFields => {
    const empty: string[] = [];
    const unchecked: string[] = [];

    // 未入力のテキスト項目をチェック
    if (!data.address || data.address.trim() === '') empty.push('住所');
    if (!data.url || data.url.trim() === '') empty.push('URL');
    if (!data.capacity || data.capacity.trim() === '') empty.push('収容台数（普通車）');
    if (!data.capacityLarge || data.capacityLarge.trim() === '') empty.push('収容台数（大型車）');
    if (!data.restrictions || data.restrictions.trim() === '') empty.push('制限事項');
    if (!data.amenities || data.amenities.trim() === '') empty.push('その他設備');
    if (!data.notes || data.notes.trim() === '') empty.push('備考');

    // 有料の場合、料金項目をチェック
    if (data.isFree === false) {
      if (!data.pricePerNight || data.pricePerNight.trim() === '') empty.push('1泊料金');
      if (!data.priceNote || data.priceNote.trim() === '') empty.push('料金備考');
    }

    // 各施設の座標をチェック（緯度・経度のどちらかまたは両方が未入力の場合）
    const hasToiletLat = data.nearbyToiletLat && data.nearbyToiletLat.trim() !== '';
    const hasToiletLng = data.nearbyToiletLng && data.nearbyToiletLng.trim() !== '';
    if (!hasToiletLat || !hasToiletLng) {
      empty.push('トイレの緯度及び/又は経度');
    }

    const hasConvenienceLat = data.nearbyConvenienceLat && data.nearbyConvenienceLat.trim() !== '';
    const hasConvenienceLng = data.nearbyConvenienceLng && data.nearbyConvenienceLng.trim() !== '';
    if (!hasConvenienceLat || !hasConvenienceLng) {
      empty.push('コンビニの緯度及び/又は経度');
    }

    const hasBathLat = data.nearbyBathLat && data.nearbyBathLat.trim() !== '';
    const hasBathLng = data.nearbyBathLng && data.nearbyBathLng.trim() !== '';
    if (!hasBathLat || !hasBathLng) {
      empty.push('入浴施設の緯度及び/又は経度');
    }

    // チェックされていないboolean項目
    if (!data.securityHasGate) unchecked.push('ゲート有りでない');
    if (!data.securityHasLighting) unchecked.push('照明十分でない');
    if (!data.securityHasStaff) unchecked.push('管理人・職員有りでない');
    if (!data.nightNoiseHasNoiseIssues) unchecked.push('夜間騒音問題有りでない');
    if (!data.nightNoiseNearBusyRoad) unchecked.push('交通量多い道路近くでない');
    if (!data.nightNoiseIsQuietArea) unchecked.push('静かなエリアでない');

    return { empty, unchecked };
  };

  return { checkMissingFields };
};
