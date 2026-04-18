import { create } from 'zustand';
import type { AppState, RouteResult, RouteRecommendation, EnvironmentalTrigger, SierraAlert, ProjectSummary, FrictionCache, NarrativeByRoute } from '../types';

interface AppStore extends AppState {
  mapStyle: string;
  // Phase 3 state
  recommendation: RouteRecommendation | null;
  triggers: EnvironmentalTrigger[];
  alerts: SierraAlert | null;
  projectSummary: ProjectSummary | null;
  selectedRoute: 'A' | 'B' | 'C' | null;
  frictionCache: FrictionCache | null;

  // Phase 4 state
  narrativeByRoute: Partial<NarrativeByRoute>;   // populated at simulation time

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
}

export const useAppStore = create<AppStore>()((set) => ({
  // Existing state
  sourcePin: null,
  destinationPin: null,
  voltage: '345kv-double',
  priority: 'cost',
  constraints: { coLocation: false, eminentDomainAvoidance: false, ecologyAvoidance: false },
  overlays: { ercotGrid: false, landBoundary: false, wildlifeHabitat: false, topography: false, frictionHeatmap: false },
  routes: null,
  simulationStatus: 'idle',
  mapStyle: 'mapbox://styles/mapbox/satellite-streets-v12',

  // Phase 3 initial state
  recommendation: null,
  triggers: [],
  alerts: null,
  projectSummary: null,
  selectedRoute: null,
  frictionCache: null,

  // Phase 4 initial state
  narrativeByRoute: {},

  // Existing actions
  setSourcePin: (pin) => set({ sourcePin: pin }),
  setDestinationPin: (pin) => set({ destinationPin: pin }),
  setVoltage: (voltage) => set({ voltage }),
  setPriority: (priority) => set({ priority }),
  toggleConstraint: (key) => set((s) => ({
    constraints: { ...s.constraints, [key]: !s.constraints[key] }
  })),
  toggleOverlay: (key) => set((s) => ({
    overlays: { ...s.overlays, [key]: !s.overlays[key] }
  })),
  resetPins: () => set({ sourcePin: null, destinationPin: null }),
  setMapStyle: (style) => set({ mapStyle: style }),

  // Phase 3 actions
  setRoutes: (routes) => set({ routes }),
  setSimulationStatus: (simulationStatus) => set({ simulationStatus }),
  setRecommendation: (recommendation) => set({ recommendation }),
  setTriggers: (triggers) => set({ triggers }),
  setAlerts: (alerts) => set({ alerts }),
  setProjectSummary: (projectSummary) => set({ projectSummary }),
  setSelectedRoute: (selectedRoute) => set({ selectedRoute }),
  setFrictionCache: (frictionCache) => set({ frictionCache }),

  // Phase 4 actions
  setNarrativeByRoute: (routeId, narrative) =>
    set((state) => ({
      narrativeByRoute: { ...state.narrativeByRoute, [routeId]: narrative },
    })),
}));
