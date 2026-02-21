// 座標の有効性をチェック（型ガード）
export const isValidCoordinate = (
  coords: [number, number] | undefined | null
): coords is [number, number] => {
  return (
    coords != null &&
    Array.isArray(coords) &&
    coords.length === 2 &&
    typeof coords[0] === 'number' &&
    typeof coords[1] === 'number' &&
    !isNaN(coords[0]) &&
    !isNaN(coords[1]) &&
    isFinite(coords[0]) &&
    isFinite(coords[1]) &&
    coords[0] >= -180 &&
    coords[0] <= 180 &&
    coords[1] >= -90 &&
    coords[1] <= 90
  );
};
