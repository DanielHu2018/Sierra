import { Marker } from 'react-map-gl/mapbox';
import { useAppStore } from '../../store/useAppStore';
import './PinMarkers.css';

interface PinProps {
  coordinates: [number, number];
  label: string;
  bgColor: string;
  iconColor: string;
  pulseColor: string;
  onCancel: () => void;
}

function Pin({ coordinates, label, bgColor, iconColor, pulseColor, onCancel }: PinProps) {
  return (
    <Marker longitude={coordinates[0]} latitude={coordinates[1]} anchor="bottom">
      <div className="pin-marker">
        <div className="pin-pulse" style={{ backgroundColor: pulseColor }} />
        <div className="pin-icon" style={{ backgroundColor: bgColor }}>
          <span className="pin-icon-inner" style={{ color: iconColor }}>
            {label[0]}
          </span>
        </div>
        <div className="pin-label">{label}</div>
        <button
          className="pin-cancel"
          onClick={(e) => { e.stopPropagation(); onCancel(); }}
          aria-label={`Remove ${label} pin`}
        >
          ×
        </button>
      </div>
    </Marker>
  );
}

export function PinMarkers() {
  const sourcePin = useAppStore((s) => s.sourcePin);
  const destinationPin = useAppStore((s) => s.destinationPin);

  return (
    <>
      {sourcePin && (
        <Pin
          coordinates={sourcePin}
          label="Source"
          bgColor="#22c55e"
          iconColor="#052e16"
          pulseColor="rgba(34, 197, 94, 0.25)"
          onCancel={() => useAppStore.setState({ sourcePin: null })}
        />
      )}
      {destinationPin && (
        <Pin
          coordinates={destinationPin}
          label="Destination"
          bgColor="#ef4444"
          iconColor="#450a0a"
          pulseColor="rgba(239, 68, 68, 0.25)"
          onCancel={() => useAppStore.setState({ destinationPin: null })}
        />
      )}
    </>
  );
}
