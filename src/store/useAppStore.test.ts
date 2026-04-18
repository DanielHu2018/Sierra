import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from './useAppStore';
import type { RouteRecommendation, EnvironmentalTrigger, SierraAlert, ProjectSummary, FrictionCache } from '../types';

// Reset store before each test to isolate state
beforeEach(() => {
  useAppStore.setState({
    sourcePin: null,
    destinationPin: null,
    voltage: '345kv-double',
    priority: 'cost',
    constraints: { coLocation: false, eminentDomainAvoidance: false, ecologyAvoidance: false },
    overlays: { ercotGrid: false, landBoundary: false, wildlifeHabitat: false, topography: false, frictionHeatmap: false },
    routes: null,
    simulationStatus: 'idle',
  });
});

describe('useAppStore', () => {
  it('setSourcePin sets sourcePin in state', () => {
    useAppStore.getState().setSourcePin([-99.9, 31.9]);
    expect(useAppStore.getState().sourcePin).toEqual([-99.9, 31.9]);
  });

  it('setDestinationPin sets destinationPin in state', () => {
    useAppStore.getState().setDestinationPin([-95.0, 29.7]);
    expect(useAppStore.getState().destinationPin).toEqual([-95.0, 29.7]);
  });

  it('resetPins sets both pins to null', () => {
    useAppStore.getState().setSourcePin([-99.9, 31.9]);
    useAppStore.getState().setDestinationPin([-95.0, 29.7]);
    useAppStore.getState().resetPins();
    expect(useAppStore.getState().sourcePin).toBeNull();
    expect(useAppStore.getState().destinationPin).toBeNull();
  });

  it('toggleOverlay(ercotGrid) flips overlays.ercotGrid', () => {
    expect(useAppStore.getState().overlays.ercotGrid).toBe(false);
    useAppStore.getState().toggleOverlay('ercotGrid');
    expect(useAppStore.getState().overlays.ercotGrid).toBe(true);
    useAppStore.getState().toggleOverlay('ercotGrid');
    expect(useAppStore.getState().overlays.ercotGrid).toBe(false);
  });

  it('toggleOverlay(landBoundary) flips overlays.landBoundary', () => {
    useAppStore.getState().toggleOverlay('landBoundary');
    expect(useAppStore.getState().overlays.landBoundary).toBe(true);
  });

  it('toggleOverlay(wildlifeHabitat) flips overlays.wildlifeHabitat', () => {
    useAppStore.getState().toggleOverlay('wildlifeHabitat');
    expect(useAppStore.getState().overlays.wildlifeHabitat).toBe(true);
  });

  it('toggleOverlay(topography) flips overlays.topography', () => {
    useAppStore.getState().toggleOverlay('topography');
    expect(useAppStore.getState().overlays.topography).toBe(true);
  });

  it('setPriority updates priority field', () => {
    useAppStore.getState().setPriority('risk');
    expect(useAppStore.getState().priority).toBe('risk');
    useAppStore.getState().setPriority('balanced');
    expect(useAppStore.getState().priority).toBe('balanced');
  });

  it('setVoltage updates voltage field', () => {
    useAppStore.getState().setVoltage('500kv-hvdc');
    expect(useAppStore.getState().voltage).toBe('500kv-hvdc');
  });

  it('toggleConstraint(coLocation) flips constraints.coLocation', () => {
    expect(useAppStore.getState().constraints.coLocation).toBe(false);
    useAppStore.getState().toggleConstraint('coLocation');
    expect(useAppStore.getState().constraints.coLocation).toBe(true);
  });

  it('toggleConstraint(eminentDomainAvoidance) flips correctly', () => {
    useAppStore.getState().toggleConstraint('eminentDomainAvoidance');
    expect(useAppStore.getState().constraints.eminentDomainAvoidance).toBe(true);
  });

  it('toggleConstraint(ecologyAvoidance) flips correctly', () => {
    useAppStore.getState().toggleConstraint('ecologyAvoidance');
    expect(useAppStore.getState().constraints.ecologyAvoidance).toBe(true);
  });

  // Phase 3 state fields — initial values
  it('recommendation initializes to null', () => {
    expect(useAppStore.getState().recommendation).toBeNull();
  });

  it('triggers initializes to empty array', () => {
    expect(useAppStore.getState().triggers).toEqual([]);
  });

  it('alerts initializes to null', () => {
    expect(useAppStore.getState().alerts).toBeNull();
  });

  it('projectSummary initializes to null', () => {
    expect(useAppStore.getState().projectSummary).toBeNull();
  });

  it('selectedRoute initializes to null', () => {
    expect(useAppStore.getState().selectedRoute).toBeNull();
  });

  it('frictionCache initializes to null', () => {
    expect(useAppStore.getState().frictionCache).toBeNull();
  });

  // Phase 3 actions
  it('setRoutes updates routes in state', () => {
    const routes = [
      {
        id: 'A' as const,
        profile: 'lowest-cost' as const,
        label: 'Lowest Cost',
        color: '#A7C8FF',
        geometry: { type: 'LineString' as const, coordinates: [[-99, 31], [-98, 32]] },
        metrics: { distanceMiles: 100, estimatedCapexUSD: 1000000, permittingMonths: [6, 12] as [number, number] },
        segmentJustifications: [],
        narrativeSummary: 'A test route.',
        populationServed: 1_000_000,
      },
    ];
    useAppStore.getState().setRoutes(routes);
    expect(useAppStore.getState().routes).toHaveLength(1);
    expect(useAppStore.getState().routes![0].id).toBe('A');
  });

  it('setSimulationStatus updates simulationStatus', () => {
    useAppStore.getState().setSimulationStatus('running');
    expect(useAppStore.getState().simulationStatus).toBe('running');
    useAppStore.getState().setSimulationStatus('complete');
    expect(useAppStore.getState().simulationStatus).toBe('complete');
  });

  it('setRecommendation updates recommendation and accepts null', () => {
    const rec: RouteRecommendation = { routeId: 'C', rationale: 'Best route.', timestamp: 1000 };
    useAppStore.getState().setRecommendation(rec);
    expect(useAppStore.getState().recommendation?.routeId).toBe('C');
    useAppStore.getState().setRecommendation(null);
    expect(useAppStore.getState().recommendation).toBeNull();
  });

  it('setTriggers updates triggers array', () => {
    const triggers: EnvironmentalTrigger[] = [
      { routeId: 'A', triggers: [{ statute: 'ESA Section 7', explanation: 'Habitat.', timelineMonths: [6, 12] }] },
    ];
    useAppStore.getState().setTriggers(triggers);
    expect(useAppStore.getState().triggers).toHaveLength(1);
    expect(useAppStore.getState().triggers[0].routeId).toBe('A');
  });

  it('setAlerts updates alerts and accepts null', () => {
    const alert: SierraAlert = {
      primary: { text: 'Karst formation detected', location: 'Austin, TX' },
      secondary: [],
    };
    useAppStore.getState().setAlerts(alert);
    expect(useAppStore.getState().alerts?.primary.location).toBe('Austin, TX');
    useAppStore.getState().setAlerts(null);
    expect(useAppStore.getState().alerts).toBeNull();
  });

  it('setProjectSummary updates projectSummary and accepts null', () => {
    const summary: ProjectSummary = {
      phases: [{ name: 'Desktop Screening', estimatedMonths: [1, 2], keyDependency: 'GIS data' }],
    };
    useAppStore.getState().setProjectSummary(summary);
    expect(useAppStore.getState().projectSummary?.phases).toHaveLength(1);
    useAppStore.getState().setProjectSummary(null);
    expect(useAppStore.getState().projectSummary).toBeNull();
  });

  it('setSelectedRoute updates selectedRoute and accepts null', () => {
    useAppStore.getState().setSelectedRoute('B');
    expect(useAppStore.getState().selectedRoute).toBe('B');
    useAppStore.getState().setSelectedRoute(null);
    expect(useAppStore.getState().selectedRoute).toBeNull();
  });

  it('setFrictionCache updates frictionCache', () => {
    const cache: FrictionCache = {
      '31.5,-99.2': { lat: 31.5, lng: -99.2, frictionScore: 0.7, justification: 'Protected habitat.' },
    };
    useAppStore.getState().setFrictionCache(cache);
    expect(useAppStore.getState().frictionCache?.['31.5,-99.2'].frictionScore).toBe(0.7);
  });
});

describe('resetSimulation', () => {
  it('clears simulation state back to idle', () => {
    const store = useAppStore.getState();
    store.setSimulationStatus('complete');
    store.setSourcePin([-100, 31]);
    store.setDestinationPin([-99, 30]);
    store.resetSimulation();
    const s = useAppStore.getState();
    expect(s.simulationStatus).toBe('idle');
    expect(s.sourcePin).toBeNull();
    expect(s.destinationPin).toBeNull();
    expect(s.routes).toBeNull();
    expect(s.recommendation).toBeNull();
  });
});

describe('activeDatalayerIds', () => {
  it('starts empty', () => {
    expect(useAppStore.getState().activeDatalayerIds).toEqual([]);
  });

  it('toggleDataLayer adds and removes ids', () => {
    const store = useAppStore.getState();
    store.toggleDataLayer('wind-potential');
    expect(useAppStore.getState().activeDatalayerIds).toContain('wind-potential');
    store.toggleDataLayer('wind-potential');
    expect(useAppStore.getState().activeDatalayerIds).not.toContain('wind-potential');
  });
});
