import { useAppStore } from '../../store/useAppStore';

function formatPin(pin: [number, number] | null): string {
  if (!pin) return '';
  return `${pin[1].toFixed(4)}, ${pin[0].toFixed(4)}`;
}

export function PinPlacementSection() {
  const sourcePin = useAppStore((s) => s.sourcePin);
  const destinationPin = useAppStore((s) => s.destinationPin);

  const phase = !sourcePin ? 'source' : !destinationPin ? 'destination' : 'ready';

  const statusColors: Record<typeof phase, string> = {
    source: '#22c55e',
    destination: '#ef4444',
    ready: '#c8a45c',
  };

  const statusMessages: Record<typeof phase, string> = {
    source: 'Click map to place SOURCE pin',
    destination: 'Click map to place DESTINATION pin',
    ready: 'Both pins placed — ready to run simulation',
  };

  return (
    <div style={{ padding: '12px 20px' }}>
      <p
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          color: '#C1C6D7',
          marginBottom: 8,
        }}
      >
        Pin Placement
      </p>
      <div
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: `1px solid ${statusColors[phase]}55`,
          borderRadius: 6,
          padding: '8px 12px',
        }}
      >
        <p
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: 12,
            fontWeight: 600,
            color: statusColors[phase],
            margin: 0,
          }}
        >
          {statusMessages[phase]}
        </p>
        {sourcePin && (
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: '#6B7280', margin: '4px 0 0' }}>
            Source: {formatPin(sourcePin)}
          </p>
        )}
        {destinationPin && (
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: '#6B7280', margin: '2px 0 0' }}>
            Dest: {formatPin(destinationPin)}
          </p>
        )}
      </div>
    </div>
  );
}
