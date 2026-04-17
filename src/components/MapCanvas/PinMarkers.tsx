import { Marker } from 'react-map-gl/mapbox';
import { useAppStore } from '../../store/useAppStore';
import './PinMarkers.css';

interface PinProps {
  coordinates: [number, number];
  label: string;
  bgColor: string;
  iconColor: string;
  pulseColor: string;
}

function Pin({ coordinates, label, bgColor, iconColor, pulseColor }: PinProps) {
  return (
    <Marker longitude={coordinates[0]} latitude={coordinates[1]} anchor="bottom">
      <div className="pin-marker">
        <div
          className="pin-pulse"
          style={{ backgroundColor: pulseColor }}
        />
        <div
          className="pin-icon"
          style={{ backgroundColor: bgColor }}
        >
          <span className="pin-icon-inner" style={{ color: iconColor }}>
            {label[0]}
          </span>
        </div>
        <div className="pin-label">{label}</div>
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
          bgColor="#A7C8FF"
          iconColor="#003061"
          pulseColor="rgba(213, 227, 255, 0.3)"
        />
      )}
      {destinationPin && (
        <Pin
          coordinates={destinationPin}
          label="Destination"
          bgColor="#A7C8FF"
          iconColor="#003061"
          pulseColor="rgba(213, 227, 255, 0.3)"
        />
      )}
    </>
  );
}
