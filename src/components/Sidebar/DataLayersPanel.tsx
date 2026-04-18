import { useAppStore } from '../../store/useAppStore';
import { DATA_LAYERS } from '../../config/dataLayers';

export function DataLayersPanel() {
  const activeDatalayerIds = useAppStore((s) => s.activeDatalayerIds);
  const toggleDataLayer = useAppStore((s) => s.toggleDataLayer);

  return (
    <div
      style={{
        position: 'absolute',
        top: '1rem',
        left: '1rem',
        bottom: '1rem',
        width: 320,
        zIndex: 10,
        backgroundColor: '#1C1B1B',
        borderRadius: '0.75rem',
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #2E3140' }}>
        <p
          style={{
            fontFamily: 'Manrope, sans-serif',
            fontSize: 13,
            fontWeight: 700,
            color: '#E5E2E1',
            margin: '0 0 4px',
          }}
        >
          Data Layers
        </p>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#6B7280', margin: 0 }}>
          Toggle Princeton NZA and REPEAT geospatial overlays
        </p>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {DATA_LAYERS.map((layer) => {
          const isActive = activeDatalayerIds.includes(layer.id);
          return (
            <div
              key={layer.id}
              style={{
                borderRadius: 8,
                border: `1px solid ${isActive ? layer.color + '66' : '#2E3140'}`,
                background: isActive ? `${layer.color}11` : 'rgba(255,255,255,0.02)',
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                cursor: 'pointer',
                transition: 'border-color 0.15s, background 0.15s',
              }}
              onClick={() => toggleDataLayer(layer.id)}
            >
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: layer.type === 'line' ? 2 : 4,
                  background: layer.color,
                  flexShrink: 0,
                  marginTop: 2,
                  opacity: isActive ? 1 : 0.4,
                }}
              />
              <div style={{ flex: 1 }}>
                <p
                  style={{
                    fontFamily: 'Manrope, sans-serif',
                    fontSize: 12,
                    fontWeight: 700,
                    color: isActive ? '#E5E2E1' : '#9BA3B5',
                    margin: '0 0 2px',
                  }}
                >
                  {layer.name}
                </p>
                <p
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: 10,
                    color: '#6B7280',
                    margin: 0,
                    lineHeight: 1.4,
                  }}
                >
                  {layer.description}
                </p>
              </div>
              <div
                style={{
                  width: 32,
                  height: 18,
                  borderRadius: 9,
                  background: isActive ? layer.color : '#2E3140',
                  flexShrink: 0,
                  position: 'relative',
                  transition: 'background 0.15s',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 3,
                    left: isActive ? 15 : 3,
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    background: 'white',
                    transition: 'left 0.15s',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          padding: '10px 16px',
          borderTop: '1px solid #2E3140',
          fontFamily: 'Inter, sans-serif',
          fontSize: 10,
          color: '#414755',
          textAlign: 'center',
        }}
      >
        Princeton NZA / REPEAT Project — illustrative data for demonstration purposes
      </div>
    </div>
  );
}
