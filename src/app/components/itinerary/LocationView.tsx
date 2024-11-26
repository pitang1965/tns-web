import React from 'react';
import { ServerItineraryDocument } from '@/data/schemas/itinerarySchema';
import Map from '@/components/Map';

type LocationType =
  ServerItineraryDocument['dayPlans'][number]['activities'][number]['place']['location'];

type LocationProps = {
  location: LocationType;
};

export const LocationView: React.FC<LocationProps> = ({ location }) => {
  if (!location) return '位置情報なし';
  return (
    <Map
      latitude={location.latitude}
      longitude={location.longitude}
      zoom={14}
    />
  );
};
