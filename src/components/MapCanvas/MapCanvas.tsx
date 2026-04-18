import Map, { type MapRef } from 'react-map-gl/mapbox';
import { useRef, useCallback } from 'react';
import type { MapLayerMouseEvent } from 'mapbox-gl';
import { useAppStore } from '../../store/useAppStore';
import { PinMarkers } from './PinMarkers';
import { OverlayLayers } from './OverlayLayers';
import { RouteLayer } from './RouteLayer';
import { MapControls } from './MapControls';
import 'mapbox-gl/dist/mapbox-gl.css';

export function MapCanvas() {
  const mapRef = useRef<MapRef>(null);
  const sourcePin = useAppStore((s) => s.sourcePin);
  const destinationPin = useAppStore((s) => s.destinationPin);
  const mapStyle = useAppStore((s) => s.mapStyle);
  const routes = useAppStore((s) => s.routes);
  const setSourcePin = useAppStore((s) => s.setSourcePin);
  const setDestinationPin = useAppStore((s) => s.setDestinationPin);

  const handleClick = useCallback(
    (e: MapLayerMouseEvent) => {
      const { lng, lat } = e.lngLat;
      if (!sourcePin) {
        setSourcePin([lng, lat]);
        mapRef.current?.flyTo({ center: [lng, lat], zoom: 8 });
      } else if (!destinationPin) {
        setDestinationPin([lng, lat]);
        const bounds: [[number, number], [number, number]] = [
          [Math.min(sourcePin[0], lng), Math.min(sourcePin[1], lat)],
          [Math.max(sourcePin[0], lng), Math.max(sourcePin[1], lat)],
        ];
        mapRef.current?.fitBounds(bounds, { padding: 80 });
        // Offset for sidebar width (320px + gaps) to keep camera centered
        mapRef.current?.setPadding({ top: 0, bottom: 0, left: 336, right: 0 });
      }
    },
    [sourcePin, destinationPin, setSourcePin, setDestinationPin],
  );

  const interactiveLayerIds = routes?.map((r) => `route-line-${r.id}`) ?? [];

  return (
    <Map
      ref={mapRef}
      mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
      initialViewState={{ longitude: -99.9018, latitude: 31.9686, zoom: 6 }}
      mapStyle={mapStyle}
      style={{ width: '100vw', height: '100vh' }}
      onClick={handleClick}
      interactiveLayerIds={interactiveLayerIds}
    >
      <PinMarkers />
      <OverlayLayers />
      <RouteLayer />
      <MapControls mapRef={mapRef} />
    </Map>
  );
}
