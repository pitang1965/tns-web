import { z } from 'zod';
import { CampingSpotType } from '@/data/schemas/campingSpot';
import { PersonaType } from '@/data/schemas/diagnosisSchema';
import { placeSchema } from '@/data/schemas/placeSchema';

// アクティビティの場所種別（placeSchema と同期。ドリフト防止のため infer で導出）
export type PlaceType = z.infer<typeof placeSchema>['type'];

// 内部で使う座標表現。CampingSpot は [lng, lat]、locationSchema は
// { latitude, longitude } と表現が割れているため、パイプライン内部は
// この {lat, lng} に統一し、境界で変換する。
export type LatLng = { lat: number; lng: number };

// 出発地・目的地（クライアントが Mapbox Search Box で確定済みの実在地点）
export type NamedPlace = {
  name: string;
  location: LatLng;
  address?: string | null;
};

// 初日の出発時間帯（ユーザー選択・目安）。渋滞回避のため初日の過ごし方を変える。
// 目安時刻: morning≈9時 / afternoon≈13時 / evening≈19時。生成後は「ずらす機能」で微調整可。
export type DepartureTimeOfDay = 'morning' | 'afternoon' | 'evening';

// 旅程ドラフト生成の入力（ADR-0008）
export type GenerateDraftInput = {
  startLocation: NamedPlace; // 出発地（往復なら復路の終点も兼ねる）
  destinations: NamedPlace[]; // 目的地/経由地（順序付き・1件以上）
  numberOfNights: number; // 泊数（1以上）
  dailyDistanceKm: number; // 1日の走行距離の上限
  roundTrip: boolean; // 往復（既定 true）
  persona: PersonaType; // 車中泊の好み（診断結果または自己申告）
  carHeightOver21m?: boolean; // 車高2.1m超（種別除外に使用）
  carLengthOver5m?: boolean; // 全長5m超（種別除外に使用）
  departureTimeOfDay?: DepartureTimeOfDay; // 初日の出発時間帯（既定 afternoon）
  startDate?: string; // 開始日（ISO文字列、任意）
  title?: string; // タイトル（任意。未指定ならLLMが命名）
};

// コードが LLM に提示する泊地候補（実在スポットの部分集合）
export type CandidateSpot = {
  spotId: string;
  name: string;
  type: CampingSpotType;
  typeLabel: string;
  prefecture: string;
  isFree: boolean;
  pricePerNight?: number;
  hasPowerOutlet: boolean;
  hasRoof: boolean;
  isQuietArea: boolean;
  distanceFromTargetKm: number; // その日の目標地点からの直線距離
  location: LatLng;
  address?: string | null;
  url?: string | null;
  nearbyBath?: LatLng; // 泊地近傍の入浴施設座標（DB由来のグラウンディング用）
};

// LLM の構造化出力（tool use）
export type LlmActivity = {
  title: string;
  type: PlaceType;
  placeName: string | null; // 後段でジオコーディング。移動のみなら null
  description: string | null;
  startTime: string | null; // "HH:MM"
  endTime: string | null; // "HH:MM"
};

export type LlmDay = {
  chosenSpotId: string | null; // 必ずその日の候補idのいずれか。候補が無い日は null
  activities: LlmActivity[];
};

export type LlmDraftOutput = {
  title: string;
  description: string;
  days: LlmDay[];
};

// パイプラインの定数
export const DETOUR_FACTOR = 1.3; // 直線距離→走行距離の回り道係数
export const CORRIDOR_BUFFER_KM = 25; // 経路回廊のバッファ
export const CANDIDATES_PER_NIGHT = 6; // 1夜あたりLLMに見せる候補数（3〜8の中間）
export const FEASIBILITY_TOLERANCE = 1.15; // 実現可能性判定の許容倍率
