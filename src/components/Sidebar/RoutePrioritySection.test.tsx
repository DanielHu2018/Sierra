import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RoutePrioritySection } from './RoutePrioritySection';
import { useAppStore } from '../../store/useAppStore';

beforeEach(() => {
  useAppStore.setState({
    priority: 'cost',
    constraints: { coLocation: false, eminentDomainAvoidance: false, ecologyAvoidance: false },
    overlays: { ercotGrid: false, landBoundary: false, wildlifeHabitat: false, topography: false, frictionHeatmap: false },
    sourcePin: null, destinationPin: null, voltage: '345kv-double',
    routes: null, simulationStatus: 'idle',
  });
});

describe('RoutePrioritySection', () => {
  it('clicking MINIMIZE COST chip sets store.priority to cost', async () => {
    render(<RoutePrioritySection />);
    await userEvent.click(screen.getByText(/minimize cost/i));
    expect(useAppStore.getState().priority).toBe('cost');
  });

  it('clicking MINIMIZE RISK chip sets store.priority to risk', async () => {
    render(<RoutePrioritySection />);
    await userEvent.click(screen.getByText(/minimize risk/i));
    expect(useAppStore.getState().priority).toBe('risk');
  });
});
