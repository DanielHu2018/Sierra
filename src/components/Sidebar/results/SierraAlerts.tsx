import { useState, useEffect } from 'react';
import { useAppStore } from '../../../store/useAppStore';

export function SierraAlerts() {
  const alerts = useAppStore((s) => s.alerts);
  const focusedAlertId = useAppStore((s) => s.focusedAlertId);
  const [showSecondary, setShowSecondary] = useState(false);

  useEffect(() => {
    if (focusedAlertId !== null && focusedAlertId >= 0) setShowSecondary(true);
  }, [focusedAlertId]);

  if (!alerts) return null;

  return (
    <div style={{ padding: '16px 20px 0' }}>
      <div
        style={{
          fontFamily: 'Manrope, sans-serif',
          fontSize: 11,
          fontWeight: 700,
          color: '#F87171',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          marginBottom: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <span>⚠</span> Sierra Alerts
      </div>

      {/* Primary alert */}
      <div
        style={{
          borderRadius: 8,
          border: `1px solid ${focusedAlertId === -1 ? 'rgba(248,113,113,0.8)' : 'rgba(248,113,113,0.35)'}`,
          background: focusedAlertId === -1 ? 'rgba(248,113,113,0.12)' : 'rgba(248,113,113,0.07)',
          padding: '10px 12px',
          marginBottom: 6,
          transition: 'border-color 0.2s, background 0.2s',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            background: 'rgba(248,113,113,0.15)',
            borderRadius: 4,
            padding: '2px 8px',
            marginBottom: 8,
          }}
        >
          <span style={{ fontSize: 11 }}>⚠</span>
          <span
            style={{
              fontFamily: 'Manrope, sans-serif',
              fontSize: 10,
              fontWeight: 700,
              color: '#F87171',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}
          >
            Critical Risk Identified
          </span>
        </div>
        <p
          style={{
            margin: '0 0 8px',
            fontFamily: 'Inter, sans-serif',
            fontSize: 12,
            lineHeight: 1.6,
            color: '#E8ECF4',
          }}
        >
          {alerts.primary.text}
        </p>
        <div
          style={{
            display: 'inline-block',
            background: 'rgba(248,113,113,0.12)',
            borderRadius: 4,
            padding: '2px 8px',
            fontFamily: 'Inter, sans-serif',
            fontSize: 10,
            color: '#F87171',
          }}
        >
          📍 {alerts.primary.location}
        </div>
      </div>

      {/* Secondary alerts toggle */}
      {alerts.secondary.length > 0 && (
        <>
          <button
            onClick={() => setShowSecondary(!showSecondary)}
            style={{
              width: '100%',
              background: 'none',
              border: '1px solid #2E3140',
              borderRadius: 6,
              color: '#9BA3B5',
              fontFamily: 'Inter, sans-serif',
              fontSize: 11,
              padding: '6px 12px',
              cursor: 'pointer',
              marginBottom: showSecondary ? 6 : 0,
            }}
          >
            {showSecondary
              ? 'Hide additional risks'
              : `Show ${alerts.secondary.length} more risk${alerts.secondary.length > 1 ? 's' : ''}`}
          </button>
          {showSecondary &&
            alerts.secondary.map((alert, i) => (
              <div
                key={i}
                style={{
                  borderRadius: 8,
                  border: `1px solid ${focusedAlertId === i ? 'rgba(251,191,36,0.7)' : 'rgba(251,191,36,0.25)'}`,
                  background: focusedAlertId === i ? 'rgba(251,191,36,0.1)' : 'rgba(251,191,36,0.05)',
                  padding: '10px 12px',
                  marginBottom: 6,
                  transition: 'border-color 0.2s, background 0.2s',
                }}
              >
                <p
                  style={{
                    margin: '0 0 6px',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: 12,
                    lineHeight: 1.6,
                    color: '#E8ECF4',
                  }}
                >
                  {alert.text}
                </p>
                <div
                  style={{
                    display: 'inline-block',
                    background: 'rgba(251,191,36,0.1)',
                    borderRadius: 4,
                    padding: '2px 8px',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: 10,
                    color: '#FACC15',
                  }}
                >
                  📍 {alert.location}
                </div>
              </div>
            ))}
        </>
      )}
    </div>
  );
}
