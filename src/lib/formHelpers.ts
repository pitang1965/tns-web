import React from 'react';
import { UseFormWatch } from 'react-hook-form';
import { ClientItineraryInput } from '@/data/schemas/itinerarySchema';
import { H3 } from '@/components/common/Typography';

// エラーメッセージを表示用に整形する関数
export const getErrorsForDisplay = (errors: any): Record<string, string> => {
  const result: Record<string, string> = {};

  const extractErrors = (obj: any, prefix = ''): void => {
    Object.keys(obj).forEach((key) => {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      const value = obj[key];

      if (!value) return;

      // メッセージプロパティがある場合
      if (typeof value === 'object' && value.message) {
        result[fullKey] = value.message;
      }
      // 文字列の場合
      else if (typeof value === 'string') {
        result[fullKey] = value;
      }
      // 配列の場合（dayPlansのような配列エラー）
      else if (Array.isArray(value)) {
        value.forEach((item, index) => {
          if (item && typeof item === 'object') {
            extractErrors(item, `${fullKey}[${index}]`);
          }
        });
      }
      // ネストしたオブジェクトの場合
      else if (typeof value === 'object') {
        extractErrors(value, fullKey);
      }
      // その他
      else {
        result[fullKey] = 'エラーがあります';
      }
    });
  };

  extractErrors(errors);
  return result;
};

// ページネーションヘッダーをレンダリングする関数
export const renderPaginationHeader = (
  currentIndex: number,
  watch: UseFormWatch<ClientItineraryInput>
): React.ReactElement => {
  const numberOfDays = watch('numberOfDays') || 0;
  return React.createElement(
    'div',
    { className: 'flex justify-between items-center mb-2' },
    React.createElement(H3, null, '日程詳細'),
    React.createElement(
      'span',
      { className: 'text-sm text-gray-500' },
      `${currentIndex + 1} / ${numberOfDays}日目`
    )
  );
};