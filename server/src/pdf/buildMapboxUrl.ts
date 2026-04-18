import polyline from '@mapbox/polyline';
import type { LineString } from 'geojson';

/**
 * Build a Mapbox Static Images API URL for a route LineString.
 * Uses satellite-streets-v12 style with the route overlaid as a polyline path.
 *
 * IMPORTANT: @mapbox/polyline.encode() expects [lat, lng] pairs.
 * GeoJSON coordinates are [lng, lat] — must be swapped before encoding.
 *
 * Anti-pattern avoided: Do not pass raw GeoJSON coordinates — URL character limit is 8,192.
 * Polyline encoding is ~50% more compact. Downsample if still too long.
 */
export function buildMapboxStaticUrl(geometry: LineString, token: string): string {
  const coords = geometry.coordinates as [number, number][];

  // Downsample if route has many points to stay under URL character limit
  const sampled =
    coords.length > 100
      ? coords.filter((_, i) => i % 3 === 0 || i === coords.length - 1)
      : coords;

  // Compute bbox: [minLng, minLat, maxLng, maxLat] with padding
  const lngs = sampled.map((c) => c[0]);
  const lats = sampled.map((c) => c[1]);
  const pad = 0.05;
  const bbox = `[${Math.min(...lngs) - pad},${Math.min(...lats) - pad},${Math.max(...lngs) + pad},${Math.max(...lats) + pad}]`;

  // Swap to [lat, lng] for polyline encoding (GeoJSON is [lng, lat])
  const latLngPairs = sampled.map((c) => [c[1], c[0]] as [number, number]);
  const encoded = polyline.encode(latLngPairs);
  const pathOverlay = `path-3+A7C8FF(${encodeURIComponent(encoded)})`;

  return `https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/static/${pathOverlay}/${bbox}/800x500@2x?access_token=${token}`;
}

/**
 * Fetch a Mapbox Static Image as a base64 data URI.
 * Returns a data:image/png;base64,... string for embedding in HTML.
 * Throws on non-200 responses — caller should .catch(() => '') for graceful fallback.
 */
export async function fetchMapboxThumbnail(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Mapbox Static API error: ${res.status}`);
  }
  const buf = await res.arrayBuffer();
  const base64 = Buffer.from(buf).toString('base64');
  return `data:image/png;base64,${base64}`;
}
