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
  // ユーザーに明示的な選択を促すため意図的にundefinedで初期化（スキーマ上は必須のため型のみキャスト）
  type: undefined as unknown as ShachuHakuFormData['type'],
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
  isOvernightProhibited: false,
  hasRoof: false,
  hasPowerOutlet: false,
  // ユーザーに明示的な選択を促すため意図的にundefinedで初期化（スキーマ上は必須のため型のみキャスト）
  isFree: undefined as unknown as ShachuHakuFormData['isFree'],
  pricePerNight: '',
  priceNote: '',
  capacity: '',
  capacityLarge: '',
  restrictions: '',
  amenities: '',
  notes: '',
} as ShachuHakuFormData;
