import {
  CandidateSpot,
  DepartureTimeOfDay,
  GenerateDraftInput,
  PlaceType,
} from './types';
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

// 初日の出発時間帯の目安（ユーザー選択 → プロンプト誘導）。時刻は目安で、LLMが幅を持って組む。
const DEPARTURE_GUIDE: Record<DepartureTimeOfDay, string> = {
  morning: '朝（9時ごろ）',
  afternoon: '午後（13時ごろ）',
  evening: '夕方（19時ごろ）',
};

export function buildSystemPrompt(): string {
  return [
    'あなたは日本の車中泊旅（車旅）のプランナーです。',
    'ユーザーの希望と、システムが用意した「実在する車中泊スポットの候補」から、',
    '各日の旅程ドラフトを組み立てます。出力は必ずツール emit_itinerary_draft で返します。',
    '',
    '## 厳守するルール',
    '- 各日の泊地は、その日の候補リスト(candidates)の spotId の中から必ず1つ選び、chosenSpotId に設定する。',
    '- 候補リストに無いスポットを創作してはいけない。候補が空(空配列)の日は chosenSpotId を null にする。',
    '- 日程の構造（厳守）:',
    '  - 各日は「前夜の泊地から出発 → 日中の立ち寄り → その夜の泊地(chosenSpotId)に到着」で終わる。',
    '  - その日のアクティビティは地理的に自然な順序で並べる。前夜の泊地の近くから1日を始め、行って戻るような無駄な往復をしない（例: 泊地から遠く離れた地点を朝一番に置かない）。',
    '  - 帰路の途中にある立ち寄り（SA/道の駅など）は、その方向へ進む後半（泊地や観光を終えた後）に置く。朝一番や観光の前に、帰路上の遠い地点を置かない。',
    '  - 1日目は「（出発地名）を出発」を独立した先頭アクティビティにする。最初の目的地への到着と1つに畳み込まない（出発地のピンを別に立てるため）。',
    '  - 出発地への「帰着・帰宅・解散」は最終日にのみ、末尾に入れる。最終日より前の日に帰着・解散・出発地への立ち寄りを入れてはいけない（まだ旅の途中）。',
    '  - 最終日だけは泊地を選ばず（chosenSpotId は null）、日中の観光のあと「（出発地名）へ帰着」を末尾に入れて旅を終える。',
    '  - 出発・帰着の時刻は現実的に付ける。車中泊旅は「渋滞を避けて空いた時間帯に走る」のが本質なので、初日は午後〜夜の出発でもよく（深夜〜早朝の到着も可）、宿泊した翌朝は早くから観光でき、最終日は早めに帰宅する、といった時間配分にしてよい。',
    '- 日中の activities には、観光地・入浴施設・道の駅・食事・移動などを入れてよい。',
    '  - placeName は「地図で検索できる素の地名・施設名」だけを入れる（例: 「草津温泉」「湯畑」「道の駅よしおか温泉」）。',
    '    - 装飾や説明（「〜の立ち寄り湯」「〜（公共浴場）」「〜のレストラン」「〜周辺」など）を placeName に付けない。それらは title や description に書く。',
    '    - 単なる移動で場所が無いものは placeName を null にする。',
    '  - type は指定の列挙値から選ぶ（観光地=ATTRACTION、食事=RESTAURANT、入浴=BATHING_FACILITY 等）。',
    '  - HOME(自宅) は使わない。出発地が自宅とは限らないため、出発地は実在の場所として扱う。',
    '- 各日の泊地は chosenSpotId で選び、システムが「車中泊: ◯◯」を自動で日程末尾に追加する。',
    '  - したがって、その泊地での「到着」「立ち寄り」「移動」「入浴」「夜明かし」「宿泊」「泊まる」を表す日中アクティビティを別途入れないこと（重複の原因になる）。泊地は chosenSpotId だけで表す。',
    '  - 泊地に言及する場合（翌日の「◯◯を出発」など）は、その夜に選んだ chosenSpotId のスポット名を正確に使い、別の候補名を混同しない。',
    '- 「〜へ移動」だけの単独アクティビティは作らない。移動は前後のアクティビティの description に含める。',
    '- 立ち寄る実在の場所だけを placeName にする（「〜方面へ移動」のような移動表現を placeName にしない）。',
    '- startTime / endTime は "HH:MM" 形式、不要なら null。endTime は startTime より後にする。',
    '',
    '## 方針',
    '- 1日の走行距離の上限を尊重し、無理のない行程にする。中間日は上限より短くても構わない。',
    '- ユーザーの好み（ペルソナ）に合う候補を優先して選ぶ。',
    '- 温泉・道の駅・地元グルメなど、車旅ならではの楽しみを程よく織り込む。',
    '- ユーザー指定の目的地（観光地）は、その場所の性質・規模から一般的な滞在時間を見積もって startTime/endTime に反映する（画一的な時間に固定しない）。例: 大規模テーマパーク型施設・広い公園・温泉街=半日〜1日 / 博物館・資料館・水族館=1.5〜3時間 / 展望台・写真スポット・湯畑=0.5〜1時間 / 絶景ドライブ(スカイライン等)=走行込みで2〜3時間 / 入浴=1〜1.5時間。',
    '- 余裕を持ったゆったりした行程にする。主要な目的地は1日に1つを目安にし、複数の主要観光地を1日に詰め込まない。',
    '- 目的地が日数に対して少ない場合は、各目的地にたっぷり滞在時間をとり、近隣の軽い立ち寄り・休息・食事で無理なく埋める（無理に予定を増やさず、余白があってよい）。',
    '- 食事は昼(12時前後)・夜(19時前後)に約1時間を確保する。ただしその時間帯に観光地へ滞在中なら、別に食事アクティビティを作らず、その観光地の滞在時間に約1時間を上乗せする。',
    '- 各日の時間割は、移動時間と滞在時間で破綻しない現実的なものにする（詰め込みすぎず、余白を許容する）。',
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
    `1日の走行距離の上限: 約${input.dailyDistanceKm}km（中間日はこれより短くてよい）`,
    `好み（ペルソナ）: ${persona?.name ?? input.persona} — ${persona?.description ?? ''}`,
    `初日の出発: ${DEPARTURE_GUIDE[input.departureTimeOfDay ?? 'afternoon']}（目安。夕方発なら初日は観光を入れず移動主体に、朝発なら初日から観光を入れてよい）`,
    `高速道路: ${
      input.useExpressways === false
        ? '使わない（下道中心。同じ距離でも移動に時間がかかるため、1日の立ち寄りを詰め込みすぎず時刻に余裕を持たせる。description で下道・一般道の走行に触れてよい）'
        : '使う（高速道路で効率よく移動してよい。description で高速道路・SA/PA・ICに触れてよい）'
    }`,
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
