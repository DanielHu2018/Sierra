import { MapCanvas } from './components/MapCanvas/MapCanvas';
import { Sidebar } from './components/Sidebar/Sidebar';
import { TopNav } from './components/TopNav/TopNav';
import { DataLayersPanel } from './components/Sidebar/DataLayersPanel';
import { ArchivePanel } from './components/Sidebar/ArchivePanel';
import { useAppStore } from './store/useAppStore';

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
      <TopNav />
      {/* Map always renders — data layer overlays need it to persist across tabs */}
      <MapCanvas />
      {activeTab === 'route-engine' && <Sidebar />}
      {activeTab === 'data-layers' && <DataLayersPanel />}
      {activeTab === 'archive' && <ArchivePanel />}
    </div>
  );
}
