import { useCallback } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { PinPlacementSection } from './PinPlacementSection';
import { VoltageSection } from './VoltageSection';
import { RoutePrioritySection } from './RoutePrioritySection';
import { ConstraintsSection } from './ConstraintsSection';
import { OverlaysSection } from './OverlaysSection';
import { StreamPanel } from './StreamPanel';
import { ResultsPanel } from './results/ResultsPanel';

export function Sidebar() {
  const simulationStatus = useAppStore((s) => s.simulationStatus);
  const sourcePin = useAppStore((s) => s.sourcePin);
  const destinationPin = useAppStore((s) => s.destinationPin);
  const setSimulationStatus = useAppStore((s) => s.setSimulationStatus);
  const setRoutes = useAppStore((s) => s.setRoutes);
  const setRecommendation = useAppStore((s) => s.setRecommendation);
  const setTriggers = useAppStore((s) => s.setTriggers);
  const setAlerts = useAppStore((s) => s.setAlerts);
  const setProjectSummary = useAppStore((s) => s.setProjectSummary);
  const setSelectedRoute = useAppStore((s) => s.setSelectedRoute);
  const setNarrativeByRoute = useAppStore((s) => s.setNarrativeByRoute);
  const resetSimulation = useAppStore((s) => s.resetSimulation);
  const pushSimulationRun = useAppStore((s) => s.pushSimulationRun);
  const constraints = useAppStore((s) => s.constraints);
  const priority = useAppStore((s) => s.priority);
  const voltage = useAppStore((s) => s.voltage);

  const runSimulation = useCallback(async () => {
    if (!sourcePin || !destinationPin) return;

    setSimulationStatus('running');

    // Fire POST /api/route immediately (A* is fast — completes before stream ends)
    const routeBody = {
      source: sourcePin,
      dest: destinationPin,
      constraints: {
        costRisk: priority === 'cost' ? 0 : priority === 'risk' ? 1 : 0.5,
        coLocation: constraints.coLocation,
        eminentDomainAvoidance: constraints.eminentDomainAvoidance,
        ecologyAvoidance: constraints.ecologyAvoidance,
      },
      voltage,
    };

    const API = import.meta.env.VITE_API_URL ?? '';

    try {
      const routesRes = await fetch(`${API}/api/route`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(routeBody),
      });
      if (!routesRes.ok) throw new Error('route-failed');
      const routes = await routesRes.json();
      setRoutes(routes);

      // After routes loaded, fire AI calls in staggered pattern to avoid rate limits
      // Recommend first (most visible), then parallel triggers/alerts/summary
      const recommend = await fetch(`${API}/api/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ routes, constraints: routeBody.constraints }),
      }).then((r) => r.json());
      setRecommendation(recommend);
      setSelectedRoute(recommend.routeId ?? 'C');

      const [triggers, alerts, summary, narrativeA, narrativeB, narrativeC] = await Promise.all([
        fetch(`${API}/api/triggers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ routes }),
        }).then((r) => r.json()),
        fetch(`${API}/api/alerts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recommendedRoute: routes.find(
              (r: { id: string }) => r.id === recommend.routeId,
            ),
          }),
        }).then((r) => r.json()),
        fetch(`${API}/api/summary`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recommendedRoute: routes.find(
              (r: { id: string }) => r.id === recommend.routeId,
            ),
          }),
        }).then((r) => r.json()),
        fetch(`${API}/api/narrative`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ routeId: 'A', routeLabel: 'Route A — Least-Cost', constraints: routeBody.constraints }),
        }).then((r) => r.json()),
        fetch(`${API}/api/narrative`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ routeId: 'B', routeLabel: 'Route B — Max Population Served', constraints: routeBody.constraints }),
        }).then((r) => r.json()),
        fetch(`${API}/api/narrative`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ routeId: 'C', routeLabel: 'Route C — Renewable-Optimized', constraints: routeBody.constraints }),
        }).then((r) => r.json()),
      ]);
      setTriggers(triggers);
      setAlerts(alerts);
      setProjectSummary(summary);
      setNarrativeByRoute('A', narrativeA?.narrative ?? '');
      setNarrativeByRoute('B', narrativeB?.narrative ?? '');
      setNarrativeByRoute('C', narrativeC?.narrative ?? '');
    } catch (err) {
      console.error('[runSimulation]', err);
      useAppStore.getState().setSimulationStatus('error');
    }
  }, [
    sourcePin,
    destinationPin,
    constraints,
    priority,
    voltage,
    setSimulationStatus,
    setRoutes,
    setRecommendation,
    setTriggers,
    setAlerts,
    setProjectSummary,
    setSelectedRoute,
    setNarrativeByRoute,
  ]);

  const handleStreamComplete = useCallback(() => {
    const state = useAppStore.getState();
    if (state.routes && state.routes.length > 0) {
      const formatPin = (p: [number, number] | null) =>
        p ? `${p[1].toFixed(3)}, ${p[0].toFixed(3)}` : 'Unknown';
      pushSimulationRun({
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        sourcePinLabel: formatPin(state.sourcePin),
        destPinLabel: formatPin(state.destinationPin),
        recommendedRouteId: state.recommendation?.routeId ?? null,
        routes: state.routes,
      });
    }
    setSimulationStatus('complete');
  }, [setSimulationStatus, pushSimulationRun]);

  const handleCancel = useCallback(() => {
    setSimulationStatus('idle');
    resetSimulation();
  }, [setSimulationStatus, resetSimulation]);

  const hasPins = sourcePin !== null && destinationPin !== null;

  if (simulationStatus === 'running') {
    return (
      <div style={sidebarContainerStyle}>
        <StreamPanel onComplete={handleStreamComplete} onCancel={handleCancel} />
      </div>
    );
  }

  if (simulationStatus === 'complete') {
    return (
      <div style={sidebarContainerStyle}>
        <ResultsPanel />
        <div style={{ padding: '12px 20px', borderTop: '1px solid #2E3140' }}>
          <button
            onClick={resetSimulation}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '0.375rem',
              background: 'transparent',
              border: '1px solid #414755',
              color: '#C1C6D7',
              fontFamily: 'Manrope, sans-serif',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            ↺ New Simulation
          </button>
        </div>
      </div>
    );
  }

  if (simulationStatus === 'error') {
    return (
      <div style={sidebarContainerStyle}>
        <PinPlacementSection />
        <VoltageSection />
        <RoutePrioritySection />
        <ConstraintsSection />
        <OverlaysSection />
        <div style={{ padding: '16px 20px', marginTop: 'auto' }}>
          <p style={{ color: '#C1C6D7', fontSize: 13, marginBottom: 12, fontFamily: 'Inter, sans-serif' }}>
            Route generation failed. Please retry.
          </p>
          <button
            onClick={() => useAppStore.getState().setSimulationStatus('idle')}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '0.375rem',
              background: '#c8a45c',
              color: '#0a0e09',
              fontFamily: 'Manrope, sans-serif',
              fontSize: 14,
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // idle — show controls
  return (
    <div style={sidebarContainerStyle}>
      <PinPlacementSection />
      <VoltageSection />
      <RoutePrioritySection />
      <ConstraintsSection />
      <OverlaysSection />
      <div style={{ padding: '16px 20px', marginTop: 'auto' }}>
        <button
          disabled={!hasPins}
          onClick={runSimulation}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '0.375rem',
            background: '#c8a45c',
            color: '#0a0e09',
            fontFamily: 'Manrope, sans-serif',
            fontSize: 14,
            fontWeight: 700,
            border: 'none',
            cursor: hasPins ? 'pointer' : 'not-allowed',
            opacity: hasPins ? 1 : 0.4,
          }}
        >
          Run Simulation
        </button>
        {!hasPins && (
          <div
            style={{
              marginTop: 8,
              fontSize: 11,
              color: '#C1C6D7',
              textAlign: 'center',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            Drop source and destination pins to begin
          </div>
        )}
      </div>
    </div>
  );
}

const sidebarContainerStyle: React.CSSProperties = {
  position: 'absolute',
  top: '1rem',
  left: '1rem',
  bottom: '1rem',
  width: 320,
  zIndex: 10,
  backgroundColor: '#1C1B1B',
  borderRadius: '0.75rem',
  overflow: 'auto',
  display: 'flex',
  flexDirection: 'column',
};
