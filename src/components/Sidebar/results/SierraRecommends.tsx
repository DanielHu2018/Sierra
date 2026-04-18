import { useAppStore } from '../../../store/useAppStore';

export function SierraRecommends() {
  const recommendation = useAppStore((s) => s.recommendation);
  const routes = useAppStore((s) => s.routes);

  if (!recommendation) return null;

  const recommended = routes?.find((r) => r.id === recommendation.routeId);

  return (
    <div
      style={{
        margin: '16px 20px 0',
        borderRadius: 8,
        background: 'rgba(232, 179, 255, 0.08)',
        borderLeft: '3px solid #E8B3FF',
        padding: '12px 14px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginBottom: 8,
        }}
      >
        <span style={{ fontSize: 14 }}>★</span>
        <span
          style={{
            fontFamily: 'Manrope, sans-serif',
            fontSize: 12,
            fontWeight: 700,
            color: '#E8B3FF',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          Sierra Recommends
        </span>
      </div>
      <div
        style={{
          fontFamily: 'Manrope, sans-serif',
          fontSize: 13,
          fontWeight: 700,
          color: '#E8ECF4',
          marginBottom: 8,
        }}
      >
        {recommended?.label ?? `Route ${recommendation.routeId}`}
      </div>
      <p
        style={{
          margin: 0,
          fontFamily: 'Inter, sans-serif',
          fontSize: 12,
          lineHeight: 1.6,
          color: '#C1C6D7',
        }}
      >
        {recommendation.rationale}
      </p>
    </div>
  );
}
