import { QuestionDefinition } from '@/data/schemas/diagnosisSchema';

export const DIAGNOSIS_QUESTIONS: QuestionDefinition[] = [
  {
    id: 'carHeight',
    question: 'あなたの車高は2.1m以上ありますか？',
    description: '立体駐車場の高さ制限に影響します',
    options: [
      {
        value: 'under_2_1m',
        label: '2.1m未満',
        description: '普通乗用車、SUV、ミニバンなど',
      },
      {
        value: 'over_2_1m',
        label: '2.1m以上',
        description: 'ハイエース、キャンピングカーなど',
      },
      {
        value: 'unknown',
        label: 'わからない',
        description: '車検証で確認できます',
      },
    ],
  },
  {
    id: 'carLength',
    question: 'あなたの車の全長は5m以上ありますか？',
    description: '駐車スペースの選択に影響します',
    options: [
      {
        value: 'under_5m',
        label: '5m未満',
        description: '軽自動車〜普通車',
      },
      {
        value: 'over_5m',
        label: '5m以上',
        description: '大型SUV、キャンピングカーなど',
      },
      {
        value: 'unknown',
        label: 'わからない',
        description: '車検証で確認できます',
      },
    ],
  },
  {
    id: 'withPet',
    question: 'ペットと一緒に旅をしますか？',
    options: [
      {
        value: 'yes',
        label: 'はい',
        description: 'ペット同伴で車中泊',
      },
      {
        value: 'no',
        label: 'いいえ',
        description: 'ペットなし',
      },
    ],
  },
  {
    id: 'needPower',
    question: '外部電源は必要ですか？',
    description: 'スマホ充電、冷蔵庫、エアコンなど',
    options: [
      {
        value: 'required',
        label: '必要',
        description: 'ポータブル電源では足りない',
      },
      {
        value: 'nice_to_have',
        label: 'あれば嬉しい',
        description: 'ポータブル電源も併用',
      },
      {
        value: 'not_needed',
        label: '不要',
        description: 'ポータブル電源で十分',
      },
    ],
  },
  {
    id: 'toiletFrequency',
    question: '夜中にトイレに行く頻度は？',
    options: [
      {
        value: 'rarely',
        label: 'ほとんど行かない',
        description: '朝まで大丈夫',
      },
      {
        value: 'sometimes',
        label: '1回程度',
        description: '深夜に1回程度',
      },
      {
        value: 'often',
        label: '複数回',
        description: '何度も行く可能性がある',
      },
    ],
  },
  {
    id: 'drinkingPreference',
    question: 'お酒について教えてください',
    options: [
      {
        value: 'izakaya',
        label: '近くの居酒屋で飲みたい',
        description: '地元の味を楽しみたい',
      },
      {
        value: 'car_drinking',
        label: '車内で晩酌したい',
        description: '自分のペースで楽しむ',
      },
      {
        value: 'no_drink',
        label: '飲まない',
        description: 'お酒は飲まない',
      },
    ],
  },
  {
    id: 'environmentPreference',
    question: '周囲の環境はどれが好みですか？',
    options: [
      {
        value: 'crowded',
        label: '人が多い方が安心',
        description: '賑やかな場所が好き',
      },
      {
        value: 'quiet',
        label: '静かな場所がいい',
        description: '落ち着いて過ごしたい',
      },
      {
        value: 'isolated',
        label: '誰もいない場所',
        description: '自然の中で孤独を楽しむ',
      },
    ],
  },
  {
    id: 'mealStyle',
    question: '食事のスタイルは？',
    options: [
      {
        value: 'local_gourmet',
        label: '地元グルメを楽しみたい',
        description: 'ご当地の名物を食べたい',
      },
      {
        value: 'convenience',
        label: 'コンビニで十分',
        description: '手軽に済ませたい',
      },
      {
        value: 'self_cooking',
        label: '自炊派',
        description: '自分で料理したい',
      },
    ],
  },
  {
    id: 'bathPreference',
    question: '入浴についてはどうですか？',
    options: [
      {
        value: 'onsen',
        label: '温泉に入りたい',
        description: '旅先の温泉を楽しむ',
      },
      {
        value: 'shower',
        label: 'シャワーで十分',
        description: 'さっと汗を流したい',
      },
      {
        value: 'next_day',
        label: '翌日でOK',
        description: '入浴は後回し',
      },
    ],
  },
  {
    id: 'budgetPreference',
    question: '費用についてはどう考えますか？',
    options: [
      {
        value: 'free',
        label: '無料がいい',
        description: '出費を抑えたい',
      },
      {
        value: 'around_1000',
        label: '1000円程度なら',
        description: '適度な出費は許容',
      },
      {
        value: 'comfort_first',
        label: '快適さ優先',
        description: '多少の出費は気にしない',
      },
    ],
  },
];
