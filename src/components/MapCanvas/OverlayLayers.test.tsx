import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { useAppStore } from '../../store/useAppStore';
import type { FrictionCache } from '../../types';

// Mock react-map-gl/mapbox
vi.mock('react-map-gl/mapbox', () => ({
  Source: ({ children, id }: { children: React.ReactNode; id: string }) => (
    <div data-testid={`source-${id}`}>{children}</div>
  ),
  Layer: ({ id }: { id: string }) => <div data-testid={`layer-${id}`} />,
}));

const mockFrictionCache: FrictionCache = {
  'node-1': { lat: 31.5, lng: -99.5, frictionScore: 0.2, justification: 'Low friction farmland' },
  'node-2': { lat: 32.0, lng: -98.8, frictionScore: 0.8, justification: 'High friction habitat' },
};

beforeEach(() => {
  useAppStore.setState({
    overlays: {
      ercotGrid: false,
      landBoundary: false,
      wildlifeHabitat: false,
      topography: false,
      frictionHeatmap: false,
    },
    frictionCache: null,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('OverlayLayers', () => {
  test('fetches friction_cache.json on mount and stores in Zustand frictionCache', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: () => Promise.resolve(mockFrictionCache),
    } as unknown as Response);
    vi.stubGlobal('fetch', fetchMock);

    const { OverlayLayers } = await import('./OverlayLayers');
    render(<OverlayLayers />);

    // Wait for fetch to resolve
    await vi.waitFor(() => {
      expect(useAppStore.getState().frictionCache).toEqual(mockFrictionCache);
    });
    expect(fetchMock).toHaveBeenCalledWith('/data/friction_cache.json');
  });

  test('silently skips if friction_cache.json fetch fails', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('Not found'));
    vi.stubGlobal('fetch', fetchMock);

    const { OverlayLayers } = await import('./OverlayLayers');
    // Should not throw
    expect(() => render(<OverlayLayers />)).not.toThrow();
  });

  test('renders heatmap source when friction data is loaded', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: () => Promise.resolve(mockFrictionCache),
    } as unknown as Response);
    vi.stubGlobal('fetch', fetchMock);

    const { OverlayLayers } = await import('./OverlayLayers');
    const { queryByTestId } = render(<OverlayLayers />);

    await vi.waitFor(() => {
      expect(queryByTestId('source-friction-heatmap-source')).toBeTruthy();
    });
  });

  test('heatmap layer visibility follows overlays.frictionHeatmap toggle', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: () => Promise.resolve(mockFrictionCache),
    } as unknown as Response);
    vi.stubGlobal('fetch', fetchMock);

    useAppStore.setState({
      overlays: {
        ercotGrid: false,
        landBoundary: false,
        wildlifeHabitat: false,
        topography: false,
        frictionHeatmap: true,
      },
    });

    const { OverlayLayers } = await import('./OverlayLayers');
    const { queryByTestId } = render(<OverlayLayers />);

    await vi.waitFor(() => {
      expect(queryByTestId('layer-friction-heatmap')).toBeTruthy();
    });
  });
});
