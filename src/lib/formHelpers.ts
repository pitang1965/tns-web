import React from 'react';
import { UseFormWatch } from 'react-hook-form';
import { ClientItineraryInput } from '@/data/schemas/itinerarySchema';
import { H3 } from '@/components/common/Typography';

// エラーメッセージを表示用に整形する関数
export const getErrorsForDisplay = (errors: any): Record<string, string> => {
  const result: Record<string, string> = {};

  Object.keys(errors).forEach((key) => {
    if (errors[key]) {
      if (typeof errors[key] === 'object' && errors[key].message) {
        result[key] = errors[key].message;
      } else if (typeof errors[key] === 'string') {
        result[key] = errors[key];
      } else {
        result[key] = 'エラーがあります';
      }
    }
  });

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