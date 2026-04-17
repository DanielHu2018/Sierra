import '@testing-library/jest-dom';
import { vi } from 'vitest';

// URL.createObjectURL is not available in jsdom
Object.defineProperty(URL, 'createObjectURL', {
  writable: true,
  value: vi.fn(() => 'blob:mock'),
});

// ResizeObserver is used by mapbox-gl canvas sizing
(globalThis as unknown as Record<string, unknown>).ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
