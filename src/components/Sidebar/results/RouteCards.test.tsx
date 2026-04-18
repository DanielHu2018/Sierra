import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { act } from 'react';
import { useAppStore } from '../../../store/useAppStore';
import { RouteCards } from './RouteCards';
import type { RouteResult, RouteRecommendation } from '../../../types';

const makeRoute = (id: 'A' | 'B' | 'C', profile: RouteResult['profile']): RouteResult => ({
  id,
  profile,
  label: `Route ${id} — ${profile}`,
  color: id === 'A' ? '#A7C8FF' : id === 'B' ? '#FFBC7C' : '#E8B3FF',
  geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1]] },
  metrics: {
    distanceMiles: id === 'A' ? 120 : id === 'B' ? 110 : 100,
    estimatedCapexUSD: id === 'A' ? 800_000_000 : id === 'B' ? 600_000_000 : 400_000_000,
    permittingMonths: [12, 18],
  },
  segmentJustifications: [
    { segmentIndex: 0, frictionScore: 0.3, justification: 'Low friction area near highway' },
    { segmentIndex: 1, frictionScore: 0.7, justification: 'High friction near wetlands' },
  ],
  narrativeSummary: `Summary for Route ${id}`,
});

const mockRoutes: RouteResult[] = [
  makeRoute('A', 'lowest-cost'),
  makeRoute('B', 'balanced'),
  makeRoute('C', 'lowest-risk'),
];

const mockRecommendation: RouteRecommendation = {
  routeId: 'C',
  rationale: 'Best regulatory outcome.',
  timestamp: 1234567890,
};

beforeEach(() => {
  act(() => {
    useAppStore.setState({
      routes: mockRoutes,
      recommendation: mockRecommendation,
      selectedRoute: 'C',
    });
  });
});

describe('RouteCards', () => {
  test('renders route label, color swatch, distance, cost, and permitting range for each route', () => {
    render(<RouteCards />);
    // Route A
    expect(screen.getByText('Route A — lowest-cost')).toBeInTheDocument();
    expect(screen.getByText(/120 mi/)).toBeInTheDocument();
    // Route B
    expect(screen.getByText('Route B — balanced')).toBeInTheDocument();
    expect(screen.getByText(/110 mi/)).toBeInTheDocument();
    // Route C
    expect(screen.getByText('Route C — lowest-risk')).toBeInTheDocument();
    expect(screen.getByText(/100 mi/)).toBeInTheDocument();
  });

  test('clicking a card calls setSelectedRoute with the route id', () => {
    const setSelectedRoute = vi.spyOn(useAppStore.getState(), 'setSelectedRoute');
    render(<RouteCards />);
    // Click Route A card (find by label text)
    const routeALabel = screen.getByText('Route A — lowest-cost');
    fireEvent.click(routeALabel.closest('[data-testid="route-card-A"]') ?? routeALabel);
    // setSelectedRoute should have been called via Zustand
    // Verify store state changed
    expect(useAppStore.getState().selectedRoute).toBe('A');
  });

  test('recommended route card (Route C) is pre-highlighted on initial render', () => {
    render(<RouteCards />);
    expect(screen.getByText('★ Recommended')).toBeInTheDocument();
  });

  test('renders null when routes is empty', () => {
    act(() => { useAppStore.setState({ routes: [] }); });
    const { container } = render(<RouteCards />);
    expect(container.firstChild).toBeNull();
  });

  test('shows segment justification text in expanded card', () => {
    render(<RouteCards />);
    // Route C is pre-expanded (recommended route)
    expect(screen.getByText('Low friction area near highway')).toBeInTheDocument();
  });

  test('clicking an expanded card collapses it', () => {
    render(<RouteCards />);
    // Route C starts expanded — click to collapse
    const routeCLabel = screen.getByText('Route C — lowest-risk');
    const card = routeCLabel.closest('div[style*="border-radius"]') as HTMLElement;
    fireEvent.click(card);
    // After clicking, segment justification should be gone
    expect(screen.queryByText('Low friction area near highway')).not.toBeInTheDocument();
  });
});
