import { useAppStore } from '../../store/useAppStore';
import { ToggleSwitch } from '../ui/ToggleSwitch';

const sectionHeaderStyle: React.CSSProperties = {
  fontFamily: 'Inter, sans-serif',
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  color: '#C1C6D7',
  marginBottom: 12,
};

const sectionStyle: React.CSSProperties = {
  padding: '16px 20px',
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
};

export function OverlaysSection() {
  const overlays = useAppStore((s) => s.overlays);
  const toggleOverlay = useAppStore((s) => s.toggleOverlay);

  return (
    <div style={sectionStyle}>
      <p style={sectionHeaderStyle}>Overlays</p>
      <ToggleSwitch
        label="ERCOT Grid"
        checked={overlays.ercotGrid}
        onChange={() => toggleOverlay('ercotGrid')}
      />
      <ToggleSwitch
        label="Land Boundary"
        checked={overlays.landBoundary}
        onChange={() => toggleOverlay('landBoundary')}
      />
      <ToggleSwitch
        label="Wildlife Habitat"
        checked={overlays.wildlifeHabitat}
        onChange={() => toggleOverlay('wildlifeHabitat')}
      />
      <ToggleSwitch
        label="Topography"
        checked={overlays.topography}
        onChange={() => toggleOverlay('topography')}
      />
      <ToggleSwitch
        label="Friction Heatmap"
        checked={overlays.frictionHeatmap}
        onChange={() => toggleOverlay('frictionHeatmap')}
      />
    </div>
  );
}
