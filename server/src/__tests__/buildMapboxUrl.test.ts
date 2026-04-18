import { describe, test } from 'vitest';

describe('buildMapboxStaticUrl', () => {
  test.todo('returns URL string containing satellite-streets-v12 style');
  test.todo('bbox parameter includes 0.05-degree padding around route coordinate bounds');
  test.todo('polyline overlay is URL-encoded in the path segment');
  test.todo('coordinate swap: GeoJSON [lng, lat] pairs are reversed to [lat, lng] for polyline encoding');
  test.todo('downsamples route coordinates when LineString has more than 100 points');
});

describe('fetchMapboxThumbnail', () => {
  test.todo('returns a base64 data URI string starting with data:image/png;base64,');
  test.todo('throws an error when Mapbox API returns non-200 status');
});
