import { useEffect } from 'react';
import { useReasoningStream } from '../../hooks/useReasoningStream';
import { useAppStore } from '../../store/useAppStore';

interface StreamPanelProps {
  onComplete: () => void;
  onCancel: () => void;
}

export function StreamPanel({ onComplete, onCancel }: StreamPanelProps) {
  const { displayText, startStream, cancel } = useReasoningStream();

  const sourcePin = useAppStore((s) => s.sourcePin);
  const destinationPin = useAppStore((s) => s.destinationPin);
  const constraints = useAppStore((s) => s.constraints);
  const priority = useAppStore((s) => s.priority);

  useEffect(() => {
    if (!sourcePin || !destinationPin) return;

    const params = {
      source: JSON.stringify(sourcePin),
      dest: JSON.stringify(destinationPin),
      constraints: JSON.stringify({ ...constraints, priority }),
    };

    startStream(params, () => {
      // Stream done — brief pause then transition to results
      setTimeout(onComplete, 1500);
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentional: run once on mount

  const handleCancel = () => {
    cancel();
    onCancel();
  };

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: '16px 20px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Cancel button */}
      <button
        onClick={handleCancel}
        aria-label="Cancel simulation"
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          background: 'none',
          border: 'none',
          color: '#9BA3B5',
          cursor: 'pointer',
          fontSize: 18,
          lineHeight: 1,
          padding: '4px 8px',
          borderRadius: 4,
          zIndex: 10,
        }}
      >
        ×
      </button>

      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 4,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#A7C8FF',
              animation: 'pulse 1.5s infinite',
            }}
          />
          <span
            style={{
              fontFamily: 'Manrope, sans-serif',
              fontSize: 13,
              fontWeight: 700,
              color: '#A7C8FF',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}
          >
            Sierra Agent
          </span>
        </div>
        <div
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: 11,
            color: '#6B7280',
          }}
        >
          Evaluating constraint layers...
        </div>
      </div>

      {/* Typewriter output */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          fontFamily: '"Roboto Mono", "Courier New", monospace',
          fontSize: 12,
          lineHeight: 1.7,
          color: '#C1C6D7',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {displayText}
        {/* Blinking cursor */}
        <span
          style={{
            display: 'inline-block',
            width: 2,
            height: '1em',
            background: '#A7C8FF',
            verticalAlign: 'text-bottom',
            marginLeft: 2,
            animation: 'blink 1s step-end infinite',
          }}
        />
      </div>

      <style>{`
        @keyframes blink { 50% { opacity: 0; } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
      `}</style>
    </div>
  );
}
