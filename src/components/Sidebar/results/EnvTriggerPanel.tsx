import { useState } from 'react';
import { useAppStore } from '../../../store/useAppStore';

const ROUTE_LABELS: Record<string, string> = {
  A: 'Route A — Lowest Cost',
  B: 'Route B — Balanced',
  C: 'Route C — Lowest Regulatory Risk',
};

export function EnvTriggerPanel() {
  const triggers = useAppStore((s) => s.triggers);
  const recommendation = useAppStore((s) => s.recommendation);

  const defaultOpen = recommendation?.routeId ?? 'C';
  const [openRoute, setOpenRoute] = useState<string | null>(defaultOpen);

  if (!triggers || triggers.length === 0) return null;

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
        Environmental Triggers
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {triggers.map((routeTrigger) => {
          const isOpen = openRoute === routeTrigger.routeId;
          const isRecommended = recommendation?.routeId === routeTrigger.routeId;

          return (
            <div
              key={routeTrigger.routeId}
              style={{
                borderRadius: 8,
                border: `1px solid ${isRecommended ? '#E8B3FF44' : '#2E3140'}`,
                overflow: 'hidden',
              }}
            >
              <button
                onClick={() => setOpenRoute(isOpen ? null : routeTrigger.routeId)}
                style={{
                  width: '100%',
                  background: isOpen ? 'rgba(255,255,255,0.04)' : 'none',
                  border: 'none',
                  padding: '9px 12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  textAlign: 'left',
                }}
              >
                <div>
                  <span
                    style={{
                      fontFamily: 'Manrope, sans-serif',
                      fontSize: 12,
                      fontWeight: 700,
                      color: isRecommended ? '#E8B3FF' : '#E8ECF4',
                    }}
                  >
                    {ROUTE_LABELS[routeTrigger.routeId] ?? `Route ${routeTrigger.routeId}`}
                  </span>
                  {isRecommended && (
                    <span style={{ marginLeft: 6, fontSize: 10, color: '#E8B3FF' }}>★</span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: 10,
                      color: '#6B7280',
                    }}
                  >
                    {routeTrigger.triggers.length} triggers
                  </span>
                  <span style={{ color: '#6B7280', fontSize: 12 }}>{isOpen ? '▲' : '▼'}</span>
                </div>
              </button>
              {isOpen && (
                <div
                  style={{
                    borderTop: '1px solid #2E3140',
                    padding: '8px 12px 10px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}
                >
                  {routeTrigger.triggers.map((trigger, i) => (
                    <div key={i}>
                      <div
                        style={{
                          fontFamily: 'Manrope, sans-serif',
                          fontSize: 12,
                          fontWeight: 700,
                          color: '#E8ECF4',
                          marginBottom: 3,
                        }}
                      >
                        {trigger.statute}
                        {trigger.timelineMonths[0] === 0 && trigger.timelineMonths[1] === 0 ? (
                          <span
                            style={{
                              marginLeft: 6,
                              fontSize: 10,
                              color: '#4ADE80',
                              fontWeight: 400,
                            }}
                          >
                            Not triggered
                          </span>
                        ) : (
                          <span
                            style={{
                              marginLeft: 6,
                              fontSize: 10,
                              color: '#FACC15',
                              fontWeight: 400,
                              background: 'rgba(250,204,21,0.1)',
                              borderRadius: 4,
                              padding: '1px 6px',
                            }}
                          >
                            +{trigger.timelineMonths[0]}–{trigger.timelineMonths[1]} mo
                          </span>
                        )}
                      </div>
                      <p
                        style={{
                          margin: 0,
                          fontFamily: 'Inter, sans-serif',
                          fontSize: 11,
                          lineHeight: 1.6,
                          color: '#9BA3B5',
                        }}
                      >
                        {trigger.explanation}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
