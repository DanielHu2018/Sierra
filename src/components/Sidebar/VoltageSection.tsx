import { useAppStore } from '../../store/useAppStore';
import { RadioGroup } from '../ui/RadioGroup';

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

const voltageOptions = [
  { value: '345kv-double', label: '345 kV Double Circuit' },
  { value: '500kv-hvdc', label: '500 kV HVDC' },
  { value: '230kv-single', label: '230 kV Single Circuit' },
];

export function VoltageSection() {
  const voltage = useAppStore((s) => s.voltage);
  const setVoltage = useAppStore((s) => s.setVoltage);

  return (
    <div style={sectionStyle}>
      <p style={sectionHeaderStyle}>Voltage</p>
      <RadioGroup
        name="voltage"
        options={voltageOptions}
        value={voltage}
        onChange={(v) => setVoltage(v as typeof voltage)}
      />
    </div>
  );
}
