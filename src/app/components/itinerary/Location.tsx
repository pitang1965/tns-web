import React from 'react';
import { ItineraryDocument } from '@/data/types/itinerary';
import Map from '@/components/Map';

type LocationType =
  ItineraryDocument['dayPlans'][number]['activities'][number]['place']['location'];

type LocationProps = {
  location: LocationType;
};

export const Location: React.FC<LocationProps> = ({ location }) => {
  if (!location) return '位置情報なし';
  return (
    <Map
      latitude={location.latitude}
      longitude={location.longitude}
      zoom={14}
    />
  );
};
