import React from 'react';
import { ServerItineraryDocument } from '@/data/schemas/itinerarySchema';
import Map from '@/components/common/Map';

type LocationType =
  ServerItineraryDocument['dayPlans'][number]['activities'][number]['place']['location'];

type LocationProps = {
  location: LocationType;
};

export const LocationView: React.FC<LocationProps> = ({ location }) => {
  if (
    !location ||
    location.latitude === undefined ||
    location.longitude === undefined
  ) {
    return;
  }
  return (
    <Map
      latitude={location.latitude}
      longitude={location.longitude}
      zoom={14}
    />
  );
};
