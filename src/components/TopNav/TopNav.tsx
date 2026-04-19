import { useAppStore } from '../../store/useAppStore';
import { useExportPdf } from '../../hooks/useExportPdf';

const navStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  height: 48,
  zIndex: 20,
  backgroundColor: '#201F1F',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 20px',
};

const logoStyle: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  fontSize: 20,
  fontWeight: 600,
  color: '#c8a45c',
  letterSpacing: '0.22em',
};

const navItemsStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'row',
  gap: 24,
  alignItems: 'center',
};

const navItemStyle: React.CSSProperties = {
  fontFamily: 'Inter, sans-serif',
  fontSize: 11,
  fontWeight: 500,
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  color: '#C1C6D7',
  cursor: 'pointer',
  background: 'none',
  border: 'none',
  padding: 0,
};

const navItemActiveStyle: React.CSSProperties = {
  ...navItemStyle,
  color: '#E5E2E1',
};

const rightControlsStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'row',
  gap: 12,
  alignItems: 'center',
};

const iconButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#C1C6D7',
  cursor: 'pointer',
  fontSize: 16,
  padding: '4px 6px',
  lineHeight: 1,
};

const exportButtonBaseStyle: React.CSSProperties = {
  fontFamily: 'Inter, sans-serif',
  fontSize: 11,
  fontWeight: 500,
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  color: '#C1C6D7',
  background: 'transparent',
  border: '1px solid #414755',
  borderRadius: '0.25rem',
  padding: '5px 12px',
};

export function TopNav() {
  const exportPdf = useExportPdf();
  const simulationStatus = useAppStore((s) => s.simulationStatus);
  const activeTab = useAppStore((s) => s.activeTab);
  const setActiveTab = useAppStore((s) => s.setActiveTab);
  const resetSimulation = useAppStore((s) => s.resetSimulation);
  const isReady = simulationStatus === 'complete';

  return (
    <nav style={navStyle}>
      <a href="/" style={{ ...logoStyle, textDecoration: 'none' }}>SIERRA</a>
      <div style={navItemsStyle}>
        <button
          style={activeTab === 'route-engine' ? navItemActiveStyle : navItemStyle}
          onClick={() => setActiveTab('route-engine')}
        >
          Route Engine
        </button>
        <button
          style={activeTab === 'data-layers' ? navItemActiveStyle : navItemStyle}
          onClick={() => setActiveTab('data-layers')}
        >
          Data Layers
        </button>
        <button
          style={activeTab === 'archive' ? navItemActiveStyle : navItemStyle}
          onClick={() => setActiveTab('archive')}
        >
          Archive
        </button>
      </div>
      <div style={rightControlsStyle}>
        <button
          style={iconButtonStyle}
          aria-label="New simulation"
          title="New simulation"
          onClick={() => {
            if (simulationStatus === 'running') {
              if (!window.confirm('Cancel current simulation?')) return;
            }
            resetSimulation();
            setActiveTab('route-engine');
          }}
        >
          &#8635;
        </button>
        <button style={iconButtonStyle} aria-label="Notifications">
          &#128276;
        </button>
        <button style={iconButtonStyle} aria-label="Settings">
          &#9881;
        </button>
        <button
          style={{
            ...exportButtonBaseStyle,
            cursor: isReady ? 'pointer' : 'not-allowed',
            opacity: isReady ? 1 : 0.4,
          }}
          onClick={isReady ? exportPdf : undefined}
          disabled={!isReady}
        >
          Export PDF
        </button>
      </div>
    </nav>
  );
}
