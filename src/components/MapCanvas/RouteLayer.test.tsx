import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useAppStore } from '../../store/useAppStore';
import type { RouteResult } from '../../types';

// Mock react-map-gl/mapbox
vi.mock('react-map-gl/mapbox', () => ({
  Source: ({ children }: { children: React.ReactNode }) => <div data-testid="source">{children}</div>,
  Layer: ({ id, onClick, onMouseMove, onMouseLeave }: { id: string; onClick?: (e: unknown) => void; onMouseMove?: (e: unknown) => void; onMouseLeave?: () => void }) => (
    <div
      data-testid={`layer-${id}`}
      onClick={() => onClick?.({ features: [], point: { x: 10, y: 20 } })}
      onMouseMove={() => onMouseMove?.({ features: [], point: { x: 10, y: 20 } })}
      onMouseLeave={() => onMouseLeave?.()}
    />
  ),
}));

const mockRoute: RouteResult = {
  id: 'A',
  profile: 'lowest-cost',
  label: 'Lowest Cost',
  color: '#A7C8FF',
  geometry: {
    type: 'LineString',
    coordinates: [[-99, 31], [-98, 32]],
  },
  metrics: { distanceMiles: 100, estimatedCapexUSD: 5000000, permittingMonths: [6, 12] },
  segmentJustifications: [
    { segmentIndex: 0, frictionScore: 0.2, justification: 'Low friction area near farmland' },
    { segmentIndex: 1, frictionScore: 0.7, justification: 'High friction near habitat zone' },
  ],
  narrativeSummary: 'Fastest route through low-risk corridors',
};

beforeEach(() => {
  useAppStore.setState({
    routes: null,
    selectedRoute: null,
    frictionCache: null,
    simulationStatus: 'idle',
  });
});

describe('RouteLayer', () => {
  test('renders nothing when routes is null', async () => {
    const { RouteLayer } = await import('./RouteLayer');
    const { container } = render(<RouteLayer />);
    expect(container.firstChild).toBeNull();
  });

  test('renders a layer for each route when routes are set', async () => {
    const { RouteLayer } = await import('./RouteLayer');
    useAppStore.setState({ routes: [mockRoute] });
    render(<RouteLayer />);
    expect(screen.getByTestId('layer-route-line-A')).toBeTruthy();
  });

  test('clicking a route line calls setSelectedRoute with the route id', async () => {
    const { RouteLayer } = await import('./RouteLayer');
    useAppStore.setState({ routes: [mockRoute] });
    render(<RouteLayer />);
    const layer = screen.getByTestId('layer-route-line-A');
    layer.click();
    expect(useAppStore.getState().selectedRoute).toBe('A');
  });

  test('hover on route segment shows popup with justification text from pre-loaded data', async () => {
    const { RouteLayer } = await import('./RouteLayer');
    useAppStore.setState({ routes: [mockRoute] });
    render(<RouteLayer />);
    const layer = screen.getByTestId('layer-route-line-A');
    fireEvent.mouseMove(layer);
    // After mousemove, popup should be visible with justification text
    // The component uses react state, so the text should appear
    expect(screen.queryByText('Low friction area near farmland')).toBeTruthy();
  });

  test('justification text comes from segmentJustifications in Zustand store — not fetched on hover', async () => {
    const { RouteLayer } = await import('./RouteLayer');
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    useAppStore.setState({ routes: [mockRoute] });
    render(<RouteLayer />);
    const layer = screen.getByTestId('layer-route-line-A');
    fireEvent.mouseMove(layer);
    // No fetch should have been called for hover
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  test('mouse leave clears hover popup', async () => {
    const { RouteLayer } = await import('./RouteLayer');
    useAppStore.setState({ routes: [mockRoute] });
    render(<RouteLayer />);
    const layer = screen.getByTestId('layer-route-line-A');
    // Show popup
    fireEvent.mouseMove(layer);
    expect(screen.queryByText('Low friction area near farmland')).toBeTruthy();
    // Hide popup
    fireEvent.mouseLeave(layer);
    expect(screen.queryByText('Low friction area near farmland')).toBeNull();
  });
});
