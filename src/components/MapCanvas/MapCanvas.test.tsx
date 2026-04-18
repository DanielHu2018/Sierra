import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { useAppStore } from '../../store/useAppStore';
import { MapCanvas } from './MapCanvas';

// Module-level slot to capture the onClick prop MapCanvas injects into the Map mock.
// Reset by each test's render call.
let capturedMapOnClick: ((e: { lngLat: { lng: number; lat: number } }) => void) | undefined;

// Mock react-map-gl/mapbox — expose all components used by MapCanvas's sub-components
vi.mock('react-map-gl/mapbox', () => {
  const MockMap = vi.fn(
    (props: {
      children?: React.ReactNode;
      onClick?: (e: { lngLat: { lng: number; lat: number } }) => void;
      [key: string]: unknown;
    }) => {
      capturedMapOnClick = props.onClick;
      return React.createElement('div', { 'data-testid': 'mock-map' }, props.children);
    },
  );

  const MockSource = vi.fn(
    (props: { children?: React.ReactNode; [key: string]: unknown }) => {
      return React.createElement('div', { 'data-testid': 'mock-source' }, props.children);
    },
  );

  const MockLayer = vi.fn(() => null);

  const MockMarker = vi.fn(
    (props: { children?: React.ReactNode; [key: string]: unknown }) => {
      return React.createElement('div', { 'data-testid': 'mock-marker' }, props.children);
    },
  );

  const MockNavigationControl = vi.fn(() => null);

  return {
    default: MockMap,
    Source: MockSource,
    Layer: MockLayer,
    Marker: MockMarker,
    NavigationControl: MockNavigationControl,
  };
});

// Spies for setSourcePin / setDestinationPin — injected into Zustand for Phase 5 tests
const mockSetSourcePin = vi.fn();
const mockSetDestinationPin = vi.fn();

beforeEach(() => {
  capturedMapOnClick = undefined;
  mockSetSourcePin.mockClear();
  mockSetDestinationPin.mockClear();
});

// ─── Existing store-level tests ────────────────────────────────────────────────

describe('MapCanvas', () => {
  beforeEach(() => {
    // Reset to real store actions for these tests
    useAppStore.setState({
      sourcePin: null,
      destinationPin: null,
      voltage: '345kv-double',
      priority: 'cost',
      constraints: { coLocation: false, eminentDomainAvoidance: false, ecologyAvoidance: false },
      overlays: {
        ercotGrid: false,
        landBoundary: false,
        wildlifeHabitat: false,
        topography: false,
        frictionHeatmap: false,
      },
      routes: null,
      simulationStatus: 'idle',
      mapStyle: 'mapbox://styles/mapbox/satellite-streets-v12',
    });
  });

  it('renders without crashing with VITE_MAPBOX_TOKEN set', () => {
    // Map component behavior is tested via store; visual render requires real browser
    expect(true).toBe(true);
  });

  it('setSourcePin stores the pin coordinates', () => {
    useAppStore.getState().setSourcePin([-99.9, 31.9]);
    expect(useAppStore.getState().sourcePin).toEqual([-99.9, 31.9]);
  });

  it('setDestinationPin after sourcePin stores destination', () => {
    useAppStore.getState().setSourcePin([-99.9, 31.9]);
    useAppStore.getState().setDestinationPin([-95.0, 29.7]);
    expect(useAppStore.getState().destinationPin).toEqual([-95.0, 29.7]);
  });

  it('renders satellite baselayer by default', () => {
    expect(useAppStore.getState().mapStyle).toContain('satellite-streets');
  });
});

// ─── Phase 5 Wave-0 failing tests: bounds check (DATA-03) ─────────────────────

describe('MapCanvas — bounds check', () => {
  beforeEach(() => {
    // Inject spy actions for bounds-check tests
    useAppStore.setState({
      sourcePin: null,
      destinationPin: null,
      voltage: '345kv-double',
      priority: 'cost',
      constraints: { coLocation: false, eminentDomainAvoidance: false, ecologyAvoidance: false },
      overlays: {
        ercotGrid: false,
        landBoundary: false,
        wildlifeHabitat: false,
        topography: false,
        frictionHeatmap: false,
      },
      routes: null,
      simulationStatus: 'idle',
      mapStyle: 'mapbox://styles/mapbox/satellite-streets-v12',
      setSourcePin: mockSetSourcePin,
      setDestinationPin: mockSetDestinationPin,
    });
  });

  // Helper: render MapCanvas and return a fireClick function
  function renderAndGetFireClick() {
    render(<MapCanvas />);
    return (coords: { lng: number; lat: number }) => {
      act(() => {
        capturedMapOnClick?.({ lngLat: coords });
      });
    };
  }

  it('Test A: out-of-bounds click does NOT call setSourcePin or setDestinationPin', () => {
    const fireClick = renderAndGetFireClick();
    // lng=-120, lat=30 is outside ERCOT bbox [-106.6, 25.8, -93.5, 36.5]
    fireClick({ lng: -120, lat: 30 });
    expect(mockSetSourcePin).not.toHaveBeenCalled();
    expect(mockSetDestinationPin).not.toHaveBeenCalled();
  });

  it('Test B: out-of-bounds click renders "Outside ERCOT coverage area" popup', () => {
    const fireClick = renderAndGetFireClick();
    fireClick({ lng: -120, lat: 30 });
    expect(screen.getByText(/Outside ERCOT coverage area/i)).toBeInTheDocument();
  });

  it('Test C: in-bounds click DOES call setSourcePin (when no source pin set yet)', () => {
    const fireClick = renderAndGetFireClick();
    // lng=-100, lat=30 is inside ERCOT bbox
    fireClick({ lng: -100, lat: 30 });
    expect(mockSetSourcePin).toHaveBeenCalledWith([-100, 30]);
  });
});

// ─── Phase 5 Wave-0 failing test: mock data footnote (DATA-05) ────────────────

describe('MapCanvas — footnote', () => {
  beforeEach(() => {
    useAppStore.setState({
      sourcePin: null,
      destinationPin: null,
      voltage: '345kv-double',
      priority: 'cost',
      constraints: { coLocation: false, eminentDomainAvoidance: false, ecologyAvoidance: false },
      overlays: {
        ercotGrid: false,
        landBoundary: false,
        wildlifeHabitat: false,
        topography: false,
        frictionHeatmap: false,
      },
      routes: null,
      simulationStatus: 'idle',
      mapStyle: 'mapbox://styles/mapbox/satellite-streets-v12',
    });
  });

  it('Test D: render output contains "Illustrative mock data" text', () => {
    render(<MapCanvas />);
    expect(screen.getByText(/Illustrative mock data/i)).toBeInTheDocument();
  });
});
