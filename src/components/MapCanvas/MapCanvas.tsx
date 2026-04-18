import Map, { Marker, Popup, type MapRef } from 'react-map-gl/mapbox';
import { useRef, useCallback, useState } from 'react';
import type { MapLayerMouseEvent } from 'mapbox-gl';
import { useAppStore } from '../../store/useAppStore';
import { PinMarkers } from './PinMarkers';
import { OverlayLayers } from './OverlayLayers';
import { RouteLayer } from './RouteLayer';
import { MapControls } from './MapControls';
import { DataLayerRenderer } from './DataLayerRenderer';
import 'mapbox-gl/dist/mapbox-gl.css';

const ERCOT_BOUNDS = { minLng: -106.6, minLat: 26.8, maxLng: -93.5, maxLat: 36.5 };

export function MapCanvas() {
  const mapRef = useRef<MapRef>(null);
  const sourcePin = useAppStore((s) => s.sourcePin);
  const destinationPin = useAppStore((s) => s.destinationPin);
  const mapStyle = useAppStore((s) => s.mapStyle);
  const routes = useAppStore((s) => s.routes);
  const overlays = useAppStore((s) => s.overlays);
  const setSourcePin = useAppStore((s) => s.setSourcePin);
  const setDestinationPin = useAppStore((s) => s.setDestinationPin);
  const alerts = useAppStore((s) => s.alerts);
  const setFocusedAlertId = useAppStore((s) => s.setFocusedAlertId);
  const setActiveTab = useAppStore((s) => s.setActiveTab);

  const [oobPopup, setOobPopup] = useState<{ lng: number; lat: number } | null>(null);
  const oobTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClick = useCallback(
    (e: MapLayerMouseEvent) => {
      const { lng, lat } = e.lngLat;
      const inBounds =
        lng >= ERCOT_BOUNDS.minLng && lng <= ERCOT_BOUNDS.maxLng &&
        lat >= ERCOT_BOUNDS.minLat && lat <= ERCOT_BOUNDS.maxLat;
      if (!inBounds) {
        if (oobTimerRef.current) clearTimeout(oobTimerRef.current);
        setOobPopup({ lng, lat });
        oobTimerRef.current = setTimeout(() => setOobPopup(null), 3000);
        return; // Zustand never touched
      }
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
      <DataLayerRenderer />
      <RouteLayer />
      <MapControls mapRef={mapRef} />
      {alerts?.primary.coords && (() => {
        const coords = alerts.primary.coords;
        return (
          <Marker
            longitude={coords.lng}
            latitude={coords.lat}
            anchor="center"
          >
            <button
              aria-label="Primary risk alert"
              onClick={() => {
                mapRef.current?.flyTo({ center: [coords.lng, coords.lat], zoom: 10 });
                setFocusedAlertId(-1);
                setActiveTab('route-engine');
              }}
              style={{
                background: 'rgba(239,68,68,0.9)',
                border: '2px solid #ef4444',
                borderRadius: '50%',
                width: 28,
                height: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: 14,
                boxShadow: '0 0 0 4px rgba(239,68,68,0.3)',
              }}
            >
              ⚠
            </button>
          </Marker>
        );
      })()}
      {alerts?.secondary.map((alert, i) =>
        alert.coords ? (() => {
          const coords = alert.coords;
          return (
            <Marker
              key={i}
              longitude={coords.lng}
              latitude={coords.lat}
              anchor="center"
            >
              <button
                aria-label={`Risk alert: ${alert.location}`}
                onClick={() => {
                  mapRef.current?.flyTo({ center: [coords.lng, coords.lat], zoom: 10 });
                  setFocusedAlertId(i);
                  setActiveTab('route-engine');
                }}
                style={{
                  background: 'rgba(251,191,36,0.85)',
                  border: '2px solid #fbbf24',
                  borderRadius: '50%',
                  width: 24,
                  height: 24,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: 12,
                }}
              >
                ⚠
              </button>
            </Marker>
          );
        })() : null,
      )}
      {oobPopup && (
        <Popup
          longitude={oobPopup.lng}
          latitude={oobPopup.lat}
          closeButton={false}
          closeOnClick={false}
          anchor="bottom"
          onClose={() => setOobPopup(null)}
        >
          <div style={{
            background: 'rgba(28,27,27,0.6)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '0.5rem',
            padding: '8px 12px',
            color: '#C1C6D7',
            fontFamily: 'Inter, sans-serif',
            fontSize: 12,
            whiteSpace: 'nowrap',
          }}>
            Outside ERCOT coverage area.
          </div>
        </Popup>
      )}
      <div
        style={{
          position: 'absolute',
          bottom: 30,
          left: 10,
          zIndex: 1,
          color: '#C1C6D7',
          fontFamily: 'Inter, sans-serif',
          fontSize: 10,
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        ⓘ Illustrative mock data — for demonstration purposes only.
      </div>
      {overlays.frictionHeatmap && (
        <div style={{
          position: 'absolute',
          bottom: 50,
          right: 10,
          zIndex: 1,
          background: 'rgba(28,27,27,0.6)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '0.375rem',
          padding: '6px 10px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          pointerEvents: 'none',
        }}>
          <span style={{ color: '#3291FF', fontSize: 10, fontFamily: 'Inter, sans-serif' }}>Low Friction</span>
          <div style={{ width: 48, height: 6, borderRadius: 3, background: 'linear-gradient(to right, #3291FF, #FF4444)' }} />
          <span style={{ color: '#FF4444', fontSize: 10, fontFamily: 'Inter, sans-serif' }}>High Friction</span>
        </div>
      )}
    </Map>
  );
}
