import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConstraintsSection } from './ConstraintsSection';
import { useAppStore } from '../../store/useAppStore';

beforeEach(() => {
  useAppStore.setState({
    constraints: { coLocation: false, eminentDomainAvoidance: false, ecologyAvoidance: false },
    overlays: { ercotGrid: false, landBoundary: false, wildlifeHabitat: false, topography: false, frictionHeatmap: false },
    sourcePin: null, destinationPin: null, voltage: '345kv-double', priority: 'cost',
    routes: null, simulationStatus: 'idle',
  });
});

describe('ConstraintsSection', () => {
  it('clicking Co-Location toggle updates store.constraints.coLocation', async () => {
    render(<ConstraintsSection />);
    const toggle = screen.getByRole('switch', { name: /co-location/i });
    await userEvent.click(toggle);
    expect(useAppStore.getState().constraints.coLocation).toBe(true);
  });

  it('clicking Eminent Domain toggle updates store.constraints.eminentDomainAvoidance', async () => {
    render(<ConstraintsSection />);
    const toggle = screen.getByRole('switch', { name: /eminent domain/i });
    await userEvent.click(toggle);
    expect(useAppStore.getState().constraints.eminentDomainAvoidance).toBe(true);
  });

  it('clicking Ecology Avoidance toggle updates store.constraints.ecologyAvoidance', async () => {
    render(<ConstraintsSection />);
    const toggle = screen.getByRole('switch', { name: /ecology avoidance/i });
    await userEvent.click(toggle);
    expect(useAppStore.getState().constraints.ecologyAvoidance).toBe(true);
  });
});
