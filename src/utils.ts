import type { Trailer, Boat } from './types';
import { boatHalfWidthAt } from './boatShape';

// Longitudinal Z of each tower group, taken straight from the explicit model.
export function computeTowerZs(trailer: Trailer): number[] {
  return trailer.towerGroups.map(g => g.zPosM);
}

// Vertical Y of each tier, accumulated from the bottom up.
// tiers[i].heightM = the band height below tier i (bottom tier's = clearance above the tray).
// Index 0 = top tier, last = bottom tier.
export function tierYs(trailer: Trailer): number[] {
  const n = trailer.tiers.length;
  const ys = new Array<number>(n);
  let acc = 0;
  for (let i = n - 1; i >= 0; i--) {
    acc += trailer.tiers[i]?.heightM ?? 0.55;
    ys[i] = acc;
  }
  return ys;
}

// All tower post (x, z) positions for a trailer, from explicit post placements.
export function computeTowerXZs(trailer: Trailer): { x: number; z: number }[] {
  const result: { x: number; z: number }[] = [];
  for (const group of trailer.towerGroups) {
    for (const tx of group.postXs) {
      result.push({ x: tx, z: group.zPosM });
    }
  }
  return result;
}

// Returns false if any tower post falls within the boat's hull footprint,
// using the boat's real beam profile so fine ends can clear a post.
// gap: minimum clearance between hull edge and tower post centre (m).
export function boatClearsTowers(
  boat: Boat, boatX: number, boatZ: number,
  towerXZs: { x: number; z: number }[],
  gap = 0.06,
): boolean {
  const halfL = boat.lengthM / 2;
  for (const { x: tx, z: tz } of towerXZs) {
    if (tz <= boatZ - halfL || tz >= boatZ + halfL) continue;
    const hw = boatHalfWidthAt(boat, tz - boatZ);
    if (Math.abs(boatX - tx) < hw + gap) return false;
  }
  return true;
}

export function isValidZ(zCenter: number, boatLength: number, towerZs: number[]): boolean {
  const zMin = zCenter - boatLength / 2;
  const zMax = zCenter + boatLength / 2;
  return towerZs.filter(z => z >= zMin && z <= zMax).length >= 2;
}

export function snapZ(
  dragZ: number,
  boatLength: number,
  towerZs: number[],
  bedHalfLen: number,
): number {
  let bestCenter = dragZ;
  let bestDist = Infinity;

  for (let i = 0; i < towerZs.length; i++) {
    for (let j = i + 1; j < towerZs.length; j++) {
      const minZ = Math.min(towerZs[i], towerZs[j]);
      const maxZ = Math.max(towerZs[i], towerZs[j]);
      if (maxZ - minZ > boatLength) continue;
      const cMin = maxZ - boatLength / 2;
      const cMax = minZ + boatLength / 2;
      if (cMin > cMax) continue;
      const nearest = Math.max(cMin, Math.min(cMax, dragZ));
      const dist = Math.abs(nearest - dragZ);
      if (dist < bestDist) { bestDist = dist; bestCenter = nearest; }
    }
  }

  if (bestDist === Infinity) {
    return Math.max(-(bedHalfLen + 5.0), Math.min(bedHalfLen + 5.0, dragZ));
  }
  return bestCenter;
}

// True if two boats' hulls overlap laterally anywhere along their shared span,
// sampling each boat's real beam profile so a fine bow can nest beside a wide midsection.
export function footprintsOverlap(
  a: Boat, ax: number, az: number,
  b: Boat, bx: number, bz: number,
  gapX = 0.04,
): boolean {
  const al = a.lengthM, bl = b.lengthM;
  const overlapMin = Math.max(az - al / 2, bz - bl / 2);
  const overlapMax = Math.min(az + al / 2, bz + bl / 2);
  if (overlapMin >= overlapMax) return false;

  const dx = Math.abs(ax - bx);
  const N = 12;
  for (let i = 0; i <= N; i++) {
    const z = overlapMin + (overlapMax - overlapMin) * (i / N);
    if (dx < boatHalfWidthAt(a, z - az) + boatHalfWidthAt(b, z - bz) + gapX) return true;
  }
  return false;
}
