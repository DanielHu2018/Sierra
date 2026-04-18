import { describe, test, expect, vi, beforeEach } from 'vitest';
import { CANNED_NARRATIVES } from '../data/canned-narrative.js';

describe('canned narrative fallback', () => {
  test('CANNED_NARRATIVES has entries for route A, B, and C', () => {
    expect(CANNED_NARRATIVES).toHaveProperty('A');
    expect(CANNED_NARRATIVES).toHaveProperty('B');
    expect(CANNED_NARRATIVES).toHaveProperty('C');
  });

  test('each canned narrative is a non-empty string', () => {
    for (const key of ['A', 'B', 'C'] as const) {
      expect(typeof CANNED_NARRATIVES[key]).toBe('string');
      expect(CANNED_NARRATIVES[key].length).toBeGreaterThan(0);
    }
  });

  test('each canned narrative contains at least one Texas location name', () => {
    const texasLocations = ['Reeves', 'Nolan', 'Edwards Aquifer', 'Pecos', 'US-385', 'Midland', 'Sutton', 'Edwards'];
    for (const key of ['A', 'B', 'C'] as const) {
      const narrative = CANNED_NARRATIVES[key];
      const hasLocation = texasLocations.some((loc) => narrative.includes(loc));
      expect(hasLocation, `Route ${key} narrative should reference at least one Texas location`).toBe(true);
    }
  });
});

// ─── POST /api/narrative endpoint unit tests ──────────────────────────────────
// Tests the route handler logic directly via mock req/res objects.
// The endpoint must: return { narrative: string } on success,
// and fall back silently to CANNED_NARRATIVES[routeId] on Claude API failure.

// Hoisted mock — must be declared before any imports for vi.mock hoisting to work
const mockCreate = vi.hoisted(() => vi.fn());

vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: { create: mockCreate },
  })),
}));

describe('POST /api/narrative endpoint handler', () => {
  let router: import('express').Router;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    const mod = await import('../routes/aiEndpoints.js');
    router = mod.default;
  });

  test('POST /api/narrative returns narrative string in response JSON', async () => {
    // Arrange: Claude returns a text response
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: 'This is a test narrative paragraph.' }],
    });

    // Find the /narrative route handler in the router stack
    const narrativeLayer = router.stack.find(
      (layer: { route?: { path: string; methods: Record<string, boolean> } }) =>
        layer.route?.path === '/narrative' && layer.route?.methods?.post,
    );
    expect(narrativeLayer, 'POST /narrative route should exist in router').toBeDefined();

    // Build minimal mock req/res
    let responsePayload: unknown;
    const req = {
      body: { routeId: 'A', routeLabel: 'Route A — Lowest Cost', constraints: { costRisk: 0 } },
    } as import('express').Request;
    const res = {
      json: vi.fn((payload) => { responsePayload = payload; }),
    } as unknown as import('express').Response;
    const next = vi.fn();

    // Act: invoke the route handler
    await narrativeLayer!.route!.stack[0].handle(req, res, next);

    // Assert
    expect(res.json).toHaveBeenCalledOnce();
    expect(responsePayload).toHaveProperty('narrative');
    expect(typeof (responsePayload as { narrative: string }).narrative).toBe('string');
    expect((responsePayload as { narrative: string }).narrative.length).toBeGreaterThan(0);
  });

  test('POST /api/narrative falls back to canned narrative when Claude API unavailable', async () => {
    // Arrange: Claude throws an error
    mockCreate.mockRejectedValueOnce(new Error('Claude API unavailable'));

    const narrativeLayer = router.stack.find(
      (layer: { route?: { path: string; methods: Record<string, boolean> } }) =>
        layer.route?.path === '/narrative' && layer.route?.methods?.post,
    );
    expect(narrativeLayer, 'POST /narrative route should exist in router').toBeDefined();

    let responsePayload: unknown;
    const req = {
      body: { routeId: 'B', routeLabel: 'Route B — Balanced', constraints: {} },
    } as import('express').Request;
    const res = {
      json: vi.fn((payload) => { responsePayload = payload; }),
    } as unknown as import('express').Response;
    const next = vi.fn();

    await narrativeLayer!.route!.stack[0].handle(req, res, next);

    expect(res.json).toHaveBeenCalledOnce();
    expect((responsePayload as { narrative: string }).narrative).toBe(CANNED_NARRATIVES['B']);
  });
});
