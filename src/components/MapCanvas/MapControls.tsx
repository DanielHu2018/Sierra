import { NavigationControl } from 'react-map-gl/mapbox';
import type { MapRef } from 'react-map-gl/mapbox';
import { useAppStore } from '../../store/useAppStore';

const SATELLITE_STYLE = 'mapbox://styles/mapbox/satellite-streets-v12';
const TERRAIN_STYLE = 'mapbox://styles/mapbox/outdoors-v12';

const TEXAS_CENTER: [number, number] = [-99.9018, 31.9686];
const TEXAS_ZOOM = 6;

interface MapControlsProps {
  mapRef: React.RefObject<MapRef | null>;
}

export function MapControls({ mapRef }: MapControlsProps) {
  const mapStyle = useAppStore((s) => s.mapStyle);
  const setMapStyle = useAppStore((s) => s.setMapStyle);

  const handleRecenter = () => {
    mapRef.current?.flyTo({ center: TEXAS_CENTER, zoom: TEXAS_ZOOM });
  };

  const handleStyleChange = (style: string) => {
    setMapStyle(style);
  };

  const activeBtn: React.CSSProperties = {
    color: '#c8a45c',
    background: 'rgba(200, 164, 92, 0.12)',
    borderRadius: '0.375rem',
  };

  const inactiveBtn: React.CSSProperties = {
    color: '#C1C6D7',
    borderRadius: '0.375rem',
    background: 'transparent',
  };

  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: '2rem',
    right: '1rem',
    background: 'rgba(28, 27, 27, 0.6)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderRadius: '0.75rem',
    padding: '0.75rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    minWidth: '120px',
  };

  const sectionLabelStyle: React.CSSProperties = {
    fontFamily: 'Inter, sans-serif',
    fontSize: '9px',
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#8B90A0',
    marginBottom: '2px',
  };

  const btnStyle: React.CSSProperties = {
    fontFamily: 'Inter, sans-serif',
    fontSize: '11px',
    fontWeight: 500,
    padding: '4px 10px',
    cursor: 'pointer',
    border: 'none',
    transition: 'background 0.15s, color 0.15s',
    textAlign: 'left' as const,
    width: '100%',
  };

  const dividerStyle: React.CSSProperties = {
    height: '1px',
    background: 'rgba(65, 71, 85, 0.5)',
    margin: '2px 0',
  };

  return (
    <div style={containerStyle}>
      {/* Navigation Controls */}
      <div>
        <div style={sectionLabelStyle}>Map</div>
        <NavigationControl showCompass={false} />
      </div>

      <div style={dividerStyle} />

      {/* Recenter */}
      <button
        style={{ ...btnStyle, ...(inactiveBtn) }}
        onClick={handleRecenter}
        title="Recenter to Texas"
      >
        Recenter
      </button>

      <div style={dividerStyle} />

      {/* Baselayer Switcher */}
      <div>
        <div style={sectionLabelStyle}>Baselayer</div>
        <button
          style={{ ...btnStyle, ...(mapStyle === SATELLITE_STYLE ? activeBtn : inactiveBtn) }}
          onClick={() => handleStyleChange(SATELLITE_STYLE)}
        >
          Satellite
        </button>
        <button
          style={{ ...btnStyle, ...(mapStyle === TERRAIN_STYLE ? activeBtn : inactiveBtn) }}
          onClick={() => handleStyleChange(TERRAIN_STYLE)}
        >
          Terrain
        </button>
      </div>
    </div>
  );
}
