import { useState, useCallback } from 'react';
import { Source, Layer } from 'react-map-gl/mapbox';
import type { MapLayerMouseEvent } from 'mapbox-gl';
import { useAppStore } from '../../store/useAppStore';
import { HoverPopup } from '../ui/HoverPopup';

interface HoverState {
  x: number;
  y: number;
  justification: string;
  frictionScore: number;
}

export function RouteLayer() {
  const routes = useAppStore((s) => s.routes);
  const selectedRoute = useAppStore((s) => s.selectedRoute);
  const setSelectedRoute = useAppStore((s) => s.setSelectedRoute);
  const [hoverState, setHoverState] = useState<HoverState | null>(null);

  const handleMouseMove = useCallback(
    (e: MapLayerMouseEvent, routeId: 'A' | 'B' | 'C') => {
      const route = routes?.find((r) => r.id === routeId);
      if (!route) return;

      // Map click point to nearest segment index by checking rendered features
      const feature = e.features?.[0];
      const segIdx =
        typeof feature?.properties?.segmentIndex === 'number'
          ? feature.properties.segmentIndex
          : 0;

      const seg = route.segmentJustifications[segIdx] ?? route.segmentJustifications[0];
      if (!seg) return;

      setHoverState({
        x: e.point.x,
        y: e.point.y,
        justification: seg.justification,
        frictionScore: seg.frictionScore,
      });
    },
    [routes],
  );

  const handleMouseLeave = useCallback(() => setHoverState(null), []);

  const handleClick = useCallback(
    (_e: MapLayerMouseEvent, routeId: 'A' | 'B' | 'C') => {
      setSelectedRoute(routeId);
    },
    [setSelectedRoute],
  );

  if (!routes || routes.length === 0) return null;

  return (
    <>
      {routes.map((route) => {
        const isSelected = selectedRoute === null || selectedRoute === route.id;
        return (
          <Source
            key={route.id}
            id={`route-source-${route.id}`}
            type="geojson"
            data={route.geometry}
          >
            <Layer
              id={`route-line-${route.id}`}
              type="line"
              paint={{
                'line-color': route.color,
                'line-width': selectedRoute === route.id ? 4 : 2,
                'line-opacity': isSelected ? 1 : 0.35,
              }}
              layout={{ 'line-cap': 'round', 'line-join': 'round' }}
              onClick={(e) => handleClick(e as MapLayerMouseEvent, route.id)}
              onMouseMove={(e) => handleMouseMove(e as MapLayerMouseEvent, route.id)}
              onMouseLeave={handleMouseLeave}
            />
          </Source>
        );
      })}
      {hoverState && (
        <HoverPopup
          x={hoverState.x}
          y={hoverState.y}
          justification={hoverState.justification}
          frictionScore={hoverState.frictionScore}
        />
      )}
    </>
  );
}
