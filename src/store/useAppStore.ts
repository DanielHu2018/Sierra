import { create } from 'zustand';
import type {
  AppState, RouteResult, RouteRecommendation, EnvironmentalTrigger,
  SierraAlert, ProjectSummary, FrictionCache, NarrativeByRoute, SimulationRun,
} from '../types';

interface AppStore extends AppState {
  mapStyle: string;
  recommendation: RouteRecommendation | null;
  triggers: EnvironmentalTrigger[];
  alerts: SierraAlert | null;
  projectSummary: ProjectSummary | null;
  selectedRoute: 'A' | 'B' | 'C' | null;
  frictionCache: FrictionCache | null;
  narrativeByRoute: Partial<NarrativeByRoute>;
  activeTab: 'route-engine' | 'data-layers' | 'archive';
  activeDatalayerIds: string[];
  simulationHistory: SimulationRun[];
  focusedAlertId: number | null; // index into alerts.secondary (-1 = primary)

  // Existing actions
  setSourcePin: (pin: [number, number]) => void;
  setDestinationPin: (pin: [number, number]) => void;
  setVoltage: (v: AppState['voltage']) => void;
  setPriority: (p: AppState['priority']) => void;
  toggleConstraint: (key: keyof AppState['constraints']) => void;
  toggleOverlay: (key: keyof AppState['overlays']) => void;
  resetPins: () => void;
  setMapStyle: (style: string) => void;

  // Phase 3 actions
  setRoutes: (routes: RouteResult[]) => void;
  setSimulationStatus: (status: AppState['simulationStatus']) => void;
  setRecommendation: (r: RouteRecommendation | null) => void;
  setTriggers: (t: EnvironmentalTrigger[]) => void;
  setAlerts: (a: SierraAlert | null) => void;
  setProjectSummary: (s: ProjectSummary | null) => void;
  setSelectedRoute: (id: 'A' | 'B' | 'C' | null) => void;
  setFrictionCache: (cache: FrictionCache) => void;

  // Phase 4 actions
  setNarrativeByRoute: (routeId: 'A' | 'B' | 'C', narrative: string) => void;

  // Navigation actions
  setActiveTab: (tab: 'route-engine' | 'data-layers' | 'archive') => void;

  // New actions
  resetSimulation: () => void;
  toggleDataLayer: (id: string) => void;
  pushSimulationRun: (run: SimulationRun) => void;
  setFocusedAlertId: (idx: number | null) => void;
}

export const useAppStore = create<AppStore>()((set) => ({
  sourcePin: null,
  destinationPin: null,
  voltage: '345kv-double',
  priority: 'cost',
  constraints: { coLocation: false, eminentDomainAvoidance: false, ecologyAvoidance: false },
  overlays: { ercotGrid: false, landBoundary: false, wildlifeHabitat: false, topography: false, frictionHeatmap: false },
  routes: null,
  simulationStatus: 'idle',
  mapStyle: 'mapbox://styles/mapbox/dark-v11',
  recommendation: null,
  triggers: [],
  alerts: null,
  projectSummary: null,
  selectedRoute: null,
  frictionCache: null,
  narrativeByRoute: {},
  activeTab: 'route-engine',
  activeDatalayerIds: [],
  simulationHistory: [],
  focusedAlertId: null,

  setSourcePin: (pin) => set({ sourcePin: pin }),
  setDestinationPin: (pin) => set({ destinationPin: pin }),
  setVoltage: (voltage) => set({ voltage }),
  setPriority: (priority) => set({ priority }),
  toggleConstraint: (key) => set((s) => ({ constraints: { ...s.constraints, [key]: !s.constraints[key] } })),
  toggleOverlay: (key) => set((s) => ({ overlays: { ...s.overlays, [key]: !s.overlays[key] } })),
  resetPins: () => set({ sourcePin: null, destinationPin: null }),
  setMapStyle: (style) => set({ mapStyle: style }),

  setRoutes: (routes) => set({ routes }),
  setSimulationStatus: (simulationStatus) => set({ simulationStatus }),
  setRecommendation: (recommendation) => set({ recommendation }),
  setTriggers: (triggers) => set({ triggers }),
  setAlerts: (alerts) => set({ alerts }),
  setProjectSummary: (projectSummary) => set({ projectSummary }),
  setSelectedRoute: (selectedRoute) => set({ selectedRoute }),
  setFrictionCache: (frictionCache) => set({ frictionCache }),

  setNarrativeByRoute: (routeId, narrative) =>
    set((state) => ({ narrativeByRoute: { ...state.narrativeByRoute, [routeId]: narrative } })),

  setActiveTab: (activeTab) => set({ activeTab }),

  resetSimulation: () => set({
    simulationStatus: 'idle',
    sourcePin: null,
    destinationPin: null,
    routes: null,
    recommendation: null,
    alerts: null,
    triggers: [],
    projectSummary: null,
    selectedRoute: null,
    narrativeByRoute: {},
    focusedAlertId: null,
  }),

  toggleDataLayer: (id) => set((s) => ({
    activeDatalayerIds: s.activeDatalayerIds.includes(id)
      ? s.activeDatalayerIds.filter((x) => x !== id)
      : [...s.activeDatalayerIds, id],
  })),

  pushSimulationRun: (run) => set((s) => ({
    simulationHistory: [run, ...s.simulationHistory].slice(0, 10),
  })),

  setFocusedAlertId: (focusedAlertId) => set({ focusedAlertId }),
}));
