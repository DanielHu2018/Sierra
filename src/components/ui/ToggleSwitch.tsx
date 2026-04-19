interface ToggleSwitchProps {
  checked: boolean;
  onChange: () => void;
  label: string;
  disabled?: boolean;
}

export function ToggleSwitch({ checked, onChange, label, disabled = false }: ToggleSwitchProps) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      disabled={disabled}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        width: '100%',
        padding: '4px 0',
        cursor: disabled ? 'not-allowed' : 'pointer',
        background: 'transparent',
        border: 'none',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <div
        style={{
          width: 40,
          height: 22,
          borderRadius: 11,
          backgroundColor: checked ? '#c8a45c' : '#414755',
          boxShadow: checked ? '0 0 8px rgba(200,164,92,0.4)' : 'none',
          position: 'relative',
          transition: 'background-color 0.2s, box-shadow 0.2s',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 16,
            height: 16,
            borderRadius: '50%',
            backgroundColor: '#E5E2E1',
            position: 'absolute',
            top: 3,
            left: checked ? 21 : 3,
            transition: 'left 0.2s',
          }}
        />
      </div>
      <span style={{ color: '#C1C6D7', fontSize: 13, fontFamily: 'Inter, sans-serif' }}>
        {label}
      </span>
    </button>
  );
}
