import { useState } from 'react';
import { useAppStore } from '../../../store/useAppStore';

function formatPop(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  return `${(n / 1_000).toFixed(0)}K`;
}

function formatUSD(n: number) {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  return `$${(n / 1_000_000).toFixed(0)}M`;
}

export function RouteCards() {
  const routes = useAppStore((s) => s.routes);
  const selectedRoute = useAppStore((s) => s.selectedRoute);
  const recommendation = useAppStore((s) => s.recommendation);
  const setSelectedRoute = useAppStore((s) => s.setSelectedRoute);
  const [expanded, setExpanded] = useState<'A' | 'B' | 'C' | null>(recommendation?.routeId ?? 'C');

  if (!routes || routes.length === 0) return null;

  return (
    <div style={{ padding: '12px 20px 0' }}>
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
        Route Details
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {routes.map((route) => {
          const isSelected = selectedRoute === route.id;
          const isExpanded = expanded === route.id;
          const isRecommended = recommendation?.routeId === route.id;

          return (
            <div
              key={route.id}
              onClick={() => {
                setSelectedRoute(route.id);
                setExpanded(isExpanded ? null : route.id);
              }}
              style={{
                borderRadius: 8,
                border: `1px solid ${isSelected ? route.color : '#2E3140'}`,
                background: isSelected ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)',
                cursor: 'pointer',
                overflow: 'hidden',
                transition: 'border-color 0.15s',
              }}
            >
              {/* Compact header */}
              <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: route.color,
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontFamily: 'Manrope, sans-serif',
                      fontSize: 12,
                      fontWeight: 700,
                      color: isSelected ? route.color : '#E8ECF4',
                    }}
                  >
                    {route.label}
                    {isRecommended && (
                      <span style={{ marginLeft: 6, fontSize: 10, color: '#E8B3FF' }}>★ Recommended</span>
                    )}
                  </div>
                  <div
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: 11,
                      color: '#9BA3B5',
                      marginTop: 2,
                    }}
                  >
                    {route.metrics.distanceMiles} mi · {formatUSD(route.metrics.estimatedCapexUSD)} ·{' '}
                    {route.metrics.permittingMonths[0]}–{route.metrics.permittingMonths[1]} mo
                  </div>
                  {route.populationServed != null && (
                    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#4ade80', marginTop: 2 }}>
                      👥 {formatPop(route.populationServed)} served
                    </div>
                  )}
                </div>
                <div style={{ color: '#6B7280', fontSize: 12 }}>{isExpanded ? '▲' : '▼'}</div>
              </div>

              {/* Expanded section */}
              {isExpanded && route.segmentJustifications.length > 0 && (
                <div
                  style={{
                    borderTop: `1px solid ${route.color}33`,
                    padding: '8px 12px 10px',
                  }}
                >
                  <div
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: 10,
                      fontWeight: 600,
                      color: '#6B7280',
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      marginBottom: 6,
                    }}
                  >
                    Key Segment Notes
                  </div>
                  {route.segmentJustifications.slice(0, 3).map((seg) => (
                    <div
                      key={seg.segmentIndex}
                      style={{
                        marginBottom: 4,
                        fontFamily: 'Inter, sans-serif',
                        fontSize: 11,
                        color: '#C1C6D7',
                        lineHeight: 1.5,
                      }}
                    >
                      <span style={{ color: '#6B7280', marginRight: 4 }}>#{seg.segmentIndex + 1}</span>
                      {seg.justification}
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
