import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Boat, Trailer, Slot, Assignment } from './types';

function makeId() {
  return Math.random().toString(36).slice(2, 9);
}

function buildSlots(tiers: number, slotsPerTier: number): Slot[] {
  const slots: Slot[] = [];
  for (let t = 0; t < tiers; t++) {
    // Normal slots on each tier
    for (let p = 0; p < slotsPerTier; p++) {
      slots.push({
        id: makeId(),
        tier: t,
        position: p,
        maxLengthM: 20,
        maxWidthM: 2,
        maxWeightKg: t === 0 ? 150 : 300,
      });
    }
    // Slung slots hanging below this tier (not below the last tier, one fewer than normal slots)
    if (t < tiers - 1) {
      for (let p = 0; p < slotsPerTier - 1; p++) {
        slots.push({
          id: makeId(),
          tier: t,
          position: p,
          maxLengthM: 20,
          maxWidthM: 2,
          maxWeightKg: 200,
          slung: true,
        });
      }
    }
  }
  return slots;
}

// Staging rack slots use stable deterministic IDs so they survive store rebuilds
function buildStagingSlots(tiers: number, slotsPerTier: number): Slot[] {
  const slots: Slot[] = [];
  for (let t = 0; t < tiers; t++) {
    for (let p = 0; p < slotsPerTier; p++) {
      slots.push({
        id: `stg-${t}-${p}`,
        tier: t,
        position: p,
        maxLengthM: 20,
        maxWidthM: 2,
        maxWeightKg: 500,
      });
    }
  }
  return slots;
}

const DEFAULT_TRAILER: Trailer = {
  id: 'default',
  name: 'My Trailer',
  bedLengthM: 10.97,
  tiers: 3,
  slotsPerTier: 4,
  trailerWidthM: 2.44,
  slotWidthM: 0.55,
  tongueLengthM: 2.0,
  towerCount: 3,
  slots: buildSlots(3, 4),
};

const BOAT_CLASSES: Record<string, { lengthM: number; widthM: number; weightKg: number }> = {
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
  stagingSlots: Slot[];
  boats: Boat[];
  assignment: Assignment;

  updateTrailer: (patch: Partial<Omit<Trailer, 'slots'>>) => void;
  rebuildSlots: (tiers: number, slotsPerTier: number) => void;
  updateSlot: (slotId: string, patch: Partial<Slot>) => void;

  addBoat: (boat: Omit<Boat, 'id'>) => void;
  updateBoat: (id: string, patch: Partial<Boat>) => void;
  removeBoat: (id: string) => void;

  assign: (slotId: string, boatId: string | null) => void;
  clearAssignment: () => void;
  autoLayout: () => void;
  autoStageUnassigned: () => void;
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      trailer: DEFAULT_TRAILER,
      stagingSlots: buildStagingSlots(3, 4),
      boats: [],
      assignment: {},

      updateTrailer: (patch) =>
        set((s) => ({ trailer: { ...s.trailer, ...patch } })),

      rebuildSlots: (tiers, slotsPerTier) =>
        set((s) => ({
          trailer: {
            ...s.trailer,
            tiers,
            slotsPerTier,
            slots: buildSlots(tiers, slotsPerTier),
          },
          stagingSlots: buildStagingSlots(tiers, slotsPerTier),
          assignment: {},
        })),

      updateSlot: (slotId, patch) =>
        set((s) => ({
          trailer: {
            ...s.trailer,
            slots: s.trailer.slots.map((sl) =>
              sl.id === slotId ? { ...sl, ...patch } : sl
            ),
          },
        })),

      addBoat: (boat) => {
        const newBoat = { ...boat, id: makeId() };
        set((s) => {
          const assignment = { ...s.assignment };
          const occupiedSlots = new Set(Object.keys(assignment));
          const stagingSlot = s.stagingSlots.find(sl => !occupiedSlots.has(sl.id));
          if (stagingSlot) assignment[stagingSlot.id] = newBoat.id;
          return { boats: [...s.boats, newBoat], assignment };
        });
      },

      updateBoat: (id, patch) =>
        set((s) => ({ boats: s.boats.map((b) => (b.id === id ? { ...b, ...patch } : b)) })),

      removeBoat: (id) =>
        set((s) => {
          const assignment = { ...s.assignment };
          for (const slotId of Object.keys(assignment)) {
            if (assignment[slotId] === id) delete assignment[slotId];
          }
          return { boats: s.boats.filter((b) => b.id !== id), assignment };
        }),

      assign: (slotId, boatId) =>
        set((s) => {
          const assignment = { ...s.assignment };
          // remove boat from wherever it currently sits
          if (boatId) {
            for (const sid of Object.keys(assignment)) {
              if (assignment[sid] === boatId) delete assignment[sid];
            }
            assignment[slotId] = boatId;
          } else {
            delete assignment[slotId];
          }
          return { assignment };
        }),

      clearAssignment: () => set({ assignment: {} }),

      autoLayout: () => {
        const { trailer, boats } = get();
        const assignment: Assignment = {};

        // Sort boats heaviest first so heavy boats get lower tiers
        const sorted = [...boats].sort((a, b) => b.weightKg - a.weightKg);

        // Sort slots: lowest tier first (highest tier index = bottom of trailer),
        // then left to right within tier
        const maxTier = trailer.tiers - 1;
        const sortedSlots = [...trailer.slots].filter(s => !s.slung).sort((a, b) => {
          const aTierScore = maxTier - a.tier; // bottom tier scores highest
          const bTierScore = maxTier - b.tier;
          if (bTierScore !== aTierScore) return bTierScore - aTierScore;
          return a.position - b.position;
        });

        const usedSlots = new Set<string>();

        for (const boat of sorted) {
          for (const slot of sortedSlots) {
            if (usedSlots.has(slot.id)) continue;
            if (
              boat.lengthM <= slot.maxLengthM &&
              boat.widthM <= slot.maxWidthM &&
              boat.weightKg <= slot.maxWeightKg
            ) {
              assignment[slot.id] = boat.id;
              usedSlots.add(slot.id);
              break;
            }
          }
        }

        set({ assignment });
      },

      autoStageUnassigned: () => {
        const { boats, stagingSlots, assignment: cur } = get();
        const assignment = { ...cur };
        const assignedBoatIds = new Set(Object.values(assignment));
        const occupiedSlots   = new Set(Object.keys(assignment));
        for (const boat of boats) {
          if (assignedBoatIds.has(boat.id)) continue;
          const slot = stagingSlots.find(sl => !occupiedSlots.has(sl.id));
          if (!slot) break;
          assignment[slot.id] = boat.id;
          occupiedSlots.add(slot.id);
          assignedBoatIds.add(boat.id);
        }
        set({ assignment });
      },
    }),
    { name: 'rowing-trailer-planner' }
  )
);

export { BOAT_CLASSES };
export { buildSlots };
