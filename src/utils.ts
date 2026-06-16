import type { Trailer } from './types';

export function computeTowerZs(trailer: Trailer): number[] {
  const halfLen = trailer.bedLengthM / 2;
  const towerInset = 0.20;
  const towerSpan = trailer.bedLengthM - 2 * towerInset;
  const n = Math.max(2, trailer.towerCount);
  return Array.from({ length: n }, (_, i) =>
    halfLen - towerInset - (i / (n - 1)) * towerSpan
  );
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
    return Math.max(-bedHalfLen + boatLength / 2, Math.min(bedHalfLen - boatLength / 2, dragZ));
  }
  return bestCenter;
}

// Approximate hull half-width at a given distance from the boat's centre along Z.
// Uses a power profile (exponent < 0.5 → sharper tips than an ellipse) to match
// the bezier hull shape used in the 2D and 3D views.
function hullHalfWidth(dz: number, l: number, w: number): number {
  const t = (2 * dz) / l; // −1 = bow tip, +1 = stern tip
  if (Math.abs(t) >= 1) return 0;
  return (w / 2) * Math.pow(1 - t * t, 0.38);
}

// Shape-aware overlap: samples the tapered hull profile across the Z overlap zone
// so boats can be placed closer at bow/stern than the full beam would allow.
export function footprintsOverlap(
  ax: number, az: number, aw: number, al: number,
  bx: number, bz: number, bw: number, bl: number,
  gapX = 0.04,
): boolean {
  const overlapMin = Math.max(az - al / 2, bz - bl / 2);
  const overlapMax = Math.min(az + al / 2, bz + bl / 2);
  if (overlapMin >= overlapMax) return false; // no longitudinal overlap at all

  const dx = Math.abs(ax - bx);
  const N = 10;
  for (let i = 0; i <= N; i++) {
    const z = overlapMin + (overlapMax - overlapMin) * (i / N);
    if (dx < hullHalfWidth(z - az, al, aw) + hullHalfWidth(z - bz, bl, bw) + gapX) return true;
  }
  return false;
}
