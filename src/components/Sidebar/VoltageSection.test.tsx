import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VoltageSection } from './VoltageSection';
import { useAppStore } from '../../store/useAppStore';

beforeEach(() => {
  useAppStore.setState({
    voltage: '345kv-double',
    constraints: { coLocation: false, eminentDomainAvoidance: false, ecologyAvoidance: false },
    overlays: { ercotGrid: false, landBoundary: false, wildlifeHabitat: false, topography: false, frictionHeatmap: false },
    sourcePin: null, destinationPin: null, priority: 'cost',
    routes: null, simulationStatus: 'idle',
  });
});

describe('VoltageSection', () => {
  it('selecting 345 kV Double Circuit sets store.voltage to 345kv-double', async () => {
    render(<VoltageSection />);
    await userEvent.click(screen.getByLabelText(/345 kV Double Circuit/i));
    expect(useAppStore.getState().voltage).toBe('345kv-double');
  });

  it('selecting 500 kV HVDC sets store.voltage to 500kv-hvdc', async () => {
    render(<VoltageSection />);
    await userEvent.click(screen.getByLabelText(/500 kV HVDC/i));
    expect(useAppStore.getState().voltage).toBe('500kv-hvdc');
  });

  it('selecting 230 kV Single Circuit sets store.voltage to 230kv-single', async () => {
    render(<VoltageSection />);
    await userEvent.click(screen.getByLabelText(/230 kV Single Circuit/i));
    expect(useAppStore.getState().voltage).toBe('230kv-single');
  });
});
