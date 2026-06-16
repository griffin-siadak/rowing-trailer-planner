import type { Trailer } from './types';

export function computeTowerZs(trailer: Trailer): number[] {
  const halfLen = trailer.bedLengthM / 2;
  const towerInset = 0.20;
  const towerSpan = trailer.bedLengthM - 2 * towerInset;
  const n = Math.max(2, trailer.towerGroups.length);
  return Array.from({ length: n }, (_, i) =>
    halfLen - towerInset - (i / (n - 1)) * towerSpan
  );
}

// X positions for all posts within a tower group.
// count=1 → [xCenter]; count=2 → auto-thirds; 3-4 → fixed pitch.
export function getTowerXsForGroup(count: number, xCenter: number, trailerWidthM: number): number[] {
  if (count === 1) return [xCenter];
  if (count === 2) {
    const offset = trailerWidthM / 6;
    return [-offset, offset];
  }
  const pitch = 0.28;
  const half = (count - 1) * pitch / 2;
  return Array.from({ length: count }, (_, i) => xCenter - half + i * pitch);
}

// All tower post (x, z) positions for a trailer.
export function computeTowerXZs(trailer: Trailer): { x: number; z: number }[] {
  const towerZs = computeTowerZs(trailer);
  const result: { x: number; z: number }[] = [];
  trailer.towerGroups.forEach((group, gi) => {
    const tz = towerZs[gi];
    if (tz === undefined) return;
    getTowerXsForGroup(group.count, group.xCenter, trailer.trailerWidthM).forEach(tx => {
      result.push({ x: tx, z: tz });
    });
  });
  return result;
}

// Returns false if any tower post falls within the boat's hull footprint.
// gap: minimum clearance between hull edge and tower post centre (m).
export function boatClearsTowers(
  boatX: number, boatZ: number, boatW: number, boatL: number,
  towerXZs: { x: number; z: number }[],
  gap = 0.06,
): boolean {
  for (const { x: tx, z: tz } of towerXZs) {
    if (tz <= boatZ - boatL / 2 || tz >= boatZ + boatL / 2) continue;
    const hw = hullHalfWidth(tz - boatZ, boatL, boatW);
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

function hullHalfWidth(dz: number, l: number, w: number): number {
  const t = (2 * dz) / l;
  if (Math.abs(t) >= 1) return 0;
  return (w / 2) * Math.pow(1 - t * t, 0.38);
}

export function footprintsOverlap(
  ax: number, az: number, aw: number, al: number,
  bx: number, bz: number, bw: number, bl: number,
  gapX = 0.04,
): boolean {
  const overlapMin = Math.max(az - al / 2, bz - bl / 2);
  const overlapMax = Math.min(az + al / 2, bz + bl / 2);
  if (overlapMin >= overlapMax) return false;

  const dx = Math.abs(ax - bx);
  const N = 10;
  for (let i = 0; i <= N; i++) {
    const z = overlapMin + (overlapMax - overlapMin) * (i / N);
    if (dx < hullHalfWidth(z - az, al, aw) + hullHalfWidth(z - bz, bl, bw) + gapX) return true;
  }
  return false;
}
