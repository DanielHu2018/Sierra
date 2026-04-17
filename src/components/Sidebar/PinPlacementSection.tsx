import { useAppStore } from '../../store/useAppStore';

const sectionHeaderStyle: React.CSSProperties = {
  fontFamily: 'Inter, sans-serif',
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  color: '#C1C6D7',
  marginBottom: 12,
};

const sectionStyle: React.CSSProperties = {
  padding: '16px 20px',
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
};

const primaryButtonStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, #A7C8FF, #3291FF)',
  color: '#003061',
  border: 'none',
  borderRadius: '0.375rem',
  padding: '10px 16px',
  width: '100%',
  fontFamily: 'Inter, sans-serif',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  textAlign: 'left',
};

const secondaryButtonStyle: React.CSSProperties = {
  background: 'transparent',
  color: '#C1C6D7',
  border: '1px solid #414755',
  borderRadius: '0.375rem',
  padding: '10px 16px',
  width: '100%',
  fontFamily: 'Inter, sans-serif',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  textAlign: 'left',
};

const statusStyle: React.CSSProperties = {
  fontFamily: 'Inter, sans-serif',
  fontSize: 11,
  color: '#414755',
  marginTop: 2,
};

function formatPin(pin: [number, number] | null): string {
  if (!pin) return 'Not set';
  return `${pin[1].toFixed(4)}, ${pin[0].toFixed(4)}`;
}

export function PinPlacementSection() {
  const sourcePin = useAppStore((s) => s.sourcePin);
  const destinationPin = useAppStore((s) => s.destinationPin);
  const resetPins = useAppStore((s) => s.resetPins);

  return (
    <div style={sectionStyle}>
      <p style={sectionHeaderStyle}>Pin Placement</p>
      <div>
        <button style={primaryButtonStyle} onClick={() => resetPins()}>
          Drop Source Pin
        </button>
        <p style={statusStyle}>{formatPin(sourcePin)}</p>
      </div>
      <div>
        <button style={secondaryButtonStyle} onClick={() => {}}>
          Drop Destination Pin
        </button>
        <p style={statusStyle}>{formatPin(destinationPin)}</p>
      </div>
    </div>
  );
}
