import { PinPlacementSection } from './PinPlacementSection';
import { VoltageSection } from './VoltageSection';
import { RoutePrioritySection } from './RoutePrioritySection';
import { ConstraintsSection } from './ConstraintsSection';
import { OverlaysSection } from './OverlaysSection';

const sidebarStyle: React.CSSProperties = {
  position: 'absolute',
  top: '1rem',
  left: '1rem',
  bottom: '1rem',
  width: 320,
  backgroundColor: '#1C1B1B',
  borderRadius: '0.75rem',
  overflow: 'auto',
  zIndex: 10,
  display: 'flex',
  flexDirection: 'column',
};

const runButtonStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, #A7C8FF, #3291FF)',
  color: '#003061',
  border: 'none',
  borderRadius: '0.375rem',
  padding: '12px 16px',
  width: '100%',
  fontFamily: 'Manrope, sans-serif',
  fontSize: 14,
  fontWeight: 700,
  cursor: 'not-allowed',
  opacity: 0.4,
};

const statusLabelStyle: React.CSSProperties = {
  fontFamily: 'Inter, sans-serif',
  fontSize: 11,
  color: '#414755',
  textAlign: 'center',
  marginTop: 6,
};

export function Sidebar() {
  return (
    <div style={sidebarStyle}>
      <PinPlacementSection />
      <VoltageSection />
      <RoutePrioritySection />
      <ConstraintsSection />
      <OverlaysSection />
      <div style={{ padding: '16px 20px', marginTop: 'auto' }}>
        <button style={runButtonStyle} disabled>
          Run Simulation
        </button>
        <p style={statusLabelStyle}>Engine not available (Phase 1)</p>
      </div>
    </div>
  );
}
