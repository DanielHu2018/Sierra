import { describe, it, expect } from 'vitest';
import type { RouteResult, AppState, RouteRecommendation, EnvironmentalTrigger, SierraAlert, ProjectSummary, FrictionCache } from './types';

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

  it('RouteRecommendation has routeId, rationale, timestamp', () => {
    const rec: RouteRecommendation = {
      routeId: 'C',
      rationale: 'Route C avoids sensitive habitat near the Balcones Escarpment. It follows existing utility corridors reducing ROW acquisition time. Regulatory risk is lowest among the three options.',
      timestamp: Date.now(),
    };
    expect(rec.routeId).toBe('C');
    expect(typeof rec.rationale).toBe('string');
    expect(typeof rec.timestamp).toBe('number');
  });

  it('EnvironmentalTrigger has routeId and triggers array', () => {
    const trigger: EnvironmentalTrigger = {
      routeId: 'A',
      triggers: [
        {
          statute: 'ESA Section 7',
          explanation: 'Potential habitat for Golden-cheeked Warbler requires Section 7 consultation.',
          timelineMonths: [6, 18],
        },
      ],
    };
    expect(trigger.routeId).toBe('A');
    expect(trigger.triggers).toHaveLength(1);
    expect(trigger.triggers[0].statute).toBe('ESA Section 7');
    expect(trigger.triggers[0].timelineMonths).toHaveLength(2);
  });

  it('SierraAlert has primary AlertItem and secondary array', () => {
    const alert: SierraAlert = {
      primary: { text: 'Karst formation detected near Barton Creek', location: 'Austin, TX' },
      secondary: [
        { text: 'Migratory bird flyway overlaps segment 3', location: 'San Marcos, TX' },
      ],
    };
    expect(alert.primary.text).toBeTruthy();
    expect(alert.primary.location).toBeTruthy();
    expect(Array.isArray(alert.secondary)).toBe(true);
  });

  it('ProjectSummary has phases array with estimatedMonths and keyDependency', () => {
    const summary: ProjectSummary = {
      phases: [
        { name: 'Desktop Screening', estimatedMonths: [1, 2], keyDependency: 'GIS data access' },
        { name: 'Environmental Review', estimatedMonths: [12, 24], keyDependency: 'Agency coordination' },
      ],
    };
    expect(summary.phases).toHaveLength(2);
    expect(summary.phases[0].estimatedMonths).toHaveLength(2);
    expect(typeof summary.phases[0].keyDependency).toBe('string');
  });

  it('FrictionCache is a record of FrictionNode values', () => {
    const cache: FrictionCache = {
      '31.5,-99.2': { lat: 31.5, lng: -99.2, frictionScore: 0.7, justification: 'Crosses protected habitat zone.' },
    };
    expect(cache['31.5,-99.2'].frictionScore).toBe(0.7);
    expect(typeof cache['31.5,-99.2'].justification).toBe('string');
  });
});
