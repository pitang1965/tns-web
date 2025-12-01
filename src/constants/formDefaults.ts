import { ShachuHakuFormData } from '@/components/admin/validationSchemas';

/**
 * LocalStorageキー: 車中泊スポットフォームの自動保存用
 */
export const AUTO_SAVE_KEY = 'shachu-haku-form-autosave';

/**
 * 車中泊スポットフォームのデフォルト値
 */
export const DEFAULT_FORM_VALUES = {
  name: '',
  lat: '',
  lng: '',
  prefecture: '',
  address: '',
  url: '',
  type: undefined as any,
  distanceToToilet: '',
  distanceToBath: '',
  distanceToConvenience: '',
  nearbyToiletLat: '',
  nearbyToiletLng: '',
  nearbyConvenienceLat: '',
  nearbyConvenienceLng: '',
  nearbyBathLat: '',
  nearbyBathLng: '',
  elevation: '',
  // 新評価システム（客観的データ）
  securityHasGate: false,
  securityHasLighting: false,
  securityHasStaff: false,
  nightNoiseHasNoiseIssues: false,
  nightNoiseNearBusyRoad: false,
  nightNoiseIsQuietArea: false,
  // 旧評価システム（段階的廃止予定）
  quietnessLevel: '',
  securityLevel: '',
  overallRating: '',
  hasRoof: false,
  hasPowerOutlet: false,
  isFree: undefined as any,
  pricePerNight: '',
  priceNote: '',
  capacity: '',
  capacityLarge: '',
  restrictions: '',
  amenities: '',
  notes: '',
} as ShachuHakuFormData;
