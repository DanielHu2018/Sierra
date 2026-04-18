import { describe, test, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { act } from 'react';
import { useAppStore } from '../../../store/useAppStore';
import { SierraRecommends } from './SierraRecommends';
import type { RouteResult, RouteRecommendation } from '../../../types';

const mockRoute: RouteResult = {
  id: 'C',
  profile: 'lowest-risk',
  label: 'Route C — Lowest Regulatory Risk',
  color: '#E8B3FF',
  geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1]] },
  metrics: { distanceMiles: 120, estimatedCapexUSD: 500_000_000, permittingMonths: [18, 24] },
  segmentJustifications: [],
  narrativeSummary: 'Low risk route through existing corridors.',
  populationServed: 1_500_000,
};

const mockRecommendation: RouteRecommendation = {
  routeId: 'C',
  rationale: 'This route avoids sensitive habitats. It minimizes regulatory exposure. It has the shortest permitting timeline.',
  timestamp: 1234567890,
};

beforeEach(() => {
  act(() => {
    useAppStore.setState({
      recommendation: null,
      routes: null,
    });
  });
});

describe('SierraRecommends', () => {
  test('renders nothing when recommendation is null', () => {
    const { container } = render(<SierraRecommends />);
    expect(container.firstChild).toBeNull();
  });

  test('renders the recommended route label in panel header', () => {
    act(() => {
      useAppStore.setState({ recommendation: mockRecommendation, routes: [mockRoute] });
    });
    render(<SierraRecommends />);
    expect(screen.getByText('Route C — Lowest Regulatory Risk')).toBeInTheDocument();
  });

  test('renders a 3-sentence rationale from RouteRecommendation.rationale', () => {
    act(() => {
      useAppStore.setState({ recommendation: mockRecommendation, routes: [mockRoute] });
    });
    render(<SierraRecommends />);
    expect(screen.getByText(mockRecommendation.rationale)).toBeInTheDocument();
  });

  test('renders Sierra Recommends header label', () => {
    act(() => {
      useAppStore.setState({ recommendation: mockRecommendation, routes: [mockRoute] });
    });
    render(<SierraRecommends />);
    expect(screen.getByText('Sierra Recommends')).toBeInTheDocument();
  });
});
