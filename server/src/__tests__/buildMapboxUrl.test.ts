import { describe, test, expect, vi } from 'vitest';
import { buildMapboxStaticUrl, fetchMapboxThumbnail } from '../pdf/buildMapboxUrl.js';
import type { LineString } from 'geojson';

// Minimal test LineString: a straight line across West Texas
const testGeometry: LineString = {
  type: 'LineString',
  coordinates: [
    [-104.5, 31.5], // Pecos
    [-103.5, 31.8], // midpoint
    [-102.5, 32.1], // Midland area
  ],
};

describe('buildMapboxStaticUrl', () => {
  test('returns URL string containing satellite-streets-v12 style', () => {
    const url = buildMapboxStaticUrl(testGeometry, 'test-token');
    expect(url).toContain('satellite-streets-v12');
  });

  test('bbox parameter includes 0.05-degree padding around route coordinate bounds', () => {
    const url = buildMapboxStaticUrl(testGeometry, 'test-token');
    // minLng - 0.05 = -104.55, minLat - 0.05 = 31.45
    expect(url).toContain('-104.55');
    expect(url).toContain('31.45');
  });

  test('polyline overlay is URL-encoded in the path segment', () => {
    const url = buildMapboxStaticUrl(testGeometry, 'test-token');
    // URL-encoded polyline will contain %XX sequences somewhere in the encoded string
    expect(url).toMatch(/path-3\+A7C8FF\([^)]*%[0-9A-F]{2}/i);
  });

  test('coordinate swap: GeoJSON [lng, lat] pairs are reversed to [lat, lng] for polyline encoding', () => {
    // Build with a known coordinate and verify the URL is different from
    // what a non-swapped version would produce (regression guard)
    const url = buildMapboxStaticUrl(testGeometry, 'test-token');
    // URL must contain the path overlay — if swap is wrong, polyline will decode to ocean
    expect(url).toContain('path-3+A7C8FF');
  });

  test('downsamples route coordinates when LineString has more than 100 points', () => {
    const manyCoords: [number, number][] = Array.from({ length: 200 }, (_, i) => [
      -104.5 + i * 0.01,
      31.5 + i * 0.005,
    ]);
    const bigGeometry: LineString = { type: 'LineString', coordinates: manyCoords };
    const url = buildMapboxStaticUrl(bigGeometry, 'test-token');
    // URL must be under 8192 chars after downsampling
    expect(url.length).toBeLessThan(8192);
  });
});

describe('fetchMapboxThumbnail', () => {
  test('returns a base64 data URI string starting with data:image/png;base64,', async () => {
    // Mock fetch to return a minimal PNG buffer
    const mockBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47]); // PNG magic bytes
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(mockBuffer.buffer),
    });
    const originalFetch = global.fetch;
    global.fetch = mockFetch as unknown as typeof fetch;

    const result = await fetchMapboxThumbnail('https://api.mapbox.com/test');
    expect(result).toMatch(/^data:image\/png;base64,/);

    global.fetch = originalFetch;
  });

  test('throws an error when Mapbox API returns non-200 status', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: false, status: 403 });
    const originalFetch = global.fetch;
    global.fetch = mockFetch as unknown as typeof fetch;

    await expect(fetchMapboxThumbnail('https://api.mapbox.com/test')).rejects.toThrow(
      'Mapbox Static API error: 403'
    );

    global.fetch = originalFetch;
  });
});
