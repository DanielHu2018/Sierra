import { describe, it, expect } from 'vitest';
import type { RouteResult, AppState } from './types';

describe('types contract', () => {
  it('RouteResult matches required shape', () => {
    const route: RouteResult = {
      id: 'A',
      profile: 'lowest-cost',
      label: 'Lowest Cost',
      color: '#A7C8FF',
      geometry: { type: 'LineString', coordinates: [[-99, 31], [-98, 32]] },
      metrics: {
        distanceMiles: 100,
        estimatedCapexUSD: 1000000,
        permittingMonths: [6, 12],
      },
      segmentJustifications: [
        { segmentIndex: 0, frictionScore: 0.3, justification: 'Low friction area' },
      ],
      narrativeSummary: 'A balanced route through central Texas.',
    };
    expect(route.id).toBe('A');
    expect(route.profile).toBe('lowest-cost');
    expect(route.metrics.permittingMonths).toHaveLength(2);
  });

  it('AppState matches required shape', () => {
    const state: AppState = {
      sourcePin: null,
      destinationPin: null,
      voltage: '345kv-double',
      priority: 'cost',
      constraints: { coLocation: false, eminentDomainAvoidance: false, ecologyAvoidance: false },
      overlays: { ercotGrid: false, landBoundary: false, wildlifeHabitat: false, topography: false, frictionHeatmap: false },
      routes: null,
      simulationStatus: 'idle',
    };
    expect(state.voltage).toBe('345kv-double');
    expect(state.simulationStatus).toBe('idle');
  });
});
