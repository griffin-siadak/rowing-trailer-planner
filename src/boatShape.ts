import type { Boat, BoatShape } from './types';

// Longitudinal station fractions, bow (0) → stern (1). Curves store one value each.
export const STATIONS = [0, 0.25, 0.5, 0.75, 1] as const;
export const N_STATIONS = STATIONS.length;

export function sweepOrScull(boatClass: string): 'sweep' | 'scull' {
  return /[x]/i.test(boatClass) ? 'scull' : 'sweep';
}

// Rough crew + equipment load (kg) by class — on-water only.
const CREW_LOAD: Record<string, number> = {
  '1x': 85, '2x': 170, '2-': 170, '4x': 340, '4+': 360, '4-': 340, '8+': 720,
};

// Build a plausible default hull profile from the boat's basic dims.
export function defaultBoatShape(_lengthM: number, widthM: number, boatClass: string): BoatShape {
  const hb = widthM / 2;                       // max half-beam
  const beam = STATIONS.map(f => {
    const u = 2 * f - 1;                        // -1 bow … +1 stern
    return +Math.max(0.012, hb * Math.pow(Math.max(0, 1 - u * u), 0.38)).toFixed(4);
  });
  const depthMid = Math.max(0.16, widthM * 0.72);
  const depth = STATIONS.map(f => {
    const u = 2 * f - 1;
    return +Math.max(0.05, depthMid * Math.pow(Math.max(0, 1 - u * u), 0.30)).toFixed(4);
  });
  const rocker = STATIONS.map(f => { const u = 2 * f - 1; return +(0.05 * u * u).toFixed(4); });

  const type = sweepOrScull(boatClass);
  return {
    beam, depth, rocker,
    riggingWidthM: +(type === 'sweep' ? Math.max(widthM + 1.5, 1.6) : Math.max(widthM + 2.2, 2.4)).toFixed(3),
    boatType: type,
    loadKg: CREW_LOAD[boatClass] ?? 85,
    pitchLateralDeg: 0,
    pitchSternDeg: 4,
  };
}

// A boat's shape, computing a default on the fly if none is stored.
export function boatShapeOf(boat: Boat): BoatShape {
  return boat.shape ?? defaultBoatShape(boat.lengthM, boat.widthM, boat.boatClass);
}

// Linearly interpolate a station-curve at fraction f (0=bow … 1=stern).
export function sampleProfile(vals: number[], f: number): number {
  const n = vals.length;
  if (n === 0) return 0;
  const x = Math.max(0, Math.min(1, f)) * (n - 1);
  const i = Math.floor(x);
  if (i >= n - 1) return vals[n - 1];
  return vals[i] * (1 - (x - i)) + vals[i + 1] * (x - i);
}

// Convert a longitudinal position z (metres from hull centre, +z = bow) to a
// station fraction (0 = bow, 1 = stern).
function zToFrac(z: number, lengthM: number): number {
  return 0.5 - z / lengthM;
}

// Hull half-width (m) at longitudinal offset z from the boat's centre.
export function boatHalfWidthAt(boat: Boat, z: number): number {
  const half = boat.lengthM / 2;
  if (z < -half || z > half) return 0;
  return sampleProfile(boatShapeOf(boat).beam, zToFrac(z, boat.lengthM));
}

export function boatDepthAt(boat: Boat, z: number): number {
  return sampleProfile(boatShapeOf(boat).depth, zToFrac(z, boat.lengthM));
}

export function boatRockerAt(boat: Boat, z: number): number {
  return sampleProfile(boatShapeOf(boat).rocker, zToFrac(z, boat.lengthM));
}

// Max beam implied by a shape's beam curve (full width).
export function maxBeamOf(shape: BoatShape): number {
  return 2 * Math.max(...shape.beam);
}
