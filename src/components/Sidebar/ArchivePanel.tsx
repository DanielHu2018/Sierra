import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import type { SimulationRun } from '../../types';

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

function formatPop(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  return `${(n / 1_000).toFixed(0)}K`;
}

function RunCard({ run }: { run: SimulationRun }) {
  const [expanded, setExpanded] = useState(false);
  const recommended = run.routes.find((r) => r.id === run.recommendedRouteId);

  return (
    <div
      style={{
        borderRadius: 8,
        border: '1px solid #2E3140',
        background: 'rgba(255,255,255,0.02)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{ padding: '10px 12px', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 10 }}
        onClick={() => setExpanded((x) => !x)}
      >
        <div style={{ flex: 1 }}>
          <p
            style={{
              fontFamily: 'Manrope, sans-serif',
              fontSize: 11,
              fontWeight: 700,
              color: '#9BA3B5',
              margin: '0 0 4px',
            }}
          >
            {formatDate(run.timestamp)}
          </p>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#C1C6D7', margin: '0 0 2px' }}>
            {run.sourcePinLabel} → {run.destPinLabel}
          </p>
          {run.recommendedRouteId && (
            <span
              style={{
                display: 'inline-block',
                background: `${recommended?.color ?? '#A7C8FF'}22`,
                border: `1px solid ${recommended?.color ?? '#A7C8FF'}66`,
                borderRadius: 4,
                padding: '1px 6px',
                fontFamily: 'Inter, sans-serif',
                fontSize: 10,
                color: recommended?.color ?? '#A7C8FF',
              }}
            >
              ★ {recommended?.label ?? `Route ${run.recommendedRouteId}`}
            </span>
          )}
        </div>
        <span style={{ color: '#6B7280', fontSize: 12 }}>{expanded ? '▲' : '▼'}</span>
      </div>

      {expanded && (
        <div style={{ borderTop: '1px solid #2E3140', padding: '8px 12px 10px' }}>
          {run.routes.map((route) => (
            <div key={route.id} style={{ marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: route.color }} />
                <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: 11, fontWeight: 700, color: '#E8ECF4' }}>
                  {route.label}
                </span>
              </div>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: '#6B7280', margin: '0 0 0 14px' }}>
                {route.metrics.distanceMiles} mi · 👥 {formatPop(route.populationServed)} served
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ArchivePanel() {
  const simulationHistory = useAppStore((s) => s.simulationHistory);

  return (
    <div
      style={{
        position: 'absolute',
        top: '1rem',
        left: '1rem',
        bottom: '1rem',
        width: 320,
        zIndex: 10,
        backgroundColor: '#1C1B1B',
        borderRadius: '0.75rem',
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #2E3140' }}>
        <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: 13, fontWeight: 700, color: '#E5E2E1', margin: '0 0 4px' }}>
          Archive
        </p>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#6B7280', margin: 0 }}>
          {simulationHistory.length} simulation{simulationHistory.length !== 1 ? 's' : ''} recorded this session
        </p>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {simulationHistory.length === 0 ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#414755', textAlign: 'center', margin: 0 }}>
              No simulations yet.
            </p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#3a3f4b', textAlign: 'center', margin: 0 }}>
              Run a simulation to see results here.
            </p>
          </div>
        ) : (
          simulationHistory.map((run) => <RunCard key={run.id} run={run} />)
        )}
      </div>
    </div>
  );
}
