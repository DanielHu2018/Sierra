import { Source, Layer } from 'react-map-gl/mapbox';
import type { LayerProps } from 'react-map-gl/mapbox';
import { useAppStore } from '../../store/useAppStore';

// GeoJSON files are in public/data/ — reference by URL path (Vite public dir)
const ERCOT_GRID_URL = '/data/ercot-grid.geojson';
const LAND_BOUNDARY_URL = '/data/land-boundary.geojson';
const WILDLIFE_HABITAT_URL = '/data/wildlife-habitat.geojson';
const TOPOGRAPHY_URL = '/data/topography.geojson';

function visibilityProp(isVisible: boolean): 'visible' | 'none' {
  return isVisible ? 'visible' : 'none';
}

export function OverlayLayers() {
  const overlays = useAppStore((s) => s.overlays);
  // overlays.frictionHeatmap is acknowledged but renders nothing in Phase 1
  void overlays.frictionHeatmap;

  const ercotLayerProps: LayerProps = {
    id: 'ercot-grid',
    type: 'line',
    paint: {
      'line-color': '#A7C8FF',
      'line-width': 1.5,
    },
    layout: {
      visibility: visibilityProp(overlays.ercotGrid),
    },
  };

  const landFillLayerProps: LayerProps = {
    id: 'land-boundary-fill',
    type: 'fill',
    paint: {
      'fill-color': '#FFBC7C',
      'fill-opacity': 0.1,
    },
    layout: {
      visibility: visibilityProp(overlays.landBoundary),
    },
  };

  const landLineLayerProps: LayerProps = {
    id: 'land-boundary-line',
    type: 'line',
    paint: {
      'line-color': '#FFBC7C',
      'line-width': 1,
    },
    layout: {
      visibility: visibilityProp(overlays.landBoundary),
    },
  };

  const wildlifeLayerProps: LayerProps = {
    id: 'wildlife-habitat',
    type: 'fill',
    paint: {
      'fill-color': '#E8B3FF',
      'fill-opacity': 0.15,
    },
    layout: {
      visibility: visibilityProp(overlays.wildlifeHabitat),
    },
  };

  const topoLayerProps: LayerProps = {
    id: 'topography',
    type: 'line',
    paint: {
      'line-color': '#414755',
      'line-width': 1,
    },
    layout: {
      visibility: visibilityProp(overlays.topography),
    },
  };

  return (
    <>
      {/* ERCOT Grid — always mounted, visibility toggled via layout prop */}
      <Source id="ercot-grid-source" type="geojson" data={ERCOT_GRID_URL}>
        <Layer {...ercotLayerProps} />
      </Source>

      {/* Land Boundary — always mounted, fill + outline layers */}
      <Source id="land-boundary-source" type="geojson" data={LAND_BOUNDARY_URL}>
        <Layer {...landFillLayerProps} />
        <Layer {...landLineLayerProps} />
      </Source>

      {/* Wildlife Habitat — always mounted */}
      <Source id="wildlife-habitat-source" type="geojson" data={WILDLIFE_HABITAT_URL}>
        <Layer {...wildlifeLayerProps} />
      </Source>

      {/* Topography — always mounted */}
      <Source id="topography-source" type="geojson" data={TOPOGRAPHY_URL}>
        <Layer {...topoLayerProps} />
      </Source>

      {/* Phase 2: friction heatmap layer — data in friction_cache.json */}
    </>
  );
}
