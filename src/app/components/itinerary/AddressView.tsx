import React from 'react';
import { ItineraryDocument } from '@/data/types/itinerary';

type AddressType =
  ItineraryDocument['dayPlans'][number]['activities'][number]['place']['address'];

type AddressProps = {
  address: AddressType;
};

export const AddressView: React.FC<AddressProps> = ({ address }) => {
  const formatAddress = (addr: AddressType): string => {
    if (!addr) return '住所情報なし';

    const parts = [
      `〒${addr.postalCode}`,
      addr.prefecture,
      addr.city,
      addr.town,
      addr.block,
      addr.building,
    ].filter(Boolean);
    return parts.join(' ');
  };

  return (
    <div className='text-sm text-gray-600 dark:text-gray-400'>
      {formatAddress(address)}
    </div>
  );
};
