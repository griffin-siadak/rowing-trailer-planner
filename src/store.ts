import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Boat, Trailer, TierDef, TowerGroup, AxleDef, BoatPlacement } from './types';
import { computeTowerZs, computeTowerXZs, isValidZ, snapZ, footprintsOverlap, boatClearsTowers } from './utils';
import { defaultBoatShape, resampleCurve, N_STATIONS } from './boatShape';
import { defaultLivery } from './livery';

function makeId() {
  return Math.random().toString(36).slice(2, 9);
}

// ── Geometry defaults (kept in sync with the 3D renderer constants) ──────────
const DEFAULT_TIER_HEIGHT = 0.55;
const DEFAULT_POST_WIDTH  = 0.08;
const DEFAULT_BEAM_WIDTH   = 0.10;
// Tray wall height above the deck floor. 0.34 keeps the tray top at the same
// place it used to sit (bottom tier 0.55 − 0.04 gap − deck 0.17).
export const DEFAULT_TRAY_HEIGHT = 0.34;

// Chassis half-width derived the same way the renderer does.
function chassisHalfWidth(trailerWidthM: number, beamWidthM = DEFAULT_BEAM_WIDTH) {
  return trailerWidthM / 2 - 0.025 - beamWidthM / 2;
}

// Legacy lateral post positions for a group: 1 post = centred; 2 posts = trailer thirds.
function legacyPostXs(count: number, xCenter: number, trailerWidthM: number): number[] {
  if (count <= 1) return [xCenter];
  const off = trailerWidthM / 6;
  return [-off, off];
}

// Build a complete trailer from basic dimensions + per-group/tier counts.
function buildTrailer(opts: {
  id?: string; name?: string;
  bedLengthM: number; trailerWidthM: number; tongueLengthM: number;
  tierCount: number;
  groups: { id?: string; postXs: number[]; postWidthM?: number }[];
}): Trailer {
  const { bedLengthM, trailerWidthM, tongueLengthM, tierCount, groups } = opts;
  const halfLen = bedLengthM / 2;
  const beamWidthM = DEFAULT_BEAM_WIDTH;
  const chHW = chassisHalfWidth(trailerWidthM, beamWidthM);

  const inset = 0.20;
  const span  = bedLengthM - 2 * inset;
  const n     = Math.max(2, groups.length);
  const towerGroups: TowerGroup[] = groups.map((g, i) => ({
    id: g.id ?? makeId(),
    zPosM: halfLen - inset - (i / (n - 1)) * span,
    postXs: g.postXs,
    postWidthM: g.postWidthM ?? DEFAULT_POST_WIDTH,
  }));

  const tiers: TierDef[] = Array.from({ length: tierCount }, () => ({
    id: makeId(), heightM: DEFAULT_TIER_HEIGHT, railWidthM: trailerWidthM,
  }));

  const axleMidZ = halfLen - bedLengthM * 0.60;
  const trackWidthM = 2 * (chHW + 0.30);
  const axles: AxleDef[] = [
    { id: makeId(), zPosM: axleMidZ - 0.46, trackWidthM, wheelDiaM: 0.54 },
    { id: makeId(), zPosM: axleMidZ + 0.46, trackWidthM, wheelDiaM: 0.54 },
  ];

  return {
    id: opts.id ?? 'default',
    name: opts.name ?? 'My Trailer',
    bedLengthM, trailerWidthM, tongueLengthM,
    beamWidthM, beamSpacingM: 2 * chHW,
    trayHeightM: DEFAULT_TRAY_HEIGHT,
    tiers, towerGroups, axles,
  };
}

const DEFAULT_TRAILER: Trailer = buildTrailer({
  bedLengthM: 10.97, trailerWidthM: 2.44, tongueLengthM: 2.0,
  tierCount: 4,
  groups: Array.from({ length: 4 }, () => ({ postXs: legacyPostXs(2, 0, 2.44) })),
});

