import { CandidateSpot, GenerateDraftInput, PlaceType } from './types';
import { PERSONAS } from '@/lib/diagnosisScoring';

// placeSchema の type と同期した列挙（tool スキーマとプロンプトで共有）
export const PLACE_TYPES: PlaceType[] = [
  'HOME',
  'ATTRACTION',
  'RESTAURANT',
  'HOTEL',
  'PARKING_PAID_RV_PARK',
  'PARKING_PAID_OTHER',
  'PARKING_FREE_SERVICE_AREA',
  'PARKING_FREE_MICHINOEKI',
  'PARKING_FREE_OTHER',
  'GAS_STATION',
  'CONVENIENCE_SUPERMARKET',
  'BATHING_FACILITY',
  'COIN_LAUNDRY',
  'OTHER',
];

export function buildSystemPrompt(): string {
  return [
    'あなたは日本の車中泊旅（車旅）のプランナーです。',
    'ユーザーの希望と、システムが用意した「実在する車中泊スポットの候補」から、',
    '各日の旅程ドラフトを組み立てます。出力は必ずツール emit_itinerary_draft で返します。',
    '',
    '## 厳守するルール',
    '- 各日の泊地は、その日の候補リスト(candidates)の spotId の中から必ず1つ選び、chosenSpotId に設定する。',
    '- 候補リストに無いスポットを創作してはいけない。候補が空(空配列)の日は chosenSpotId を null にする。',
    '- 最終日は自宅（出発地）へ戻る日なので、泊地は選ばない（chosenSpotId は null）。',
    '- 日中の activities には、観光地・入浴施設・道の駅・食事・移動などを入れてよい。',
    '  - placeName は「地図で検索できる素の地名・施設名」だけを入れる（例: 「草津温泉」「湯畑」「道の駅よしおか温泉」）。',
    '    - 装飾や説明（「〜の立ち寄り湯」「〜（公共浴場）」「〜のレストラン」「〜周辺」など）を placeName に付けない。それらは title や description に書く。',
    '    - 単なる移動で場所が無いものは placeName を null にする。',
    '  - type は指定の列挙値から選ぶ（観光地=ATTRACTION、食事=RESTAURANT、入浴=BATHING_FACILITY 等）。',
    '- 泊地そのものは chosenSpotId で表すので、activities に泊地を重複して入れる必要はない。',
    '- startTime / endTime は "HH:MM" 形式、不要なら null。endTime は startTime より後にする。',
    '',
    '## 方針',
    '- 1日の走行距離の目安を尊重し、無理のない行程にする。',
    '- ユーザーの好み（ペルソナ）に合う候補を優先して選ぶ。',
    '- 温泉・道の駅・地元グルメなど、車旅ならではの楽しみを程よく織り込む。',
    '- description は簡潔な日本語で、その日の流れが分かるように書く。',
  ].join('\n');
}

export function buildUserContent(
  input: GenerateDraftInput,
  candidatesByDay: CandidateSpot[][],
  repairNote?: string,
): string {
  const numberOfDays = candidatesByDay.length;
  const persona = PERSONAS[input.persona];

  const waypoints = [
    `出発地: ${input.startLocation.name}`,
    ...input.destinations.map((d, i) => `目的地${i + 1}: ${d.name}`),
    input.roundTrip ? `帰着地: ${input.startLocation.name}（往復）` : '（片道）',
  ].join('\n');

  const dayBlocks = candidatesByDay
    .map((candidates, i) => {
      const isLast = i === numberOfDays - 1;
      const header = `### ${i + 1}日目${isLast ? '（最終日・帰着）' : ''}`;
      if (candidates.length === 0) {
        return `${header}\n候補: （なし。chosenSpotId は null にする）`;
      }
      const list = candidates
        .map((c) =>
          JSON.stringify({
            spotId: c.spotId,
            name: c.name,
            type: c.typeLabel,
            prefecture: c.prefecture,
            isFree: c.isFree,
            pricePerNight: c.pricePerNight ?? null,
            hasPowerOutlet: c.hasPowerOutlet,
            isQuietArea: c.isQuietArea,
            distanceFromTargetKm: c.distanceFromTargetKm,
          }),
        )
        .join('\n');
      return `${header}\n候補(この中から chosenSpotId を選ぶ):\n${list}`;
    })
    .join('\n\n');

  const parts = [
    '## 旅行条件',
    waypoints,
    `泊数: ${input.numberOfNights}泊${numberOfDays}日`,
    `1日の走行距離の目安: 約${input.dailyDistanceKm}km`,
    `好み（ペルソナ）: ${persona?.name ?? input.persona} — ${persona?.description ?? ''}`,
    input.startDate ? `開始日: ${input.startDate}` : '',
    '',
    '## 各日の泊地候補',
    dayBlocks,
    '',
    `上記を踏まえ、${numberOfDays}日分の旅程ドラフトを emit_itinerary_draft で出力してください。`,
    'days の要素数はちょうど' + numberOfDays + 'にしてください。',
  ];

  if (repairNote) {
    parts.push('', '## 修正指示', repairNote);
  }

  return parts.filter((p) => p !== '').join('\n');
}
