import { formatDateWithWeekday } from '@/lib/date';

export type ShareData = {
  title: string;
  dayIndex: number;
  date?: string;
  id?: string;
};

/**
 * 共有用のデータを作成する
 */
export const createShareData = (shareData: ShareData) => {
  const { title, dayIndex, date, id } = shareData;

  // 日付をフォーマット（dateがundefinedの場合は空文字列を使用）
  const formattedDate = date ? formatDateWithWeekday(date) : '';

  // 共有データの作成
  const shareUrl = `https://tabi.over40web.club/itineraries/${id}?day=${dayIndex}`;
  const shareTitle = `${title} ${dayIndex}日目`;
  const shareText = `${formattedDate}の旅程です。`;

  return {
    title: shareTitle,
    text: shareText,
    url: shareUrl,
  };
};

/**
 * Web Share APIを使用して共有する
 */
export const shareWithWebAPI = async (shareData: ShareData) => {
  if (!shareData.id) return false;

  const { title, text, url } = createShareData(shareData);

  // Web Share APIが利用可能かチェック
  if (navigator.share) {
    try {
      await navigator.share({
        title,
        text,
        url,
      });
      return true;
    } catch (error) {
      // ユーザーがキャンセルした場合など
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Web Share API error:', error);
      }
      return false;
    }
  }

  return false;
};

/**
 * フォールバック共有機能（クリップボードコピー）
 */
export const shareWithClipboard = async (shareData: ShareData) => {
  if (!shareData.id) return false;

  const { title, text, url } = createShareData(shareData);
  const shareContent = `${title}\n${text}\n${url}`;

  try {
    await navigator.clipboard.writeText(shareContent);
    console.log('URLをクリップボードにコピーしました');
    return true;
  } catch (error) {
    console.error('Clipboard API error:', error);

    // 最終フォールバック：テキスト選択
    try {
      const textArea = document.createElement('textarea');
      textArea.value = shareContent;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      console.log('テキスト選択でコピーしました');
      return true;
    } catch (fallbackError) {
      console.error('Fallback copy error:', fallbackError);
      return false;
    }
  }
};

/**
 * メインの共有機能
 */
export const handleShare = async (shareData: ShareData) => {
  if (!shareData.id) return false;

  // Web Share APIを試す
  const webAPISuccess = await shareWithWebAPI(shareData);
  if (webAPISuccess) return true;

  // フォールバック：クリップボードコピー
  return await shareWithClipboard(shareData);
};
