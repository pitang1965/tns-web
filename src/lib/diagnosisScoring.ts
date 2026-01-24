import {
  DiagnosisAnswer,
  DiagnosisResult,
  PersonaInfo,
  PersonaType,
  SpotRecommendation,
} from '@/data/schemas/diagnosisSchema';
import { CampingSpotTypeLabels, CampingSpotType } from '@/data/schemas/campingSpot';

// ペルソナ定義
export const PERSONAS: Record<PersonaType, PersonaInfo> = {
  machiyoru: {
    id: 'machiyoru',
    name: '街なか晩酌派',
    emoji: '🍺',
    description: '地元の居酒屋で一杯やってから車で寝る、大人の車中泊スタイル！',
    spotTypes: ['parking_lot', 'convenience_store', 'roadside_station'],
    badges: ['市街地', '飲食店近い', '24時間'],
  },
  onsen: {
    id: 'onsen',
    name: '温泉満喫派',
    emoji: '♨️',
    description: '温泉でゆっくりリラックスしてから眠りにつく、至福のひととき',
    spotTypes: ['onsen_facility', 'roadside_station', 'rv_park'],
    badges: ['温泉近い', 'トイレ近い', '入浴施設'],
  },
  outdoor: {
    id: 'outdoor',
    name: 'アウトドア派',
    emoji: '🏕️',
    description: '自然の中でのんびり過ごす、ワイルドな車中泊スタイル',
    spotTypes: ['auto_campground', 'rv_park', 'other'],
    badges: ['自然豊か', '静か', '広々'],
  },
  easy: {
    id: 'easy',
    name: 'お手軽派',
    emoji: '🚗',
    description: '手軽にサクッと車中泊。気軽に立ち寄れるのが魅力',
    spotTypes: ['sa_pa', 'roadside_station', 'convenience_store'],
    badges: ['24時間', 'トイレ近い', 'コンビニ近い'],
  },
  comfort: {
    id: 'comfort',
    name: '快適装備派',
    emoji: '🔌',
    description: '電源や設備が充実した環境で、快適な車中泊を楽しむ',
    spotTypes: ['rv_park', 'auto_campground', 'onsen_facility'],
    badges: ['電源あり', '水道あり', '設備充実'],
  },
  pet: {
    id: 'pet',
    name: 'ペット優先派',
    emoji: '🐕',
    description: '愛するペットと一緒に旅する、家族みんなの車中泊',
    spotTypes: ['auto_campground', 'rv_park', 'roadside_station'],
    badges: ['ペットOK', '広い', '自然豊か'],
  },
  cospa: {
    id: 'cospa',
    name: 'コスパ重視派',
    emoji: '💰',
    description: '無料や格安スポットを上手に活用する、賢い車中泊スタイル',
    spotTypes: ['roadside_station', 'sa_pa', 'parking_lot', 'other'],
    badges: ['無料', '24時間', 'トイレ近い'],
  },
  quiet: {
    id: 'quiet',
    name: '静寂派',
    emoji: '🌙',
    description: '静かな場所でゆっくり過ごしたい、穏やかな車中泊スタイル',
    spotTypes: ['auto_campground', 'other', 'rv_park'],
    badges: ['静か', '自然豊か', '人が少ない'],
  },
};

// ペルソナスコアリングマトリックス
type PersonaScoringMatrix = {
  [K in keyof DiagnosisAnswer]: {
    [value: string]: Partial<Record<PersonaType, number>>;
  };
};

const PERSONA_SCORING: PersonaScoringMatrix = {
  carHeight: {
    under_2_1m: { machiyoru: 5 },
    over_2_1m: { outdoor: 5, comfort: 3 },
    unknown: {},
  },
  carLength: {
    under_5m: { machiyoru: 3, easy: 3 },
    over_5m: { outdoor: 5, comfort: 5 },
    unknown: {},
  },
  withPet: {
    yes: { pet: 30, outdoor: 10 },
    no: {},
  },
  needPower: {
    required: { comfort: 25, outdoor: 5 },
    nice_to_have: { comfort: 10, easy: 5 },
    not_needed: { cospa: 5, easy: 5 },
  },
  toiletFrequency: {
    rarely: { outdoor: 5, quiet: 5 },
    sometimes: { easy: 10, onsen: 5 },
    often: { easy: 15, onsen: 10, comfort: 5 },
  },
  drinkingPreference: {
    izakaya: { machiyoru: 30, onsen: 10 },
    car_drinking: { outdoor: 10, quiet: 10, cospa: 5 },
    no_drink: { easy: 5 },
  },
  environmentPreference: {
    crowded: { easy: 15, machiyoru: 10 },
    quiet: { quiet: 20, onsen: 10, outdoor: 5 },
    isolated: { outdoor: 20, quiet: 15 },
  },
  mealStyle: {
    local_gourmet: { machiyoru: 15, onsen: 10, easy: 5 },
    convenience: { easy: 15, cospa: 10 },
    self_cooking: { outdoor: 20, comfort: 10 },
  },
  bathPreference: {
    onsen: { onsen: 30, comfort: 5 },
    shower: { comfort: 15, easy: 5 },
    next_day: { cospa: 10, outdoor: 5 },
  },
  budgetPreference: {
    free: { cospa: 25, easy: 10 },
    around_1000: { onsen: 10, comfort: 5 },
    comfort_first: { comfort: 20, onsen: 15, outdoor: 5 },
  },
  nightSafety: {
    managed: { machiyoru: 20, comfort: 15, easy: 15 },
    quiet_preferred: { quiet: 20, outdoor: 15 },
    not_concerned: {},
  },
};

