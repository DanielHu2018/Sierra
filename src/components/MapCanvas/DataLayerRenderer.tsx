import { Source, Layer } from 'react-map-gl/mapbox';
import { useAppStore } from '../../store/useAppStore';
import { DATA_LAYERS } from '../../config/dataLayers';

export function DataLayerRenderer() {
  const activeDatalayerIds = useAppStore((s) => s.activeDatalayerIds);

  const activeLayers = DATA_LAYERS.filter((l) => activeDatalayerIds.includes(l.id));

  return (
    <>
      {activeLayers.map((layer) => (
        <Source key={layer.id} id={layer.id} type="geojson" data={layer.sourceUrl}>
          {layer.type === 'fill' ? (
            <Layer
              id={`${layer.id}-fill`}
              type="fill"
              paint={{
                'fill-color': layer.color,
                'fill-opacity': layer.opacity,
              }}
            />
          ) : (
            <Layer
              id={`${layer.id}-line`}
              type="line"
              paint={{
                'line-color': layer.color,
                'line-opacity': layer.opacity,
                'line-width': 3,
                'line-dasharray': [4, 2],
              }}
            />
          )}
        </Source>
      ))}
    </>
  );
}
