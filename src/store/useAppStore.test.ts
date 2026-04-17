import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from './useAppStore';

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
});
