interface HoverPopupProps {
  x: number;
  y: number;
  justification: string;
  frictionScore: number;
}

export function HoverPopup({ x, y, justification, frictionScore }: HoverPopupProps) {
  const barColor = frictionScore < 0.33 ? '#4ADE80' : frictionScore < 0.66 ? '#FACC15' : '#F87171';

  return (
    <div
      style={{
        position: 'absolute',
        left: x + 12,
        top: y - 8,
        zIndex: 100,
        maxWidth: 280,
        padding: '10px 14px',
        borderRadius: 8,
        background: 'rgba(28, 27, 27, 0.88)',
        backdropFilter: 'blur(12px)',
        color: '#E8ECF4',
        fontFamily: 'Inter, sans-serif',
        fontSize: 12,
        lineHeight: 1.5,
        pointerEvents: 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 11, color: '#9BA3B5' }}>Friction score</span>
        <div style={{ flex: 1, height: 4, borderRadius: 2, background: '#2E3140' }}>
          <div
            style={{
              width: `${Math.round(frictionScore * 100)}%`,
              height: '100%',
              borderRadius: 2,
              background: barColor,
            }}
          />
        </div>
        <span style={{ fontSize: 11, color: barColor, fontWeight: 600 }}>
          {(frictionScore * 100).toFixed(0)}
        </span>
      </div>
      <p style={{ margin: 0, color: '#C1C6D7' }}>{justification}</p>
    </div>
  );
}
