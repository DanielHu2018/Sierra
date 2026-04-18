import { useAppStore } from '../../../store/useAppStore';
import { ToggleSwitch } from '../../ui/ToggleSwitch';

const sectionStyle: React.CSSProperties = {
  padding: '12px 20px',
  borderTop: '1px solid #2A2D3A',
  borderBottom: '1px solid #2A2D3A',
  marginBottom: 4,
};

const headerStyle: React.CSSProperties = {
  fontFamily: 'Inter, sans-serif',
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  color: '#C1C6D7',
  marginBottom: 10,
};

/**
 * Compact overlay toggle strip shown inside ResultsPanel so users can
 * toggle the friction heatmap (and other overlays) without resetting the
 * simulation back to idle state.
 */
export function OverlayControls() {
  const overlays = useAppStore((s) => s.overlays);
  const toggleOverlay = useAppStore((s) => s.toggleOverlay);

  return (
    <div style={sectionStyle}>
      <p style={headerStyle}>Map Overlays</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <ToggleSwitch
          label="Friction Heatmap"
          checked={overlays.frictionHeatmap}
          onChange={() => toggleOverlay('frictionHeatmap')}
        />
        <ToggleSwitch
          label="ERCOT Grid"
          checked={overlays.ercotGrid}
          onChange={() => toggleOverlay('ercotGrid')}
        />
        <ToggleSwitch
          label="Wildlife Habitat"
          checked={overlays.wildlifeHabitat}
          onChange={() => toggleOverlay('wildlifeHabitat')}
        />
      </div>
    </div>
  );
}
