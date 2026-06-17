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
  tiers: 4,
  trailerWidthM: 2.44,
  tongueLengthM: 2.0,
  towerGroups: [
    { id: 'tg1', count: 2, xCenter: 0 },
    { id: 'tg2', count: 2, xCenter: 0 },
    { id: 'tg3', count: 2, xCenter: 0 },
    { id: 'tg4', count: 2, xCenter: 0 },
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
        set((s) => {
          const p = s.placements.find(pl => pl.id === id);
          const boat = p ? s.boats.find(b => b.id === p.boatId) : null;
          if (slung && boat && !['1x', '2x', '2-'].includes(boat.boatClass)) return s;
          if (slung && p && p.tier === s.trailer.tiers - 1) return s;
          return { placements: s.placements.map(pl => pl.id === id ? { ...pl, slung } : pl) };
        }),

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
              { id: makeId(), count: s.trailer.towerGroups[0]?.count ?? 1, xCenter: s.trailer.towerGroups[0]?.xCenter ?? 0 },
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
        // Bow of boats on the lowest 2 tiers cannot extend past half the tongue length
        const bowFrontLimit = halfLen + trailer.tongueLengthM / 2;
        // Tandem-axle midpoint (matches 3D model: 60% back from tray front).
        // Heavier boats are biased to sit over this Z so the bulk of weight rests on the axles.
        const axleZ = halfLen - trailer.bedLengthM * 0.60;

        const LARGE_CLASSES = new Set(['8+', '4+', '4-', '4x']);
        const SLINGABLE     = new Set(['1x', '2x', '2-']);

        // Dense Z candidates: 0.25 m samples across the full bed plus tower-pair midpoints.
        // snapZ maps each raw value to the nearest valid slot; dedup collapses collisions.
        const candidateZs: number[] = [0];
        for (let i = 0; i < towerZs.length - 1; i++) {
          for (let j = i + 1; j < towerZs.length; j++) {
            candidateZs.push((towerZs[i] + towerZs[j]) / 2);
          }
        }
        for (let z = -halfLen; z <= halfLen; z += 0.25) candidateZs.push(z);

        // 4-person+ classes first (keeps longer boats on the higher tiers, which fill first),
        // then within each group heaviest first so the heaviest boats claim the axle-zone slots.
        const sorted = [...boats].sort((a, b) => {
          const ap = LARGE_CLASSES.has(a.boatClass) ? 0 : 1;
          const bp = LARGE_CLASSES.has(b.boatClass) ? 0 : 1;
          if (ap !== bp) return ap - bp;
          return (b.weightKg - a.weightKg) || (b.lengthM - a.lengthM);
        });

        const newPlacements: BoatPlacement[] = [];

        function tryPlace(boat: typeof boats[0], slung: boolean): boolean {
          for (let t = 0; t < trailer.tiers; t++) {
            const xStep = boat.widthM + GAP;
            const xStart = -halfW + boat.widthM / 2;
            const xEnd   =  halfW - boat.widthM / 2;
            for (let xM = xStart; xM <= xEnd + 0.001; xM += xStep) {
              // Snap all candidates and deduplicate
              const seen = new Set<number>();
              const validZs = candidateZs
                .map(z => snapZ(z, boat.lengthM, towerZs, halfLen))
                .filter(z => {
                  const key = Math.round(z * 1000);
                  if (seen.has(key)) return false;
                  seen.add(key);
                  return isValidZ(z, boat.lengthM, towerZs);
                })
                .sort((a, b) => Math.abs(a - axleZ) - Math.abs(b - axleZ));
              for (const zM of validZs) {
                if (slung && t === trailer.tiers - 1) continue;
                if (t >= trailer.tiers - 2 && zM + boat.lengthM / 2 > bowFrontLimit) continue;
                if (!slung && t > 0 && !boatClearsTowers(xM, zM, boat.widthM, boat.lengthM, towerXZs)) continue;
                const collision = newPlacements.some(p => {
                  if (p.tier !== t || !!p.slung !== slung) return false;
                  const pb = boats.find(b => b.id === p.boatId);
                  if (!pb) return false;
                  return footprintsOverlap(xM, zM, boat.widthM, boat.lengthM, p.xM, p.zCenterM, pb.widthM, pb.lengthM);
                });
                if (!collision) {
                  newPlacements.push({ id: makeId(), boatId: boat.id, tier: t, xM, zCenterM: zM, slung: slung || undefined });
                  return true;
                }
              }
            }
          }
          return false;
        }

        // Phase 1: normal placement for all boats
        const unplaced: typeof boats = [];
        for (const boat of sorted) {
          if (!tryPlace(boat, false)) unplaced.push(boat);
        }

        // Phase 2: slung placement only for eligible boats with no normal slot available
        for (const boat of unplaced) {
          if (SLINGABLE.has(boat.boatClass)) tryPlace(boat, true);
        }

        set({ placements: newPlacements });
      },
    }),
    {
      name: 'rowing-trailer-planner',
      version: 3,
      migrate: (state: unknown, version: number) => {
        if (version < 2) return { trailer: DEFAULT_TRAILER, boats: [], placements: [] };
        // v2→v3: normalise all tower groups to the same count and xCenter as the first group
        const s = state as { trailer: { towerGroups?: { id: string; count: number; xCenter: number }[] }; boats: unknown[]; placements: unknown[] };
        const groups = s.trailer?.towerGroups ?? [];
        const count   = groups[0]?.count   ?? 1;
        const xCenter = groups[0]?.xCenter ?? 0;
        return {
          ...s,
          trailer: {
            ...s.trailer,
            towerGroups: groups.map(g => ({ ...g, count, xCenter })),
          },
        };
      },
    }
  )
);
