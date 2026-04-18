import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { useAppStore } from '../../store/useAppStore';
import { Sidebar } from './Sidebar';

// Mock all sub-components that trigger complex renders or API calls
vi.mock('./StreamPanel', () => ({
  StreamPanel: vi.fn(() => React.createElement('div', { 'data-testid': 'stream-panel' })),
}));
vi.mock('./results/ResultsPanel', () => ({
  ResultsPanel: vi.fn(() => React.createElement('div', { 'data-testid': 'results-panel' })),
}));
vi.mock('./PinPlacementSection', () => ({
  PinPlacementSection: vi.fn(() => React.createElement('div', { 'data-testid': 'pin-placement' })),
}));
vi.mock('./VoltageSection', () => ({
  VoltageSection: vi.fn(() => React.createElement('div', { 'data-testid': 'voltage-section' })),
}));
vi.mock('./RoutePrioritySection', () => ({
  RoutePrioritySection: vi.fn(() =>
    React.createElement('div', { 'data-testid': 'route-priority' }),
  ),
}));
vi.mock('./ConstraintsSection', () => ({
  ConstraintsSection: vi.fn(() =>
    React.createElement('div', { 'data-testid': 'constraints-section' }),
  ),
}));
vi.mock('./OverlaysSection', () => ({
  OverlaysSection: vi.fn(() =>
    React.createElement('div', { 'data-testid': 'overlays-section' }),
  ),
}));

// Reset Zustand store before each test
beforeEach(() => {
  useAppStore.setState({
    sourcePin: [-99.9, 31.9],
    destinationPin: [-95.0, 29.7],
    voltage: '345kv-double',
    priority: 'cost',
    constraints: { coLocation: false, eminentDomainAvoidance: false, ecologyAvoidance: false },
    overlays: {
      ercotGrid: false,
      landBoundary: false,
      wildlifeHabitat: false,
      topography: false,
      frictionHeatmap: false,
    },
    routes: null,
    simulationStatus: 'idle',
    mapStyle: 'mapbox://styles/mapbox/satellite-streets-v12',
  });
});

// ─── Phase 5 Wave-0 failing tests: Sidebar error state (DATA-04) ──────────────

describe('Sidebar — error state (DATA-04)', () => {
  it('Test A: simulationStatus=error renders error message "Route generation failed. Please retry."', () => {
    useAppStore.setState({ simulationStatus: 'error' });
    render(<Sidebar />);
    expect(
      screen.getByText(/Route generation failed\. Please retry\./i),
    ).toBeInTheDocument();
  });

  it('Test B: simulationStatus=error renders a Retry button', () => {
    useAppStore.setState({ simulationStatus: 'error' });
    render(<Sidebar />);
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('Test C: simulationStatus=idle does NOT render the error message or Retry button', () => {
    useAppStore.setState({ simulationStatus: 'idle' });
    render(<Sidebar />);
    expect(screen.queryByText(/Route generation failed/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
  });
});
