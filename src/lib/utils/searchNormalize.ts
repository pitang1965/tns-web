/**
 * 検索用文字列正規化ユーティリティ
 *
 * 日本語特有の表記揺れを吸収し、あいまい検索を実現する
 */

// 小書きカタカナと通常カタカナの対応表
const KANA_VARIANTS: Record<string, string[]> = {
  // 小書きカタカナ ↔ 通常カタカナ
  ヶ: ['ヶ', 'ケ', 'ヵ', 'カ', 'が', 'ヶ'], // 「駒ヶ岳」「駒ケ岳」
  ケ: ['ヶ', 'ケ', 'ヵ', 'カ'],
  ヵ: ['ヶ', 'ケ', 'ヵ', 'カ'],
  カ: ['ヶ', 'ケ', 'ヵ', 'カ'],
  ァ: ['ァ', 'ア'],
  ア: ['ァ', 'ア'],
  ィ: ['ィ', 'イ'],
  イ: ['ィ', 'イ'],
  ゥ: ['ゥ', 'ウ'],
  ウ: ['ゥ', 'ウ'],
  ェ: ['ェ', 'エ'],
  エ: ['ェ', 'エ'],
  ォ: ['ォ', 'オ'],
  オ: ['ォ', 'オ'],
  ッ: ['ッ', 'ツ'],
  ツ: ['ッ', 'ツ'],
  ャ: ['ャ', 'ヤ'],
  ヤ: ['ャ', 'ヤ'],
  ュ: ['ュ', 'ユ'],
  ユ: ['ュ', 'ユ'],
  ョ: ['ョ', 'ヨ'],
  ヨ: ['ョ', 'ヨ'],
  ヮ: ['ヮ', 'ワ'],
  ワ: ['ヮ', 'ワ'],
};

// 長音記号のバリエーション（文字クラス内でエスケープが必要な文字を含む）
const PROLONGED_SOUND_MARKS = ['ー', '－', '―', '‐', 'ｰ', '−'];
// 文字クラス用にエスケープされた長音記号パターン（-は末尾に配置）
const PROLONGED_SOUND_MARKS_CLASS = 'ー－―ｰ−‐';

/**
 * 全角スペースを半角スペースに変換
 */
export function normalizeSpaces(text: string): string {
  return text.replace(/\u3000/g, ' ');
}

/**
 * 全角英数字を半角に変換
 */
export function normalizeAlphanumeric(text: string): string {
  return text.replace(/[Ａ-Ｚａ-ｚ０-９]/g, (char) =>
    String.fromCharCode(char.charCodeAt(0) - 0xfee0)
  );
}

/**
 * 検索クエリを正規化（スペース分割前の前処理）
 */
export function normalizeSearchQuery(text: string): string {
  return normalizeAlphanumeric(normalizeSpaces(text)).trim();
}

/**
 * 検索キーワードを正規表現パターンに変換
 *
 * 日本語の表記揺れを吸収する正規表現を生成する
 * 例: 「駒ヶ岳」→ 「駒[ヶケヵカ]岳」
 */
export function keywordToFuzzyRegex(keyword: string): string {
  let pattern = '';

  for (const char of keyword) {
    // 正規表現のメタ文字をエスケープ
    const escaped = escapeRegexChar(char);

    // カナのバリエーションがある場合は文字クラスに展開
    if (KANA_VARIANTS[char]) {
      const variants = KANA_VARIANTS[char];
      pattern += `[${variants.join('')}]`;
    }
    // 長音記号の場合は全バリエーションにマッチ
    else if (PROLONGED_SOUND_MARKS.includes(char)) {
      pattern += `[${PROLONGED_SOUND_MARKS_CLASS}]`;
    }
    // それ以外はそのまま（エスケープ済み）
    else {
      pattern += escaped;
    }
  }

  return pattern;
}

/**
 * 正規表現のメタ文字をエスケープ（1文字用）
 */
function escapeRegexChar(char: string): string {
  // 正規表現で特別な意味を持つ文字をエスケープ
  const metaChars = /[.*+?^${}()|[\]\\]/;
  if (metaChars.test(char)) {
    return '\\' + char;
  }
  return char;
}

/**
 * 正規表現のメタ文字をエスケープ（文字列用）
 */
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 検索テキストをキーワード配列に分割し、各キーワードをあいまい検索用正規表現に変換
 *
 * @param searchTerm - 検索文字列
 * @returns あいまい検索用の正規表現パターン配列
 */
export function parseSearchTermToFuzzyPatterns(searchTerm: string): string[] {
  // 全角スペース・全角英数字を正規化
  const normalized = normalizeSearchQuery(searchTerm);

  // 空白文字で分割
  const keywords = normalized.split(/\s+/).filter((k) => k.length > 0);

  // 各キーワードをあいまい検索用正規表現に変換
  return keywords.map(keywordToFuzzyRegex);
}
