import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Boat, Trailer, BoatPlacement, TowerGroup } from './types';
import { computeTowerZs, computeTowerXZs, isValidZ, snapZ, footprintsOverlap, boatClearsTowers } from './utils';

function makeId() {
  return Math.random().toString(36).slice(2, 9);
}

const DEFAULT_TRAILER: Trailer = {
  id: 'default',
  name: 'My Trailer',
  bedLengthM: 10.97,
  tiers: 3,
  trailerWidthM: 2.44,
  tongueLengthM: 2.0,
  towerGroups: [
    { id: 'tg1', count: 1, xCenter: 0 },
    { id: 'tg2', count: 1, xCenter: 0 },
    { id: 'tg3', count: 1, xCenter: 0 },
  ],
};

export const BOAT_CLASSES: Record<string, { lengthM: number; widthM: number; weightKg: number }> = {
  '1x':  { lengthM: 8.2,  widthM: 0.29, weightKg: 14  },
  '2x':  { lengthM: 10.4, widthM: 0.33, weightKg: 27  },
  '2-':  { lengthM: 10.4, widthM: 0.33, weightKg: 27  },
  '4x':  { lengthM: 13.4, widthM: 0.37, weightKg: 52  },
  '4+':  { lengthM: 13.4, widthM: 0.60, weightKg: 51  },
  '4-':  { lengthM: 13.4, widthM: 0.60, weightKg: 51  },
  '8+':  { lengthM: 17.4, widthM: 0.60, weightKg: 96  },
};

interface State {
  trailer: Trailer;
  boats: Boat[];
  placements: BoatPlacement[];

  updateTrailer: (patch: Partial<Trailer>) => void;
  addBoat: (boat: Omit<Boat, 'id'>) => void;
  updateBoat: (id: string, patch: Partial<Boat>) => void;
  removeBoat: (id: string) => void;

  addPlacement: (p: Omit<BoatPlacement, 'id'>) => void;
  movePlacement: (id: string, patch: Partial<Pick<BoatPlacement, 'tier' | 'xM' | 'zCenterM'>>) => void;
  setSlung: (id: string, slung: boolean) => void;
  removePlacement: (id: string) => void;
  clearPlacements: () => void;
  clearAll: () => void;

  addTowerGroup: () => void;
  removeTowerGroup: (id: string) => void;
  updateTowerGroup: (id: string, patch: Partial<Pick<TowerGroup, 'count' | 'xCenter'>>) => void;
  setTowersPerGroup: (count: number) => void;
  setGroupsXCenter: (xCenter: number) => void;

  autoLayout: () => void;
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      trailer: DEFAULT_TRAILER,
      boats: [],
      placements: [],

      updateTrailer: (patch) =>
        set((s) => ({ trailer: { ...s.trailer, ...patch } })),

      addBoat: (boat) =>
        set((s) => ({ boats: [...s.boats, { ...boat, id: makeId() }] })),

      updateBoat: (id, patch) =>
        set((s) => ({ boats: s.boats.map(b => b.id === id ? { ...b, ...patch } : b) })),

      removeBoat: (id) =>
        set((s) => ({
          boats: s.boats.filter(b => b.id !== id),
          placements: s.placements.filter(p => p.boatId !== id),
        })),

      addPlacement: (placement) =>
        set((s) => ({ placements: [...s.placements, { ...placement, id: makeId() }] })),

      movePlacement: (id, patch) =>
        set((s) => ({
          placements: s.placements.map(p => p.id === id ? { ...p, ...patch } : p),
        })),

      setSlung: (id, slung) =>
        set((s) => ({
          placements: s.placements.map(p => p.id === id ? { ...p, slung } : p),
        })),

      removePlacement: (id) =>
        set((s) => ({ placements: s.placements.filter(p => p.id !== id) })),

      clearPlacements: () => set({ placements: [] }),

      clearAll: () => set({ boats: [], placements: [] }),

      addTowerGroup: () =>
        set((s) => ({
          trailer: {
            ...s.trailer,
            towerGroups: [
              ...s.trailer.towerGroups,
              { id: makeId(), count: 1, xCenter: 0 },
            ],
          },
        })),

      removeTowerGroup: (id) =>
        set((s) => {
          if (s.trailer.towerGroups.length <= 2) return s;
          return {
            trailer: {
              ...s.trailer,
              towerGroups: s.trailer.towerGroups.filter(g => g.id !== id),
            },
          };
        }),

      updateTowerGroup: (id, patch) =>
        set((s) => ({
          trailer: {
            ...s.trailer,
            towerGroups: s.trailer.towerGroups.map(g =>
              g.id === id ? { ...g, ...patch } : g
            ),
          },
        })),

      setTowersPerGroup: (count) =>
        set((s) => ({
          trailer: {
            ...s.trailer,
            towerGroups: s.trailer.towerGroups.map(g => ({ ...g, count })),
          },
        })),

      setGroupsXCenter: (xCenter) =>
        set((s) => ({
          trailer: {
            ...s.trailer,
            towerGroups: s.trailer.towerGroups.map(g => ({ ...g, xCenter })),
          },
        })),

      autoLayout: () => {
        const { trailer, boats } = get();
        const towerZs = computeTowerZs(trailer);
        const towerXZs = computeTowerXZs(trailer);
        const halfLen = trailer.bedLengthM / 2;
        const halfW = trailer.trailerWidthM / 2;
        const GAP = 0.08;

        const candidateZs: number[] = [0];
        for (let i = 0; i < towerZs.length - 1; i++) {
          for (let j = i + 1; j < towerZs.length; j++) {
            candidateZs.push((towerZs[i] + towerZs[j]) / 2);
          }
        }

        const sorted = [...boats].sort((a, b) => b.lengthM - a.lengthM);
        const newPlacements: BoatPlacement[] = [];

        for (const boat of sorted) {
          let placed = false;
          for (let t = 0; t < trailer.tiers && !placed; t++) {
            const xStep = boat.widthM + GAP;
            const xStart = -halfW + boat.widthM / 2;
            const xEnd   =  halfW - boat.widthM / 2;

            for (let xM = xStart; xM <= xEnd + 0.001 && !placed; xM += xStep) {
              const validZs = candidateZs
                .map(z => snapZ(z, boat.lengthM, towerZs, halfLen))
                .filter(z => isValidZ(z, boat.lengthM, towerZs))
                .sort((a, b) => Math.abs(a) - Math.abs(b));

              for (const zM of validZs) {
                if (!boatClearsTowers(xM, zM, boat.widthM, boat.lengthM, towerXZs)) continue;
                const collision = newPlacements.some(p => {
                  if (p.tier !== t) return false;
                  const pb = boats.find(b => b.id === p.boatId);
                  if (!pb) return false;
                  return footprintsOverlap(xM, zM, boat.widthM, boat.lengthM, p.xM, p.zCenterM, pb.widthM, pb.lengthM);
                });
                if (!collision) {
                  newPlacements.push({ id: makeId(), boatId: boat.id, tier: t, xM, zCenterM: zM });
                  placed = true;
                  break;
                }
              }
            }
          }
        }

        set({ placements: newPlacements });
      },
    }),
    {
      name: 'rowing-trailer-planner',
      version: 2,
      migrate: () => ({ trailer: DEFAULT_TRAILER, boats: [], placements: [] }),
    }
  )
);
