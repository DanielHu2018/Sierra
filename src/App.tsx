import { MapCanvas } from './components/MapCanvas/MapCanvas';
import { Sidebar } from './components/Sidebar/Sidebar';
import { TopNav } from './components/TopNav/TopNav';

export default function App() {
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
      {/* Full-screen map canvas — renders behind everything */}
      <MapCanvas />

      {/* Fixed top navigation bar */}
      <TopNav />

      {/* Floating sidebar HUD — positioned over map, below TopNav */}
      <Sidebar />
    </div>
  );
}
