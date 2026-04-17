import { useAppStore } from '../../store/useAppStore';
import { ChipToggle } from '../ui/ChipToggle';

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
};

export function RoutePrioritySection() {
  const priority = useAppStore((s) => s.priority);
  const setPriority = useAppStore((s) => s.setPriority);

  return (
    <div style={sectionStyle}>
      <p style={sectionHeaderStyle}>Route Priority</p>
      <div style={{ display: 'flex', flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        <ChipToggle
          label="Minimize Cost"
          selected={priority === 'cost'}
          onClick={() => setPriority('cost')}
        />
        <ChipToggle
          label="Minimize Risk"
          selected={priority === 'risk'}
          onClick={() => setPriority('risk')}
        />
      </div>
    </div>
  );
}
