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

export function ConstraintsSection() {
  const constraints = useAppStore((s) => s.constraints);
  const toggleConstraint = useAppStore((s) => s.toggleConstraint);

  return (
    <div style={sectionStyle}>
      <p style={sectionHeaderStyle}>Constraints</p>
      <ToggleSwitch
        label="Co-Location"
        checked={constraints.coLocation}
        onChange={() => toggleConstraint('coLocation')}
      />
      <ToggleSwitch
        label="Eminent Domain Avoidance"
        checked={constraints.eminentDomainAvoidance}
        onChange={() => toggleConstraint('eminentDomainAvoidance')}
      />
      <ToggleSwitch
        label="Ecology Avoidance"
        checked={constraints.ecologyAvoidance}
        onChange={() => toggleConstraint('ecologyAvoidance')}
      />
    </div>
  );
}
