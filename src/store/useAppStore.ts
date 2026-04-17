import { create } from 'zustand';
import type { AppState } from '../types';

interface AppStore extends AppState {
  mapStyle: string;
  setSourcePin: (pin: [number, number]) => void;
  setDestinationPin: (pin: [number, number]) => void;
  setVoltage: (v: AppState['voltage']) => void;
  setPriority: (p: AppState['priority']) => void;
  toggleConstraint: (key: keyof AppState['constraints']) => void;
  toggleOverlay: (key: keyof AppState['overlays']) => void;
  resetPins: () => void;
  setMapStyle: (style: string) => void;
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
  mapStyle: 'mapbox://styles/mapbox/satellite-streets-v12',
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
}));