// Convert a legacy (v≤3) uniform trailer into the explicit v4 model.
function legacyToTrailer(old: {
  id?: string; name?: string; bedLengthM?: number; trailerWidthM?: number;
  tongueLengthM?: number; tiers?: number;
  towerGroups?: { id?: string; count?: number; xCenter?: number }[];
}): Trailer {
  const trailerWidthM = old.trailerWidthM ?? 2.44;
  const groups = (old.towerGroups ?? []).map(g => ({
    id: g.id,
    postXs: legacyPostXs(g.count ?? 1, g.xCenter ?? 0, trailerWidthM),
  }));
  return buildTrailer({
    id: old.id, name: old.name,
    bedLengthM: old.bedLengthM ?? 10.97,
    trailerWidthM,
    tongueLengthM: old.tongueLengthM ?? 2.0,
    tierCount: typeof old.tiers === 'number' ? old.tiers : 4,
    groups: groups.length >= 2 ? groups : DEFAULT_TRAILER.towerGroups.map(g => ({ postXs: g.postXs })),
  });
}

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
  updateTowerGroup: (id: string, patch: Partial<Pick<TowerGroup, 'zPosM' | 'postXs' | 'postWidthM'>>) => void;

  addTier: () => void;
  removeTier: (id: string) => void;
  updateTier: (id: string, patch: Partial<Pick<TierDef, 'heightM' | 'railWidthM'>>) => void;

  addAxle: () => void;
  removeAxle: (id: string) => void;
  updateAxle: (id: string, patch: Partial<Pick<AxleDef, 'zPosM' | 'trackWidthM' | 'wheelDiaM'>>) => void;

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
        set((s) => ({
          boats: [...s.boats, {
            ...boat, id: makeId(),
            shape: boat.shape ?? defaultBoatShape(boat.lengthM, boat.widthM, boat.boatClass),
            livery: boat.livery ?? defaultLivery(boat.manufacturer, '#2563eb'),
          }],
        })),

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
          if (slung && p && p.tier === s.trailer.tiers.length - 1) return s;
          return { placements: s.placements.map(pl => pl.id === id ? { ...pl, slung } : pl) };
        }),

      removePlacement: (id) =>
        set((s) => ({ placements: s.placements.filter(p => p.id !== id) })),

      clearPlacements: () => set({ placements: [] }),

      clearAll: () => set({ boats: [], placements: [] }),

      addTowerGroup: () =>
        set((s) => {
          const groups = s.trailer.towerGroups;
          const last = groups[groups.length - 1];
          // Drop the new group into the largest gap between existing groups (and bed edges).
          const halfLen = s.trailer.bedLengthM / 2 - 0.20;
          const pts = [-halfLen, ...groups.map(g => g.zPosM).sort((a, b) => a - b), halfLen];
          let zPosM = 0, bestGap = -1;
          for (let i = 0; i < pts.length - 1; i++) {
            const gap = pts[i + 1] - pts[i];
            if (gap > bestGap) { bestGap = gap; zPosM = (pts[i] + pts[i + 1]) / 2; }
          }
          return {
            trailer: {
              ...s.trailer,
              towerGroups: [
                ...groups,
                { id: makeId(), zPosM, postXs: last ? [...last.postXs] : [0], postWidthM: last?.postWidthM ?? DEFAULT_POST_WIDTH },
              ],
            },
          };
        }),

      removeTowerGroup: (id) =>
        set((s) => {
          if (s.trailer.towerGroups.length <= 2) return s;
          return {
            trailer: { ...s.trailer, towerGroups: s.trailer.towerGroups.filter(g => g.id !== id) },
          };
        }),

      updateTowerGroup: (id, patch) =>
        set((s) => ({
          trailer: {
            ...s.trailer,
            towerGroups: s.trailer.towerGroups.map(g => g.id === id ? { ...g, ...patch } : g),
          },
        })),

      addTier: () =>
        set((s) => {
          const last = s.trailer.tiers[s.trailer.tiers.length - 1];
          return {
            trailer: {
              ...s.trailer,
              tiers: [
                ...s.trailer.tiers,
                { id: makeId(), heightM: last?.heightM ?? DEFAULT_TIER_HEIGHT, railWidthM: last?.railWidthM ?? s.trailer.trailerWidthM },
              ],
            },
          };
        }),

      removeTier: (id) =>
        set((s) => {
          if (s.trailer.tiers.length <= 1) return s;
          return { trailer: { ...s.trailer, tiers: s.trailer.tiers.filter(t => t.id !== id) } };
        }),

      updateTier: (id, patch) =>
        set((s) => ({
          trailer: {
            ...s.trailer,
            tiers: s.trailer.tiers.map(t => t.id === id ? { ...t, ...patch } : t),
          },
        })),

      addAxle: () =>
        set((s) => {
          const last = s.trailer.axles[s.trailer.axles.length - 1];
          return {
            trailer: {
              ...s.trailer,
              axles: [
                ...s.trailer.axles,
                { id: makeId(), zPosM: (last?.zPosM ?? 0) - 0.92, trackWidthM: last?.trackWidthM ?? 2.89, wheelDiaM: last?.wheelDiaM ?? 0.54 },
              ],
            },
          };
        }),

      removeAxle: (id) =>
        set((s) => {
          if (s.trailer.axles.length <= 1) return s;
          return { trailer: { ...s.trailer, axles: s.trailer.axles.filter(a => a.id !== id) } };
        }),

      updateAxle: (id, patch) =>
        set((s) => ({
          trailer: {
            ...s.trailer,
            axles: s.trailer.axles.map(a => a.id === id ? { ...a, ...patch } : a),
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
          // Normal boats fill from the top tier down; slung boats prioritise the
          // lower tiers first (bottom tier itself is excluded from slinging below).
          const tierOrder = Array.from({ length: trailer.tiers.length }, (_, i) => i);
          if (slung) tierOrder.reverse();
          for (const t of tierOrder) {
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
                if (slung && t === trailer.tiers.length - 1) continue;
                if (t >= trailer.tiers.length - 2 && zM + boat.lengthM / 2 > bowFrontLimit) continue;
                if (!slung && t > 0 && !boatClearsTowers(boat, xM, zM, towerXZs)) continue;
                const collision = newPlacements.some(p => {
                  if (p.tier !== t || !!p.slung !== slung) return false;
                  const pb = boats.find(b => b.id === p.boatId);
                  if (!pb) return false;
                  return footprintsOverlap(boat, xM, zM, pb, p.xM, p.zCenterM);
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
      version: 8,
      migrate: (state: unknown, version: number) => {
        const s = state as { trailer?: Record<string, unknown>; boats?: unknown[]; placements?: unknown[] } | undefined;
        if (!s || !s.trailer) return { trailer: DEFAULT_TRAILER, boats: [], placements: [] };
        // v≤3 used a uniform model (tiers:number, towerGroups{count,xCenter}).
        // Convert any such trailer into the explicit v4 geometry model.
        const t = s.trailer as Record<string, unknown>;
        const isLegacy = typeof t.tiers === 'number'
          || (Array.isArray(t.towerGroups) && t.towerGroups[0] != null && 'count' in (t.towerGroups[0] as object));
        if (version < 4 && isLegacy) {
          return { ...s, trailer: legacyToTrailer(t as Parameters<typeof legacyToTrailer>[0]) };
        }
        // v4→v5: tray height became an independent field.
        if (t.trayHeightM == null) t.trayHeightM = DEFAULT_TRAY_HEIGHT;
        // v5→v6: every boat gains a parametric hull shape.
        // v6→v7: shape curves resampled onto the finer 9-station grid.
        // v7→v8: every boat gains an editable livery (manufacturer default).
        if (Array.isArray(s.boats)) {
          for (const b of s.boats as { lengthM: number; widthM: number; boatClass: string; manufacturer?: string; shape?: { beam: number[]; depth: number[]; rocker: number[] }; livery?: unknown }[]) {
            if (!b) continue;
            if (b.shape == null) {
              b.shape = defaultBoatShape(b.lengthM, b.widthM, b.boatClass);
            } else if (b.shape.beam.length !== N_STATIONS) {
              b.shape.beam   = resampleCurve(b.shape.beam);
              b.shape.depth  = resampleCurve(b.shape.depth);
              b.shape.rocker = resampleCurve(b.shape.rocker);
            }
            if (b.livery == null) b.livery = defaultLivery(b.manufacturer, '#2563eb');
          }
        }
        return s;
      },
    }
  )
);
