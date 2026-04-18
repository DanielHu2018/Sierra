import { useAppStore } from '../../../store/useAppStore';

function formatNum(n: number, unit: string) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M ${unit}`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K ${unit}`;
  return `${n} ${unit}`;
}

function formatPop(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  return `${(n / 1_000).toFixed(0)}K`;
}

export function ImpactScorePanel() {
  const routes = useAppStore((s) => s.routes);
  const recommendation = useAppStore((s) => s.recommendation);

  if (!routes || routes.length === 0) return null;

  const metrics = [
    {
      icon: '👥',
      label: 'Population Served',
      getValue: (r: typeof routes[0]) => formatPop(r.populationServed),
    },
    {
      icon: '💼',
      label: 'Jobs Created',
      getValue: (r: typeof routes[0]) => formatNum(r.impactScore?.jobsCreated ?? 0, 'FTE'),
    },
    {
      icon: '🌿',
      label: 'CO₂ Reduced',
      getValue: (r: typeof routes[0]) => formatNum(r.impactScore?.emissionsReduced_tCO2 ?? 0, 't/yr'),
    },
    {
      icon: '❤️',
      label: 'Health Index',
      getValue: (r: typeof routes[0]) => `${r.impactScore?.healthImpactScore ?? 0}/100`,
    },
  ];

  return (
    <div style={{ padding: '16px 20px 0' }}>
      <div
        style={{
          fontFamily: 'Manrope, sans-serif',
          fontSize: 11,
          fontWeight: 700,
          color: '#9BA3B5',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          marginBottom: 10,
        }}
      >
        Impact Estimates
      </div>

      <div
        style={{
          borderRadius: 8,
          border: '1px solid #2E3140',
          overflow: 'hidden',
        }}
      >
        {/* Column headers */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr repeat(3, 64px)',
            padding: '6px 10px',
            borderBottom: '1px solid #2E3140',
          }}
        >
          <span />
          {routes.map((r) => (
            <span
              key={r.id}
              style={{
                fontFamily: 'Manrope, sans-serif',
                fontSize: 10,
                fontWeight: 700,
                color: recommendation?.routeId === r.id ? r.color : '#6B7280',
                textAlign: 'center',
              }}
            >
              {r.id}
            </span>
          ))}
        </div>

        {/* Metric rows */}
        {metrics.map((metric, idx) => (
          <div
            key={metric.label}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr repeat(3, 64px)',
              padding: '6px 10px',
              borderBottom: idx < metrics.length - 1 ? '1px solid #1C1B1B' : 'none',
              background: idx % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent',
            }}
          >
            <span
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: 10,
                color: '#9BA3B5',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              {metric.icon} {metric.label}
            </span>
            {routes.map((r) => (
              <span
                key={r.id}
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 10,
                  color: recommendation?.routeId === r.id ? '#E8ECF4' : '#6B7280',
                  fontWeight: recommendation?.routeId === r.id ? 600 : 400,
                  textAlign: 'center',
                }}
              >
                {metric.getValue(r)}
              </span>
            ))}
          </div>
        ))}
      </div>

      <p
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: 9,
          color: '#414755',
          margin: '6px 0 0',
          textAlign: 'center',
        }}
      >
        Illustrative estimates based on Princeton NZA coefficients
      </p>
    </div>
  );
}
