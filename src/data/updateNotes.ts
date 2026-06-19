// 更新情報（更新カテゴリの定義は CONTEXT.md、設計判断は docs/adr/0004-update-notes-in-repo.md を参照）
//
// 運用ルール: ユーザーに関係する変更（新機能・不具合修正・その他変更）だけを、
// 一般ユーザー向けの平易な日本語で記述する。内部のリファクタリングや管理者専用の
// 変更は掲載しない。新しい変更は配列の先頭に、日付（YYYY-MM-DD）グループで追加する。

export type UpdateCategory = 'new' | 'fix' | 'other';

export type UpdateItem = {
  category: UpdateCategory;
  text: string;
  /** 関連ページへのリンク（任意。1項目につき1つまで） */
  href?: string;
  /** リンクの表示ラベル（省略時は「詳細」） */
  linkLabel?: string;
};

export type UpdateEntry = {
  /** YYYY-MM-DD。文字列比較がそのまま日付比較になるため比較キーにも使う */
  date: string;
  items: UpdateItem[];
};

export const updateCategoryLabel: Record<UpdateCategory, string> = {
  new: '新機能',
  fix: '不具合修正',
  other: 'その他変更',
};

// 新しい順（先頭が最新）に並べる
export const updateNotes: UpdateEntry[] = [
  {
    date: '2026-06-19',
    items: [
      {
        category: 'new',
        text: '更新情報(リリースノート)機能を追加しました。',
        href: '/updates',
        linkLabel: '更新情報',
      },
      {
        category: 'new',
        text: '退会（アカウント削除）ができるようになりました。',
        href: '/account',
        linkLabel: 'アカウント設定',
      },
      {
        category: 'other',
        text: '公開されている旅程（みんなの旅程）で、作成者を匿名のニックネームで表示するようにし、プライバシーを強化しました。',
        href: '/itineraries',
        linkLabel: '旅程一覧',
      },
    ],
  },
  {
    date: '2026-06-17',
    items: [
      {
        category: 'other',
        text: '車中泊スポットの登録数が1900件を突破しました。',
      },
    ],
  },
  {
    date: '2026-06-15',
    items: [
      {
        category: 'new',
        text: 'スマホのホーム画面にアプリとして追加できる案内を表示するようにしました。',
      },
    ],
  },
  {
    date: '2026-06-13',
    items: [
      {
        category: 'other',
        text: 'ログイン前のトップページのデザインと説明を見直し、より分かりやすくしました。',
      },
    ],
  },
  {
    date: '2026-06-10',
    items: [
      {
        category: 'new',
        text: 'スポット診断の結果から、条件に合う車中泊スポットの一覧へ直接移動できるようにしました。',
        href: '/shachu-haku/shindan',
        linkLabel: 'スポット診断',
      },
      {
        category: 'other',
        text: 'スポット診断の選択肢の説明文を、より分かりやすく改善しました。',
      },
    ],
  },
  {
    date: '2026-06-09',
    items: [
      {
        category: 'new',
        text: '旅程編集の「場所（検索）」で、場所や施設の名前を入力すると候補が表示される、オートコンプリート機能を追加しました。',
      },
    ],
  },
];

/** 最新の更新日（更新がなければ null）。未読バッジの比較に使う */
export const latestUpdateDate: string | null = updateNotes[0]?.date ?? null;
