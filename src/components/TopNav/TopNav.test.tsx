import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TopNav } from './TopNav';

// Mock useExportPdf — returns a spy function so we can detect calls
const mockExportPdf = vi.fn();
vi.mock('../../hooks/useExportPdf', () => ({
  useExportPdf: vi.fn(() => mockExportPdf),
}));

// Mock useAppStore — default to 'idle'; individual tests override via mockImplementation
const mockStore: Record<string, unknown> = {
  simulationStatus: 'idle',
  routes: null,
  selectedRoute: null,
  recommendation: null,
  triggers: [],
  alerts: null,
  projectSummary: null,
  narrativeByRoute: {},
};

vi.mock('../../store/useAppStore', () => ({
  useAppStore: vi.fn((selector: (s: Record<string, unknown>) => unknown) => selector(mockStore)),
}));

beforeEach(() => {
  mockExportPdf.mockClear();
  mockStore.simulationStatus = 'idle';
});

describe('TopNav — Export PDF button', () => {
  test('button is visible in TopNav render', () => {
    render(<TopNav />);
    const btn = screen.getByRole('button', { name: /export pdf/i });
    expect(btn).toBeDefined();
  });

  test('button is disabled when simulationStatus is "idle"', () => {
    render(<TopNav />);
    const btn = screen.getByRole('button', { name: /export pdf/i }) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  test.todo('button is enabled and has opacity 1 when simulationStatus is "complete"');
  test.todo('clicking the button when enabled calls the exportPdf function');
  test.todo('button does not trigger exportPdf when simulationStatus is "idle"');
  test.todo('button does not trigger exportPdf when simulationStatus is "streaming"');
});
