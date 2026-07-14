import React from 'react';
import { H3 } from '@/components/common/Typography';

// エラーメッセージを表示用に整形する関数
export const getErrorsForDisplay = (
  errors: unknown,
): Record<string, string> => {
  const result: Record<string, string> = {};

  const extractErrors = (obj: Record<string, unknown>, prefix = ''): void => {
    Object.keys(obj).forEach((key) => {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      const value = obj[key];

      if (!value) return;

      const message =
        typeof value === 'object' && 'message' in value
          ? (value as { message?: unknown }).message
          : undefined;

      // メッセージプロパティがある場合
      if (typeof value === 'object' && message) {
        result[fullKey] = message as string;
      }
      // 文字列の場合
      else if (typeof value === 'string') {
        result[fullKey] = value;
      }
      // 配列の場合（dayPlansのような配列エラー）
      else if (Array.isArray(value)) {
        value.forEach((item, index) => {
          if (item && typeof item === 'object') {
            extractErrors(item as Record<string, unknown>, `${fullKey}[${index}]`);
          }
        });
      }
      // ネストしたオブジェクトの場合
      else if (typeof value === 'object') {
        extractErrors(value as Record<string, unknown>, fullKey);
      }
      // その他
      else {
        result[fullKey] = 'エラーがあります';
      }
    });
  };

  extractErrors(errors as Record<string, unknown>);
  return result;
};

// ページネーションヘッダーをレンダリングする関数
export const renderPaginationHeader = (
  currentIndex: number,
  numberOfDays: number,
): React.ReactElement => {
  return React.createElement(
    'div',
    { className: 'flex justify-between items-center mb-2' },
    React.createElement(H3, null, '日程詳細'),
    React.createElement(
      'span',
      { className: 'text-sm text-gray-500' },
      `${currentIndex + 1} / ${numberOfDays}日目`,
    ),
  );
};
