interface ChipToggleProps {
  selected: boolean;
  onClick: () => void;
  label: string;
}

export function ChipToggle({ selected, onClick, label }: ChipToggleProps) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 16px',
        borderRadius: 9999,
        backgroundColor: selected ? '#c8a45c' : '#2A2A2A',
        color: selected ? '#0a0e09' : '#C1C6D7',
        border: `1px solid ${selected ? 'transparent' : '#414755'}`,
        fontFamily: 'Inter, sans-serif',
        fontSize: 11,
        letterSpacing: '0.05em',
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'background-color 0.15s, color 0.15s',
        textTransform: 'uppercase',
      }}
    >
      {label}
    </button>
  );
}