// 診断用のスポットタイプラベル（CampingSpotTypeLabelsとは別に管理）
const DIAGNOSIS_SPOT_LABELS: Record<string, string> = {
  roadside_station: '道の駅・◯◯の駅',
  sa_pa: 'SA/PA',
  rv_park: 'RVパーク',
  auto_campground: 'オートキャンプ場',
  onsen_facility: '日帰り温泉施設',
  convenience_store: 'コンビニ',
  parking_lot: '都市型立体駐車場',
  other: 'その他（河川敷・簡易駐車スペース等）',
};

// スポットタイプ別のバッジ
const SPOT_BADGES: Record<string, string[]> = {
  roadside_station: ['トイレ近い', '地元グルメ', '産直市場'],
  sa_pa: ['24時間', 'トイレ近い', 'コンビニ近い'],
  rv_park: ['電源あり', '水道あり', '設備充実'],
  auto_campground: ['自然豊か', '広い', '設備充実'],
  onsen_facility: ['温泉', '入浴施設', 'リラックス'],
  convenience_store: ['24時間', '買い物便利', '市街地'],
  parking_lot: ['屋根あり', '24時間', '飲食店近い'],
  other: ['穴場', '静か', '自然豊か'],
};

// ペルソナスコア計算
export function calculatePersonaScores(
  answers: DiagnosisAnswer
): { persona: PersonaType; score: number }[] {
  const scores: Record<PersonaType, number> = {
    machiyoru: 0,
    onsen: 0,
    outdoor: 0,
    easy: 0,
    comfort: 0,
    pet: 0,
    cospa: 0,
    quiet: 0,
  };

  // 各回答に基づいてスコアを加算
  (Object.entries(answers) as [keyof DiagnosisAnswer, string][]).forEach(
    ([questionId, answer]) => {
      const questionScoring = PERSONA_SCORING[questionId];
      if (questionScoring && questionScoring[answer]) {
        Object.entries(questionScoring[answer]).forEach(([persona, points]) => {
          scores[persona as PersonaType] += points ?? 0;
        });
      }
    }
  );

  // スコア順にソート
  return Object.entries(scores)
    .map(([persona, score]) => ({
      persona: persona as PersonaType,
      score,
    }))
    .sort((a, b) => b.score - a.score);
}

// 除外されるスポットタイプを判定
function getExcludedSpotTypes(answers: DiagnosisAnswer): string[] {
  const excluded: string[] = [];

  // 車高2.1m以上の場合、立体駐車場を除外
  if (answers.carHeight === 'over_2_1m') {
    excluded.push('parking_lot');
  }

  // 全長5m以上の場合、立体駐車場とコンビニを除外
  if (answers.carLength === 'over_5m') {
    if (!excluded.includes('parking_lot')) {
      excluded.push('parking_lot');
    }
    excluded.push('convenience_store');
  }

  return excluded;
}

// おすすめスポットを取得
export function getRecommendedSpots(
  persona: PersonaInfo,
  excludedTypes: string[],
  answers: DiagnosisAnswer
): SpotRecommendation[] {
  // 全スポットタイプを取得
  const allSpotTypes = Object.keys(CampingSpotTypeLabels);

  // ペルソナのおすすめ順でスコアを付ける
  // ベーススコア: ペルソナ内なら100-90-80、ペルソナ外でも30（回答ボーナスで浮上可能）
  const spotScores = allSpotTypes.map((type) => {
    const personaIndex = persona.spotTypes.indexOf(type);
    let score = personaIndex >= 0 ? 100 - personaIndex * 10 : 30;

    // 立体駐車場への条件付きボーナス
    if (type === 'parking_lot') {
      // nightSafety が managed なら加点
      if (answers.nightSafety === 'managed') {
        score += 20;
      }

      // 管理重視 + 静かさ → 立体駐車場を優遇
      if (
        answers.nightSafety === 'managed' &&
        (answers.environmentPreference === 'quiet' ||
          answers.environmentPreference === 'crowded')
      ) {
        score += 25;
      }

      // 夜中トイレ頻度が高い場合も加点
      if (answers.toiletFrequency === 'often') {
        score += 15;
      }

      // 居酒屋派は立体駐車場と相性が良い（飲んで車に戻るスタイル）
      if (answers.drinkingPreference === 'izakaya') {
        score += 35;
      }
    }

    return { type, score };
  });

  // スコア順にソートし、除外されたものを除く
  const recommendations: SpotRecommendation[] = spotScores
    .sort((a, b) => b.score - a.score)
    .filter((item) => item.score > 0)
    .map((item, index) => ({
      type: item.type,
      label: DIAGNOSIS_SPOT_LABELS[item.type] || CampingSpotTypeLabels[item.type as CampingSpotType],
      rank: index + 1,
      badges: SPOT_BADGES[item.type] || [],
      excluded: excludedTypes.includes(item.type),
    }));

  return recommendations;
}

// 診断結果を計算
export function calculateDiagnosisResult(answers: DiagnosisAnswer): DiagnosisResult {
  // ペルソナスコアを計算
  const personaScores = calculatePersonaScores(answers);
  const topPersona = personaScores[0];

  // ペルソナ情報を取得
  const persona = PERSONAS[topPersona.persona];

  // 除外スポットを判定
  const excludedSpots = getExcludedSpotTypes(answers);

  // おすすめスポットを取得
  const recommendations = getRecommendedSpots(persona, excludedSpots, answers);

  return {
    persona,
    recommendations,
    excludedSpots,
  };
}
