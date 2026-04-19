interface RadioOption {
  value: string;
  label: string;
}

interface RadioGroupProps {
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
  name: string;
}

export function RadioGroup({ options, value, onChange, name }: RadioGroupProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {options.map((opt) => (
        <label
          key={opt.value}
          style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
        >
          <input
            type="radio"
            name={name}
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
            style={{
              position: 'absolute',
              width: 1,
              height: 1,
              padding: 0,
              margin: -1,
              overflow: 'hidden',
              clip: 'rect(0,0,0,0)',
              whiteSpace: 'nowrap',
              border: 0,
            }}
          />
          <div
            style={{
              width: 16,
              height: 16,
              borderRadius: '50%',
              border: `2px solid ${value === opt.value ? '#c8a45c' : '#414755'}`,
              backgroundColor: value === opt.value ? '#c8a45c' : 'transparent',
              flexShrink: 0,
              transition: 'background-color 0.15s, border-color 0.15s',
            }}
          />
          <span style={{ color: '#E5E2E1', fontSize: 13, fontFamily: 'Inter, sans-serif' }}>
            {opt.label}
          </span>
        </label>
      ))}
    </div>
  );
}
