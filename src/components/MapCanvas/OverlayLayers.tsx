import { useState, useEffect } from 'react';
import { Source, Layer } from 'react-map-gl/mapbox';
import type { LayerProps } from 'react-map-gl/mapbox';
import type * as GeoJSON from 'geojson';
import { useAppStore } from '../../store/useAppStore';
import type { FrictionCache } from '../../types';

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
  const setFrictionCache = useAppStore((s) => s.setFrictionCache);
  const [heatmapGeoJSON, setHeatmapGeoJSON] = useState<GeoJSON.FeatureCollection | null>(null);

  useEffect(() => {
    fetch('/data/friction_cache.json')
      .then((r) => r.json())
      .then((cache: FrictionCache) => {
        setFrictionCache(cache);
        const geojson: GeoJSON.FeatureCollection = {
          type: 'FeatureCollection',
          features: Object.entries(cache).map(([key, node]) => {
            const [lat, lng] = key.split('_').map(Number);
            return {
              type: 'Feature',
              geometry: { type: 'Point', coordinates: [lng, lat] },
              properties: { friction: node.frictionScore },
            };
          }),
        };
        setHeatmapGeoJSON(geojson);
      })
      .catch(() => {
        // friction_cache.json not yet available — Phase 2 pending; silently skip
      });
  }, [setFrictionCache]);

  const heatmapVisible: 'visible' | 'none' =
    overlays.frictionHeatmap && heatmapGeoJSON ? 'visible' : 'none';

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

      {/* Friction heatmap — loaded once at startup from friction_cache.json */}
      {heatmapGeoJSON && (
        <Source id="friction-heatmap-source" type="geojson" data={heatmapGeoJSON}>
          <Layer
            id="friction-heatmap"
            type="heatmap"
            layout={{ visibility: heatmapVisible }}
            paint={{
              'heatmap-weight': [
                'interpolate', ['linear'], ['get', 'friction'],
                0, 0,
                1, 1,
              ],
              'heatmap-intensity': [
                'interpolate', ['linear'], ['zoom'],
                5, 0.3,
                8, 0.7,
              ],
              'heatmap-color': [
                'interpolate',
                ['linear'],
                ['heatmap-density'],
                0,    'rgba(0,0,0,0)',
                0.2,  'rgba(50,145,255,0.35)',
                0.5,  'rgba(155,111,255,0.6)',
                1,    'rgba(255,68,68,0.88)',
              ],
              // radius scales exponentially with zoom so physical coverage stays constant
              // ~3× the grid spacing at default zoom (0.47–0.52° ≈ 21–23px at z6)
              'heatmap-radius': [
                'interpolate', ['exponential', 2], ['zoom'],
                5,  55,
                6,  80,
                7, 140,
                8, 260,
              ],
              'heatmap-opacity': 0.72,
            }}
          />
        </Source>
      )}
    </>
  );
}
