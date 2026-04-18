import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { useAppStore } from '../../../store/useAppStore';

function profileCongestion(profile: string): number {
  if (profile === 'lowest-cost') return 40;
  if (profile === 'balanced') return 65;
  return 85; // lowest-risk
}

function avgFriction(route: { segmentJustifications: Array<{ frictionScore: number }> }): number {
  if (route.segmentJustifications.length === 0) return 0.5;
  const sum = route.segmentJustifications.reduce((acc, s) => acc + s.frictionScore, 0);
  return sum / route.segmentJustifications.length;
}

export function RadarChartPanel() {
  const routes = useAppStore((s) => s.routes);
  if (!routes || routes.length < 3) return null;

  const [a, b, c] = routes;

  // Normalize to 0-100 scale; higher = better
  const maxCapex = Math.max(a.metrics.estimatedCapexUSD, b.metrics.estimatedCapexUSD, c.metrics.estimatedCapexUSD);
  const maxPermit = Math.max(a.metrics.permittingMonths[1], b.metrics.permittingMonths[1], c.metrics.permittingMonths[1]);

  function costScore(r: typeof a) { return Math.round((1 - r.metrics.estimatedCapexUSD / maxCapex) * 100); }
  function permitScore(r: typeof a) { return Math.round((1 - r.metrics.permittingMonths[1] / maxPermit) * 100); }
  function riskScore(r: typeof a) { return Math.round((1 - avgFriction(r)) * 100); }

  const data = [
    { axis: 'Cost',              A: costScore(a),                  B: costScore(b),                  C: costScore(c) },
    { axis: 'Permitting',        A: permitScore(a),                B: permitScore(b),                C: permitScore(c) },
    { axis: 'Congestion Relief', A: profileCongestion(a.profile),  B: profileCongestion(b.profile),  C: profileCongestion(c.profile) },
    { axis: 'Regulatory Risk',   A: riskScore(a),                  B: riskScore(b),                  C: riskScore(c) },
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
          marginBottom: 8,
        }}
      >
        Route Comparison
      </div>
      <div style={{ width: '100%', minWidth: 0 }}>
        <ResponsiveContainer width="100%" height={190}>
          <RadarChart data={data} margin={{ top: 4, right: 16, bottom: 4, left: 16 }}>
            <PolarGrid stroke="#2E3140" />
            <PolarAngleAxis dataKey="axis" tick={{ fontSize: 10, fill: '#9BA3B5', fontFamily: 'Inter, sans-serif' }} />
            <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
            <Radar name="Route A" dataKey="A" stroke="#A7C8FF" fill="#A7C8FF" fillOpacity={0.35} />
            <Radar name="Route B" dataKey="B" stroke="#FFBC7C" fill="#FFBC7C" fillOpacity={0.35} />
            <Radar name="Route C" dataKey="C" stroke="#E8B3FF" fill="#E8B3FF" fillOpacity={0.35} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
