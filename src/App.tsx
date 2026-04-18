import { MapCanvas } from './components/MapCanvas/MapCanvas';
import { Sidebar } from './components/Sidebar/Sidebar';
import { TopNav } from './components/TopNav/TopNav';
import { useAppStore } from './store/useAppStore';

const placeholderPanelStyle: React.CSSProperties = {
  position: 'absolute',
  top: 48,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: '#131313',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: 'column',
  gap: 12,
  color: '#414755',
  fontFamily: 'Inter, sans-serif',
};

const placeholderTitleStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: '#5a6070',
};

const placeholderSubStyle: React.CSSProperties = {
  fontSize: 11,
  color: '#3a3f4b',
  letterSpacing: '0.03em',
};

export default function App() {
  const activeTab = useAppStore((s) => s.activeTab);

  return (
    <div
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: '#131313',
      }}
    >
      {/* Fixed top navigation bar */}
      <TopNav />

      {activeTab === 'route-engine' && (
        <>
          {/* Full-screen map canvas — renders behind everything */}
          <MapCanvas />
          {/* Floating sidebar HUD — positioned over map, below TopNav */}
          <Sidebar />
        </>
      )}

      {activeTab === 'data-layers' && (
        <div style={placeholderPanelStyle}>
          <div style={placeholderTitleStyle}>Data Layers</div>
          <div style={placeholderSubStyle}>Coming soon — ERCOT grid, land boundary, and wildlife habitat overlays</div>
        </div>
      )}

      {activeTab === 'archive' && (
        <div style={placeholderPanelStyle}>
          <div style={placeholderTitleStyle}>Archive</div>
          <div style={placeholderSubStyle}>Coming soon — saved route analyses and export history</div>
        </div>
      )}
    </div>
  );
}
