import React from 'react';
import { ServerItineraryDocument } from '@/data/schemas/itinerarySchema';

type AddressType =
  ServerItineraryDocument['dayPlans'][number]['activities'][number]['place']['address'];

type AddressProps = {
  address: AddressType;
};

export const AddressView: React.FC<AddressProps> = ({ address }) => {
  const formatAddress = (addr: AddressType): string => {
    if (!addr) return '住所情報なし';

    const parts = [
      addr.postalCode ? `〒${addr.postalCode}` : null, // 郵便番号がある場合のみ「〒」を付加
      addr.prefecture,
      addr.city,
      addr.town,
      addr.block,
      addr.building,
    ].filter(Boolean); // nullや空の値を除外

    // 住所部分が一つもない場合は空文字列を返す
    return parts.length > 0 ? parts.join(' ') : '';
  };

  const formattedAddress = formatAddress(address);

  // 空文字列の場合は何も表示しない
  if (!formattedAddress) {
    return null;
  }

  return (
    <div className='text-sm text-gray-600 dark:text-gray-400'>
      {formattedAddress}
    </div>
  );
};
