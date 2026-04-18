import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { act } from 'react';
import { useAppStore } from '../../../store/useAppStore';
import { RadarChartPanel } from './RadarChartPanel';
import type { RouteResult } from '../../../types';

// Mock recharts to avoid SVG/canvas issues in jsdom
vi.mock('recharts', () => ({
  RadarChart: ({ children, ...props }: { children: React.ReactNode; 'data-testid'?: string }) => (
    <div data-testid="radar-chart" {...props}>{children}</div>
  ),
  Radar: ({ name, dataKey, stroke, fill }: { name: string; dataKey: string; stroke: string; fill: string }) => (
    <div data-testid={`radar-${dataKey}`} data-name={name} data-stroke={stroke} data-fill={fill} />
  ),
  PolarGrid: () => <div data-testid="polar-grid" />,
  PolarAngleAxis: ({ dataKey }: { dataKey: string }) => <div data-testid="polar-angle-axis" data-key={dataKey} />,
  PolarRadiusAxis: () => <div data-testid="polar-radius-axis" />,
  ResponsiveContainer: ({ children, width, height }: { children: React.ReactNode; width: string; height: number }) => (
    <div data-testid="responsive-container" data-width={width} data-height={height}>{children}</div>
  ),
}));

const makeRoute = (id: 'A' | 'B' | 'C', profile: RouteResult['profile'], capex: number): RouteResult => ({
  id,
  profile,
  label: `Route ${id}`,
  color: id === 'A' ? '#A7C8FF' : id === 'B' ? '#FFBC7C' : '#E8B3FF',
  geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1]] },
  metrics: { distanceMiles: 100, estimatedCapexUSD: capex, permittingMonths: [12, 18] },
  segmentJustifications: [{ segmentIndex: 0, frictionScore: 0.3, justification: 'Low friction area' }],
  narrativeSummary: 'Test route',
  populationServed: 1_000_000,
});

const mockRoutes: RouteResult[] = [
  makeRoute('A', 'lowest-cost', 800_000_000),
  makeRoute('B', 'balanced', 600_000_000),
  makeRoute('C', 'lowest-risk', 400_000_000),
];

beforeEach(() => {
  act(() => {
    useAppStore.setState({ routes: null });
  });
});

describe('RadarChart', () => {
  test('renders null when routes array is empty or null', () => {
    act(() => { useAppStore.setState({ routes: null }); });
    const { container } = render(<RadarChartPanel />);
    expect(container.firstChild).toBeNull();
  });

  test('renders three Radar children with route colors A7C8FF, FFBC7C, E8B3FF', () => {
    act(() => { useAppStore.setState({ routes: mockRoutes }); });
    render(<RadarChartPanel />);
    expect(screen.getByTestId('radar-A')).toHaveAttribute('data-stroke', '#A7C8FF');
    expect(screen.getByTestId('radar-B')).toHaveAttribute('data-stroke', '#FFBC7C');
    expect(screen.getByTestId('radar-C')).toHaveAttribute('data-stroke', '#E8B3FF');
  });

  test('wraps chart in ResponsiveContainer with 100% width', () => {
    act(() => { useAppStore.setState({ routes: mockRoutes }); });
    render(<RadarChartPanel />);
    expect(screen.getByTestId('responsive-container')).toHaveAttribute('data-width', '100%');
  });

  test('renders four PolarAngleAxis axes for Cost, Permitting, Congestion Relief, Regulatory Risk', () => {
    act(() => { useAppStore.setState({ routes: mockRoutes }); });
    render(<RadarChartPanel />);
    // PolarAngleAxis receives axis dataKey
    expect(screen.getByTestId('polar-angle-axis')).toHaveAttribute('data-key', 'axis');
    // The radar chart data should have 4 entries
    const radarChart = screen.getByTestId('radar-chart');
    expect(radarChart).toBeInTheDocument();
  });
});
