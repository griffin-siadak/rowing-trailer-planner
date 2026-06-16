export interface Boat {
  id: string;
  name: string;
  manufacturer?: string;
  boatClass: string; // '1x', '2x', '4+', '8+', etc.
  lengthM: number;
  widthM: number;
  weightKg: number;
}

export interface Slot {
  id: string;
  tier: number;     // 0 = top, higher = lower (bottom); for slung slots = the tier they hang below
  position: number; // left-to-right index
  maxLengthM: number;
  maxWidthM: number;
  maxWeightKg: number;
  slung?: boolean;  // if true, boat is strapped inverted below the tier's rail
}

export interface Trailer {
  id: string;
  name: string;
  bedLengthM: number;
  tiers: number;
  slotsPerTier: number;
  trailerWidthM: number;    // overall outer tray width (m) — drives chassis, fenders, axle, independent of boats
  slotWidthM: number;       // fixed bay width per slot — controls arm/rail spacing
  tongueLengthM: number;    // length of tongue from front tower to coupler (m)
  towerCount: number;       // number of towers, evenly spaced along the tray
  slots: Slot[];
}

export type Assignment = Record<string, string>; // slotId -> boatId
