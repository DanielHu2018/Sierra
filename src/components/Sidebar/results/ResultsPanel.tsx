import { SierraRecommends } from './SierraRecommends';
import { RadarChartPanel } from './RadarChartPanel';
import { RouteCards } from './RouteCards';
import { SierraAlerts } from './SierraAlerts';
import { EnvTriggerPanel } from './EnvTriggerPanel';
import { ProjectSummary } from './ProjectSummary';
import { OverlayControls } from './OverlayControls';

export function ResultsPanel() {
  return (
    <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 20 }}>
      <SierraRecommends />
      <RadarChartPanel />
      <RouteCards />
      <OverlayControls />
      <SierraAlerts />
      <EnvTriggerPanel />
      <ProjectSummary />
    </div>
  );
}
