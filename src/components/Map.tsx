'use client';
import { useState } from 'react';
import MapGL, { Marker } from 'react-map-gl';

import 'mapbox-gl/dist/mapbox-gl.css';

const Map = () => {
  const [viewState, setViewState] = useState({
    longitude: 139.7525, // 東京タワーの経度
    latitude: 35.6586, // 東京タワーの緯度
    zoom: 14,
  });

  return (
    <div style={{ height: '400px', width: '100%' }}>
      <MapGL
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
        mapStyle='mapbox://styles/mapbox/streets-v11'
      >
        <Marker longitude={139.7525} latitude={35.6586} color='red' />
      </MapGL>
    </div>
  );
}

export default Map;