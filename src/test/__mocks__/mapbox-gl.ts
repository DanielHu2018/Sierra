import { vi } from 'vitest';

const mapboxgl = {
  Map: vi.fn(() => ({
    on: vi.fn(),
    off: vi.fn(),
    remove: vi.fn(),
    addControl: vi.fn(),
    removeControl: vi.fn(),
    getCanvas: vi.fn(() => ({ style: {} })),
    flyTo: vi.fn(),
    fitBounds: vi.fn(),
    setPadding: vi.fn(),
    getSource: vi.fn(),
    addSource: vi.fn(),
    addLayer: vi.fn(),
    setLayoutProperty: vi.fn(),
    isStyleLoaded: vi.fn(() => true),
  })),
  Marker: vi.fn(() => ({
    setLngLat: vi.fn().mockReturnThis(),
    addTo: vi.fn().mockReturnThis(),
    remove: vi.fn(),
    getElement: vi.fn(() => document.createElement('div')),
  })),
  NavigationControl: vi.fn(),
  accessToken: '',
  supported: vi.fn(() => true),
};

export default mapboxgl;
