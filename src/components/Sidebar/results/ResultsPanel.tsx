import { SierraRecommends } from './SierraRecommends';
import { RadarChartPanel } from './RadarChartPanel';
import { RouteCards } from './RouteCards';
import { ImpactScorePanel } from './ImpactScorePanel';
import { OverlayControls } from './OverlayControls';
import { SierraAlerts } from './SierraAlerts';
import { EnvTriggerPanel } from './EnvTriggerPanel';
import { ProjectSummary } from './ProjectSummary';

export function ResultsPanel() {
  return (
    <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 20 }}>
      <SierraRecommends />
      <RadarChartPanel />
      <RouteCards />
      <ImpactScorePanel />
      <OverlayControls />
      <SierraAlerts />
      <EnvTriggerPanel />
      <ProjectSummary />
    </div>
  );
}
