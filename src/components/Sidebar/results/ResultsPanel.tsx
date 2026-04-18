import { SierraRecommends } from './SierraRecommends';
import { RadarChartPanel } from './RadarChartPanel';
import { RouteCards } from './RouteCards';

// Placeholders — filled by Plan 08
function SierraAlertsPlaceholder() { return null; }
function EnvTriggerPlaceholder() { return null; }
function ProjectSummaryPlaceholder() { return null; }

export function ResultsPanel() {
  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        paddingBottom: 20,
      }}
    >
      {/* 1. Sierra Recommends — always first */}
      <SierraRecommends />

      {/* 2. Radar comparison chart */}
      <RadarChartPanel />

      {/* 3. Route cards (A, B, C) */}
      <RouteCards />

      {/* 4. Sierra Alerts — Plan 08 */}
      <SierraAlertsPlaceholder />

      {/* 5. Environmental Trigger Panel — Plan 08 */}
      <EnvTriggerPlaceholder />

      {/* 6. Inline Project Summary — Plan 08 */}
      <ProjectSummaryPlaceholder />
    </div>
  );
}
