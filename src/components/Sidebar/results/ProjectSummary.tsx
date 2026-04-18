import { useAppStore } from '../../../store/useAppStore';

export function ProjectSummary() {
  const projectSummary = useAppStore((s) => s.projectSummary);

  if (!projectSummary) return null;

  const isTotal = (name: string) => name.toLowerCase().includes('total');

  return (
    <div style={{ padding: '16px 20px 20px' }}>
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
        Project Timeline
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {projectSummary.phases.map((phase, i) => {
          const total = isTotal(phase.name);
          return (
            <div
              key={i}
              style={{
                borderRadius: 6,
                background: total ? 'rgba(167,200,255,0.08)' : 'rgba(255,255,255,0.02)',
                border: total ? '1px solid rgba(167,200,255,0.2)' : '1px solid #2E3140',
                padding: '8px 12px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  marginBottom: 3,
                }}
              >
                <span
                  style={{
                    fontFamily: 'Manrope, sans-serif',
                    fontSize: total ? 13 : 12,
                    fontWeight: total ? 700 : 600,
                    color: total ? '#A7C8FF' : '#E8ECF4',
                  }}
                >
                  {phase.name}
                </span>
                <span
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: 11,
                    fontWeight: total ? 700 : 400,
                    color: total ? '#A7C8FF' : '#9BA3B5',
                    flexShrink: 0,
                    marginLeft: 8,
                  }}
                >
                  {phase.estimatedMonths[0]}–{phase.estimatedMonths[1]} mo
                </span>
              </div>
              <div
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 10,
                  color: '#6B7280',
                  lineHeight: 1.4,
                }}
              >
                {phase.keyDependency}
              </div>
            </div>
          );
        })}
      </div>
      <p
        style={{
          marginTop: 10,
          fontFamily: 'Inter, sans-serif',
          fontSize: 10,
          color: '#4B5563',
          lineHeight: 1.5,
          fontStyle: 'italic',
        }}
      >
        All timeline estimates are illustrative and provided for planning purposes only. Actual timelines depend on regulatory approvals, landowner cooperation, and prevailing market conditions.
      </p>
    </div>
  );
}
