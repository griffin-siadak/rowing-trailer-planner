import React, { Suspense, useRef, useMemo, useState, useCallback, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Text } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../store';
import type { Boat, Slot } from '../types';

// â”€â”€ Fallback palette (used when manufacturer is unknown) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const BOAT_COLORS = [
  '#2563eb', '#dc2626', '#16a34a', '#d97706', '#7c3aed',
  '#db2777', '#0891b2', '#65a30d', '#ea580c', '#4f46e5',
];

// â”€â”€ Manufacturer themes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// hull/deck: colours. roughness: 0=glossy, 1=matte. metalness: carbon ~0.30-0.50.
// vShape: cross-section power â€” <1=rounder U-bottom, 1=parabola, >1=sharper V.
// bowPower/sternPower: how quickly the plan-view taper closes at each end.
//   Higher value = finer / longer pointed run (knife entry).
//   Lower value  = fuller / blunter end (open-water or traditional form).
// maxBeamT: where the widest point sits, expressed as fraction from stern(0) to bow(1).
//   0.50 = symmetric. <0.50 = max beam aft (swede form, finer bow). >0.50 = max beam fwd (fish form).
// Skeg (fin) geometry config.
// chord:      fore-aft length at keel attachment (m)
// height:     how far the fin protrudes from the keel (m)
// leadSweep:  how far the leading-edge tip is aft of its root (0 = vertical, >0 = raked back)
// trailSweep: how far the trailing-edge tip is fwd of its root (>0 = tapered toward bow at tip)
// posF:       fraction of boat length from the stern tip to the aft edge of the fin
interface SkegConfig {
  chord: number; height: number;
  leadSweep: number; trailSweep: number;
  posF: number;
}

interface ManufacturerTheme {
  hull: string; deck: string;
  roughness: number; metalness: number;
  vShape: number;
  bowPower: number; sternPower: number; maxBeamT: number;
  skeg: SkegConfig;
}

const MANUFACTURER_THEMES: Record<string, ManufacturerTheme> = {
  // Filippi: white hull, cobalt-blue deck. Fine bow, rounder midsection.
  // Newer F14/F15 fins: black anodised aluminium, 45Â° swept leading edge.
  'Filippi': {
    hull: '#f4f2ec', deck: '#1a4fa0', roughness: 0.28, metalness: 0.14,
    vShape: 0.72, bowPower: 1.10, sternPower: 0.85, maxBeamT: 0.46,
    skeg: { chord: 0.120, height: 0.045, leadSweep: 0.045, trailSweep: 0.028, posF: 0.09 },
  },

  // Empacher: chrome-yellow. Large aluminium fin â€” known to be oversized, commonly trimmed.
  'Empacher': {
    hull: '#f0c020', deck: '#e8b400', roughness: 0.22, metalness: 0.08,
    vShape: 0.80, bowPower: 0.95, sternPower: 0.88, maxBeamT: 0.48,
    skeg: { chord: 0.130, height: 0.050, leadSweep: 0.006, trailSweep: 0.038, posF: 0.08 },
  },

  // WinTech Racing: royal blue. Production shells â€” standard fin.
  'WinTech Racing': {
    hull: '#1555b8', deck: '#0f3e8a', roughness: 0.38, metalness: 0.12,
    vShape: 0.88, bowPower: 0.90, sternPower: 0.85, maxBeamT: 0.49,
    skeg: { chord: 0.110, height: 0.038, leadSweep: 0.010, trailSweep: 0.028, posF: 0.09 },
  },

  // Swift Racing: silver/carbon. Fine bow, moderately swept fin.
  'Swift Racing': {
    hull: '#8090a0', deck: '#606e7a', roughness: 0.18, metalness: 0.40,
    vShape: 1.00, bowPower: 1.15, sternPower: 0.95, maxBeamT: 0.46,
    skeg: { chord: 0.115, height: 0.042, leadSweep: 0.012, trailSweep: 0.030, posF: 0.09 },
  },

  // Pocock: dark navy. xVIII conic-section hull â€” clean, precise entries.
  'Pocock Racing Shells': {
    hull: '#1c2d60', deck: '#c0c4cc', roughness: 0.22, metalness: 0.28,
    vShape: 1.00, bowPower: 1.10, sternPower: 0.92, maxBeamT: 0.47,
    skeg: { chord: 0.115, height: 0.042, leadSweep: 0.010, trailSweep: 0.030, posF: 0.09 },
  },

  // Vespoli: black + orange. Pronounced swede form; patent data confirms finer bow.
  'Vespoli USA': {
    hull: '#181818', deck: '#e85000', roughness: 0.14, metalness: 0.48,
    vShape: 1.00, bowPower: 1.20, sternPower: 0.88, maxBeamT: 0.44,
    skeg: { chord: 0.120, height: 0.045, leadSweep: 0.008, trailSweep: 0.032, posF: 0.08 },
  },

  // Hudson: dark navy. "Shark" design â€” modern swede form.
  'Hudson Boat Works': {
    hull: '#0d2a50', deck: '#1840a0', roughness: 0.20, metalness: 0.32,
    vShape: 0.92, bowPower: 1.15, sternPower: 0.92, maxBeamT: 0.46,
    skeg: { chord: 0.115, height: 0.043, leadSweep: 0.010, trailSweep: 0.030, posF: 0.09 },
  },

  // Janousek & Stampfli: silver-grey. European precision, slight swede.
  'Janousek & Stampfli': {
    hull: '#8a9db0', deck: '#b0c2d0', roughness: 0.16, metalness: 0.44,
    vShape: 0.82, bowPower: 1.12, sternPower: 0.92, maxBeamT: 0.46,
    skeg: { chord: 0.118, height: 0.044, leadSweep: 0.008, trailSweep: 0.030, posF: 0.09 },
  },

  // Sykes Racing: bright white. Modern Australian shells.
  'Sykes Racing': {
    hull: '#e8eaec', deck: '#d4d8dc', roughness: 0.28, metalness: 0.20,
    vShape: 0.90, bowPower: 1.00, sternPower: 0.90, maxBeamT: 0.47,
    skeg: { chord: 0.110, height: 0.038, leadSweep: 0.012, trailSweep: 0.028, posF: 0.09 },
  },

  // Kaschper: dark charcoal-blue. Canadian shells, near-symmetric form.
  'Kaschper': {
    hull: '#1a2038', deck: '#2a3460', roughness: 0.20, metalness: 0.32,
    vShape: 1.00, bowPower: 0.92, sternPower: 0.88, maxBeamT: 0.49,
    skeg: { chord: 0.110, height: 0.038, leadSweep: 0.010, trailSweep: 0.028, posF: 0.09 },
  },

  // Carl Douglas: wood-Kevlar. ~2 mm aluminium flat plate, near-vertical leading edge.
  // "Deep-Vee bow section"; slight fish form.
  'Carl Douglas': {
    hull: '#c09030', deck: '#a87020', roughness: 0.68, metalness: 0.04,
    vShape: 0.85, bowPower: 1.00, sternPower: 0.72, maxBeamT: 0.52,
    skeg: { chord: 0.105, height: 0.035, leadSweep: 0.005, trailSweep: 0.022, posF: 0.10 },
  },

  // Resolute Racing Shells: near-black carbon. Modern fine entry, swede form.
  'Resolute Racing Shells': {
    hull: '#1a1a1a', deck: '#2c2c2c', roughness: 0.16, metalness: 0.50,
    vShape: 1.00, bowPower: 1.12, sternPower: 0.92, maxBeamT: 0.46,
    skeg: { chord: 0.112, height: 0.040, leadSweep: 0.010, trailSweep: 0.030, posF: 0.09 },
  },

  // Van Dusen: silver carbon. Ultra-lightweight; fine elongated bow.
  'Van Dusen': {
    hull: '#b8c4cc', deck: '#a0aeb8', roughness: 0.18, metalness: 0.42,
    vShape: 1.00, bowPower: 1.18, sternPower: 0.92, maxBeamT: 0.45,
    skeg: { chord: 0.110, height: 0.040, leadSweep: 0.012, trailSweep: 0.028, posF: 0.09 },
  },

  // Fluidesign: ultra-dark carbon, high gloss. Fine entry, swede form.
  'Fluidesign': {
    hull: '#0c1520', deck: '#18283a', roughness: 0.12, metalness: 0.56,
    vShape: 1.05, bowPower: 1.15, sternPower: 0.92, maxBeamT: 0.46,
    skeg: { chord: 0.112, height: 0.042, leadSweep: 0.015, trailSweep: 0.030, posF: 0.09 },
  },

  // Kanghua: red + white. Chinese national shells, modern fine-entry form.
  'Kanghua': {
    hull: '#c00000', deck: '#f0f0f0', roughness: 0.34, metalness: 0.10,
    vShape: 0.88, bowPower: 1.00, sternPower: 0.88, maxBeamT: 0.48,
    skeg: { chord: 0.110, height: 0.038, leadSweep: 0.010, trailSweep: 0.028, posF: 0.09 },
  },

  // BBG: pale grey-blue. Training shells â€” smaller fin suits calmer flat-water use.
  'BBG': {
    hull: '#dce4f0', deck: '#c4d0e4', roughness: 0.36, metalness: 0.14,
    vShape: 0.84, bowPower: 0.80, sternPower: 0.78, maxBeamT: 0.49,
    skeg: { chord: 0.100, height: 0.030, leadSweep: 0.008, trailSweep: 0.022, posF: 0.10 },
  },

  // Peinert Boat Works: white composite. Standard racing form.
  'Peinert Boat Works': {
    hull: '#f0f0f0', deck: '#e0e0e0', roughness: 0.42, metalness: 0.10,
    vShape: 1.00, bowPower: 1.00, sternPower: 0.90, maxBeamT: 0.47,
    skeg: { chord: 0.108, height: 0.036, leadSweep: 0.010, trailSweep: 0.026, posF: 0.09 },
  },

  // Little River Marine: cream. Open-water/coastal â€” smaller fin for calmer conditions.
  'Little River Marine': {
    hull: '#f5f0e4', deck: '#e8e0cc', roughness: 0.48, metalness: 0.06,
    vShape: 0.62, bowPower: 0.65, sternPower: 0.65, maxBeamT: 0.50,
    skeg: { chord: 0.095, height: 0.028, leadSweep: 0.008, trailSweep: 0.020, posF: 0.10 },
  },

  // Maas Boat Company: white. Open-water: full flared form, small fin.
  'Maas Boat Company': {
    hull: '#f4f4f4', deck: '#e8e8e8', roughness: 0.42, metalness: 0.08,
    vShape: 0.68, bowPower: 0.68, sternPower: 0.68, maxBeamT: 0.50,
    skeg: { chord: 0.095, height: 0.028, leadSweep: 0.008, trailSweep: 0.020, posF: 0.10 },
  },
};

// â”€â”€ Layout constants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const TIER_HEIGHT  = 0.55;
const TIER_BASE_Y  = 0.55; // clearance above tray deck for bottom tier (~38 cm above chassis top)
const BOAT_GAP_X   = 0.14; // lateral gap between adjacent gunwales on the same tier

// â”€â”€ Bow orientation convention â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// In buildHullGeometry: t=0 â†’ STERN tip (z = âˆ’lengthM/2), t=1 â†’ BOW tip (z = +lengthM/2).
// In the scene: the trailer tongue runs toward +Z. ShellMesh applies no rotation, so the
// bow (positive-Z end) always faces the tongue. Do NOT add a Y-rotation to ShellMesh
// without updating this convention â€” it would silently flip all boats stern-first.
const BOW_Z_LOCAL   = 1;      // sign for the bow end in local Z (+1 = positive Z)
const BOW_BALL_R    = 0.025;  // FISA bow-ball radius â‰ˆ 4 cm diameter
// Minimum taper fraction at bow/stern tips â€” shared by hull geometry, deck outline, and bow-ball placement.
// At the tip, hull width = widthM Ã— HULL_MIN_TIP and keel height = depth Ã— HULL_MIN_TIP.
const HULL_MIN_TIP  = 0.030;

function tierY(tier: number, totalTiers: number) {
  return (totalTiers - 1 - tier) * TIER_HEIGHT + TIER_BASE_Y;
}

function slingY(upperTier: number, totalTiers: number) {
  // Gunwale (y=0 in local space) flush against the pad bottom face of the upper rail
  return tierY(upperTier, totalTiers);
}

// â”€â”€ Hull geometry factory â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Open-top V-shaped cross-section: port gunwale (âˆ’hw,0) â†’ keel (0,âˆ’depth) â†’ starboard (hw,0).
// Parabolic floor: y = âˆ’depth Â· taper Â· 4u(1âˆ’u)  where uâˆˆ[0,1] portâ†’stbd.
// Length taper: sin(Ï€Â·t) â€” zero at bow/stern, max at midship.
// This replaces the old closed-ellipse "sausage" with a proper shell profile.
function buildHullGeometry(
  lengthM: number, widthM: number, depth: number,
  vShape = 1.0, bowPower = 1.0, sternPower = 1.0, maxBeamT = 0.5,
): THREE.BufferGeometry {
  const LONG  = 56;
  const CROSS = 28;
  const pos: number[] = [];
  const idx: number[] = [];

  for (let i = 0; i <= LONG; i++) {
    // t=0 â†’ stern tip, t=maxBeamT â†’ widest point, t=1 â†’ bow tip
    const t = i / LONG;
    const z = (t - 0.5) * lengthM;

    // Asymmetric plan-view taper: sin^power so higher power = finer/longer run.
    // HULL_MIN_TIP prevents a zero-width geometric point at the tips.
    const minTip = HULL_MIN_TIP;
    let taper: number;
    if (t <= maxBeamT) {
      const u = t / maxBeamT;                                  // 0 at stern, 1 at max beam
      taper = minTip + (1 - minTip) * Math.pow(Math.sin(Math.PI / 2 * u), sternPower);
    } else {
      const u = (1 - t) / (1 - maxBeamT);                     // 0 at bow, 1 at max beam
      taper = minTip + (1 - minTip) * Math.pow(Math.sin(Math.PI / 2 * u), bowPower);
    }

    for (let j = 0; j <= CROSS; j++) {
      const u        = j / CROSS;
      const x        = (u - 0.5) * widthM * taper;
      const parabola = 4 * u * (1 - u);
      const y        = depth * taper * Math.pow(parabola, vShape);
      pos.push(x, y, z);
    }
  }

  const stride = CROSS + 1;
  for (let i = 0; i < LONG; i++) {
    for (let j = 0; j < CROSS; j++) {
      const a = i * stride + j;
      const b = a + stride;
      const c = b + 1;
      const d = a + 1;
      idx.push(a, b, d);
      idx.push(b, c, d);
    }
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geom.setIndex(idx);
  geom.computeVertexNormals();
  return geom;
}

// â”€â”€ Rail (cylinder between two 3D points) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function Rail({ from, to, r = 0.025, color = '#6b7280' }: {
  from: [number, number, number];
  to:   [number, number, number];
  r?: number; color?: string;
}) {
  const dx = to[0]-from[0], dy = to[1]-from[1], dz = to[2]-from[2];
  const len = Math.sqrt(dx*dx+dy*dy+dz*dz);
  const mid: [number, number, number] = [(from[0]+to[0])/2, (from[1]+to[1])/2, (from[2]+to[2])/2];
  const dir  = new THREE.Vector3(dx, dy, dz).normalize();
  const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
  return (
    <mesh position={mid} quaternion={quat}>
      <cylinderGeometry args={[r, r, len, 8]} />
      <meshStandardMaterial color={color} metalness={0.6} roughness={0.4} />
    </mesh>
  );
}

// â”€â”€ Rigger arm (two struts + oarlock pin) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Real shell riggers are a "V" brace extending from the gunwale to the pin.
// pinX: distance from boat centreline to the oarlock pin.
function RiggerArm({ z, hw, pinX, port }: {
  z: number; hw: number; pinX: number; port: boolean;
}) {
  const s = port ? -1 : 1;
  // Main stay runs from gunwale level forward to pin
  const fwd: [number,number,number]  = [s * hw,   0.01, z + 0.06];
  const aft: [number,number,number]  = [s * hw,   0.01, z - 0.12];
  const pin: [number,number,number]  = [s * pinX, 0.05, z - 0.04];
  return (
    <>
      <Rail from={fwd} to={pin} r={0.007} color="#9ca3af" />
      <Rail from={aft} to={pin} r={0.007} color="#9ca3af" />
      <mesh position={pin}>
        <cylinderGeometry args={[0.013, 0.013, 0.07, 6]} />
        <meshStandardMaterial color="#374151" metalness={0.75} roughness={0.3} />
      </mesh>
    </>
  );
}

// â”€â”€ Shell mesh â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const CREW_DISPLAY: Record<string, number> = {
  '1x':1, '2x':2, '2-':2, '4x':4, '4-':4, '4+':4, '8+':4,
};
const SCULLING_CLASSES = new Set(['1x', '2x', '4x']);

function ShellMesh({ boat, posX, posY, colorIndex, isSelected, slung, onDragStart }: {
  boat: Boat; posX: number; posY: number; colorIndex: number;
  isSelected: boolean; slung?: boolean;
  onDragStart: (boatId: string) => void;
}) {
  // Resolve manufacturer theme; fall back to cycling palette for manually-added boats
  const theme = boat.manufacturer ? MANUFACTURER_THEMES[boat.manufacturer] : undefined;
  const hullColor  = theme?.hull      ?? BOAT_COLORS[colorIndex % BOAT_COLORS.length];
  const deckColor  = theme?.deck      ?? hullColor;
  const roughness  = theme?.roughness ?? 0.50;
  const metalness  = theme?.metalness ?? 0.10;
  const vShape     = theme?.vShape    ?? 1.0;
  const bowPower   = theme?.bowPower  ?? 1.0;
  const sternPower = theme?.sternPower ?? 1.0;
  const maxBeamT   = theme?.maxBeamT  ?? 0.5;

  const depth   = Math.min(boat.widthM * 0.62, 0.26);

  // Skeg parameters â€” per-manufacturer or sensible defaults
  const skegCfg    = theme?.skeg;
  const sChord     = skegCfg?.chord      ?? 0.100;
  const sHeight    = skegCfg?.height     ?? 0.032;
  const sLeadSweep = skegCfg?.leadSweep  ?? 0.008;
  const sTrailSwp  = skegCfg?.trailSweep ?? 0.025;
  const sPosF      = skegCfg?.posF       ?? 0.09;

  const hullGeom = useMemo(
    () => buildHullGeometry(boat.lengthM, boat.widthM, depth, vShape, bowPower, sternPower, maxBeamT),
    [boat.lengthM, boat.widthM, depth, vShape, bowPower, sternPower, maxBeamT]
  );

  // Skeg geometry â€” flat trapezoidal plate (DoubleSide) on the keel near the stern.
  // The fin base must follow the actual keel surface, which tapers toward the stern.
  // We compute the hull taper at the skeg chord midpoint (same formula as buildHullGeometry)
  // to find the true keel Y there, then seat the fin flush against it.
  const skegGeom = useMemo(() => {
    const L  = boat.lengthM;
    const z0 = -L / 2 + sPosF * L;         // trailing edge at keel (stern side)
    const z1 = z0 + sChord;                 // leading edge at keel (bow side)
    const z2 = z1 - sTrailSwp;             // leading edge tip (swept toward stern)
    const z3 = z0 + sLeadSweep;            // trailing edge tip (raked slightly toward bow)

    // Hull taper at skeg chord midpoint (t: stern=0 â†’ bow=1)
    const tMid = sPosF + sChord / (2 * L);
    const minTip = HULL_MIN_TIP;
    let taperMid: number;
    if (tMid <= maxBeamT) {
      const u = tMid / maxBeamT;
      taperMid = minTip + (1 - minTip) * Math.pow(Math.sin(Math.PI / 2 * u), sternPower);
    } else {
      const u = (1 - tMid) / (1 - maxBeamT);
      taperMid = minTip + (1 - minTip) * Math.pow(Math.sin(Math.PI / 2 * u), bowPower);
    }
    const y0 = depth * taperMid;            // actual keel height at skeg position
    const y1 = y0 + sHeight;               // fin tip

    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([
      0, y0, z0,   // 0: trailing root
      0, y0, z1,   // 1: leading root
      0, y1, z2,   // 2: leading tip
      0, y1, z3,   // 3: trailing tip
    ], 3));
    g.setIndex([0, 1, 2,  0, 2, 3]);
    g.computeVertexNormals();
    return g;
  }, [boat.lengthM, depth, sChord, sHeight, sLeadSweep, sTrailSwp, sPosF, maxBeamT, bowPower, sternPower]);

  // Deck: flat tapered panel at y=0, matching the hull gunwale outline.
  // Uses the same asymmetric taper as buildHullGeometry so the outline aligns exactly.
  const deckGeom = useMemo(() => {
    const N      = 48;
    const minTip = HULL_MIN_TIP;
    const pts: THREE.Vector2[] = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      let taper: number;
      if (t <= maxBeamT) {
        const u = t / maxBeamT;
        taper = minTip + (1 - minTip) * Math.pow(Math.sin(Math.PI / 2 * u), sternPower);
      } else {
        const u = (1 - t) / (1 - maxBeamT);
        taper = minTip + (1 - minTip) * Math.pow(Math.sin(Math.PI / 2 * u), bowPower);
      }
      pts.push(new THREE.Vector2((boat.widthM / 2) * taper, (t - 0.5) * boat.lengthM));
    }
    const shape = new THREE.Shape();
    const left  = pts.map(p => new THREE.Vector2(-p.x, p.y));
    const right = [...pts].reverse().map(p => new THREE.Vector2(p.x, p.y));
    shape.moveTo(left[0].x, left[0].y);
    left.forEach(p  => shape.lineTo(p.x, p.y));
    right.forEach(p => shape.lineTo(p.x, p.y));
    return new THREE.ShapeGeometry(shape);
  }, [boat.lengthM, boat.widthM, bowPower, sternPower, maxBeamT]);

  // Seat z-positions â€” used by rigger arm logic (currently hidden, preserved for future feature)
  const sculling = SCULLING_CLASSES.has(boat.boatClass);
  const showN    = CREW_DISPLAY[boat.boatClass] ?? 1;
  const seatZs   = showN === 1
    ? [0]
    : Array.from({ length: showN }, (_, i) => ((i / (showN - 1)) - 0.5) * boat.lengthM * 0.55);
  // Oarlock pin reach from centreline (FISA-ish spreads) â€” used by rigger arms
  const pinX = sculling ? 0.80 : 0.88;
  // Suppress "unused" warnings while riggers are commented out
  void sculling; void seatZs; void pinX;

  return (
    <group
      position={[posX, posY, 0]}
      rotation={slung ? [0, 0, Math.PI] : [0, 0, 0]}
      onPointerDown={(e) => { e.stopPropagation(); onDragStart(boat.id); }}
    >
      {/* Selection glow ring â€” shown when this boat is selected for moving */}
      {isSelected && (
        <mesh position={[0, -0.01, 0]}>
          <boxGeometry args={[boat.widthM + 0.10, 0.018, boat.lengthM * 0.93]} />
          <meshStandardMaterial
            color="#facc15" emissive="#facc15" emissiveIntensity={1.2}
            transparent opacity={0.65} depthWrite={false}
          />
        </mesh>
      )}

      {/* Hull â€” V-section, open top, double-sided so inside is visible */}
      <mesh geometry={hullGeom} castShadow>
        <meshStandardMaterial
          color={hullColor} metalness={metalness} roughness={roughness}
          side={THREE.DoubleSide}
          emissive={isSelected ? hullColor : '#000000'}
          emissiveIntensity={isSelected ? 0.35 : 0}
        />
      </mesh>

      {/* Deck panel â€” flat, at gunwale level; contrasting colour for brands with a stripe */}
      <mesh geometry={deckGeom} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
        <meshStandardMaterial
          color={deckColor} emissive={deckColor} emissiveIntensity={0.07}
          roughness={Math.min(roughness + 0.05, 1)} side={THREE.DoubleSide}
        />
      </mesh>

      {/* Bow ball â€” white safety sphere pressed against the tongue-facing bow tip.
          At t=1 (bow) the hull keel sits at y = depth Ã— HULL_MIN_TIP, so that is
          exactly where the apex of the bow tip is. The ball is centred there and
          nudged just past the hull end in Z so it sits flush rather than embedded. */}
      <mesh position={[0, depth * HULL_MIN_TIP, BOW_Z_LOCAL * (boat.lengthM / 2 + BOW_BALL_R * 0.6)]}>
        <sphereGeometry args={[BOW_BALL_R, 14, 10]} />
        <meshStandardMaterial color="#ffffff" roughness={0.40} metalness={0.05} />
      </mesh>

      {/* Skeg/fin â€” trapezoidal aluminium plate mounted on the keel near the stern.
          The fin sticks upward (+Y) because the boat is stored inverted on the trailer.
          Leading edge (bow-facing) is swept back; trailing edge tapers toward the bow at the tip.
          Near-black anodised aluminium colour matches real-world finish on most manufacturers. */}
      <mesh geometry={skegGeom}>
        <meshStandardMaterial
          color="#1c1c1c" roughness={0.45} metalness={0.38}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Rigger arms â€” hidden for now, logic preserved for future toggle feature
      {seatZs.map((sz, i) => (
        sculling ? (
          <React.Fragment key={i}>
            <RiggerArm z={sz} hw={boat.widthM / 2} pinX={pinX} port={true}  />
            <RiggerArm z={sz} hw={boat.widthM / 2} pinX={pinX} port={false} />
          </React.Fragment>
        ) : (
          <RiggerArm key={i} z={sz} hw={boat.widthM / 2} pinX={pinX} port={i % 2 === 0} />
        )
      ))}
      */}

      {/* Name label â€” floats above the keel; dark outline ensures legibility on any hull colour */}
      <Text
        position={[0, depth + 0.12, 0]}
        rotation={[0, Math.PI / 2, 0]}
        fontSize={0.11}
        color="#ffffff"
        anchorX="center" anchorY="bottom"
        outlineWidth={0.012} outlineColor="#000000"
        maxWidth={boat.lengthM * 0.85}
      >
        {`${boat.boatClass}  ${boat.name}`}
      </Text>
    </group>
  );
}

// â”€â”€ Trailer frame â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Modelled on a Mackay-style aluminium rowing trailer:
//   â€¢ Deep box-section chassis rails running the full length
//   â€¢ Single-spine straight tongue with gussets, coupler, breakaway actuator
//   â€¢ Raked uprights (lean toward tongue) with single diagonal per panel
//   â€¢ Longitudinal top chord + horizontal tier cross-rails port and starboard
//   â€¢ Short cradle-arm stubs with rubber pads at each boat/tier position
//   â€¢ Tandem axle pair with shared diamond-plate fender and toolboxes
//   â€¢ Spare tyre flat-mounted between rack and axle
//   â€¢ Screw-down landing leg at tongue
function TrailerFrame({ tiers, trailerLength, trailerWidthM, tongueLengthM, towerCount, tierSlotXs, slotWidths }: {
  tiers: number;
  trailerLength: number;
  trailerWidthM: number;
  tongueLengthM: number;
  towerCount: number;
  tierSlotXs: number[][];
  slotWidths:  number[][];
}) {
  const halfLen   = trailerLength / 2;
  const groundY   = -0.05;
  const beamDepth = 0.22;
  const beamW     = 0.10;
  const deckY     = groundY + beamDepth;
  const topY      = tierY(0, tiers) + 0.14;

  // chHW: half-width of the chassis beams â€” derived from fixed trailer width, not boat beams.
  const chHW = trailerWidthM / 2 - 0.025 - beamW / 2;

  const wheelR    = 0.27;
  const axleCentY = groundY - wheelR + 0.04;
  const realFloor = axleCentY - wheelR;

  // Towers are vertical â€” no rake
  const rakeH = 0;
  const rake  = 0;

  // Tray spans the full bed length, centered at origin
  const trayRear  = -halfLen;
  const trayFront =  halfLen;
  const trayLen   = trailerLength;
  const nTowers   = Math.max(2, towerCount);
  // First tower at front (tongue side), last tower at rear, evenly spaced
  const towerInset = 0.20;
  const towerSpan  = trayLen - 2 * towerInset;
  const towerZs    = Array.from({ length: nTowers }, (_, i) =>
    trayFront - towerInset - (i / (nTowers - 1)) * towerSpan
  );

  // Collect all gunwale X positions per tier (for arm extent and runner placement)
  const gunwalesByTier: number[][] = Array.from({ length: tiers }, (_, t) => {
    const gxs: number[] = [];
    tierSlotXs[t]?.forEach((cx, p) => {
      const hw = (slotWidths[t]?.[p] ?? 0.30) / 2;
      gxs.push(cx - hw, cx + hw);
    });
    return gxs.sort((a, b) => a - b);
  });

  const postHW = 0.07;
  const alum   = '#c4cdd6';
  const dark   = '#2a3540';

  const els: React.ReactElement[] = [];

  const trayCentZ = 0;

  // Tandem axle midpoint at ~60% back from tongue end of tray â€” gives positive tongue weight
  const axleMidZ = trayFront - trayLen * 0.60;
  const axle1Z   = axleMidZ - 0.46;
  const axle2Z   = axleMidZ + 0.46;

  // â”€â”€ 1. Box-section chassis beams (tray length only) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  for (const xs of [-chHW, chHW]) {
    els.push(
      <mesh key={`beam-${xs}`} position={[xs, groundY + beamDepth / 2, trayCentZ]}>
        <boxGeometry args={[beamW, beamDepth, trayLen]} />
        <meshStandardMaterial color={alum} metalness={0.35} roughness={0.55} />
      </mesh>
    );
  }
  // Chassis cross-members at tower positions
  for (const tz of towerZs) {
    els.push(
      <Rail key={`chx-${tz}`}
        from={[-chHW, deckY - 0.06, tz]} to={[chHW, deckY - 0.06, tz]}
        color="#a8b4bc" r={0.022}
      />
    );
  }

  // Tray: floor + four raised walls, open top.
  // Top edge sits just under the bottom rack tier.
  const trayWallTop  = TIER_BASE_Y - 0.04;          // just under bottom tier
  const trayWallH    = trayWallTop - deckY;          // wall height
  const trayWallCY   = deckY + trayWallH / 2;        // wall centre Y
  const trayInnerHW  = chHW + beamW / 2;             // inner half-width of tray
  const wallThick    = 0.025;                         // tray wall thickness
  const trayMat      = { color: alum, metalness: 0.30, roughness: 0.55 } as const;

  // Floor
  els.push(
    <mesh key="tray-floor" position={[0, deckY + 0.006, trayCentZ]} receiveShadow>
      <boxGeometry args={[trayInnerHW * 2, 0.012, trayLen]} />
      <meshStandardMaterial {...trayMat} />
    </mesh>
  );
  // Port & starboard walls
  for (const xs of [-1, 1]) {
    els.push(
      <mesh key={`tray-side-${xs}`}
        position={[xs * (trayInnerHW + wallThick / 2), trayWallCY, trayCentZ]}
      >
        <boxGeometry args={[wallThick, trayWallH, trayLen]} />
        <meshStandardMaterial {...trayMat} />
      </mesh>
    );
  }
  // Front & rear end walls
  for (const zs of [-1, 1]) {
    els.push(
      <mesh key={`tray-end-${zs}`}
        position={[0, trayWallCY, trayCentZ + zs * (trayLen / 2 + wallThick / 2)]}
      >
        <boxGeometry args={[trayInnerHW * 2 + wallThick * 2, trayWallH, wallThick]} />
        <meshStandardMaterial {...trayMat} />
      </mesh>
    );
  }

  // â”€â”€ 2. Tower frames: narrow post pairs + horizontal tier arms â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Each tower is two posts (at Â±postHW, i.e. front-back in Z) with a cross-member
  // at the top and horizontal arms extending outward at each tier height.
  // Sides are fully open â€” posts are central, arms reach out to gunwale positions.
  for (let ti = 0; ti < towerZs.length; ti++) {
    const tz    = towerZs[ti];
    const tzTop = tz + rakeH * rake;   // raked top position

    // Two posts (flanking in Z give visual depth; Â±postHW in Z direction)
    for (const pz of [-postHW, postHW]) {
      els.push(
        <Rail key={`post-${ti}-${pz}`}
          from={[0, deckY,  tz + pz]}
          to={[0,   topY, tzTop + pz]}
          color={alum} r={0.034}
        />
      );
    }
    // Cross-member connecting the two posts at the top (within this tower)
    els.push(
      <Rail key={`posttop-${ti}`}
        from={[0, topY, tz - postHW]}
        to={[0,   topY, tz + postHW]}
        color={alum} r={0.026}
      />
    );
    // Cross-member at deck level
    els.push(
      <Rail key={`postbot-${ti}`}
        from={[0, deckY, tz - postHW]}
        to={[0,   deckY, tz + postHW]}
        color={alum} r={0.026}
      />
    );

    // Horizontal arms at each tier height â€” extend left and right to all gunwale positions
    for (let t = 0; t < tiers; t++) {
      const y   = tierY(t, tiers);
      const gxs = gunwalesByTier[t];
      if (!gxs.length) continue;

      const leftEnd  = gxs[0]  - 0.05;
      const rightEnd = gxs[gxs.length - 1] + 0.05;

      // Left arm
      els.push(
        <Rail key={`armL-${ti}-${t}`}
          from={[0, y, tz]} to={[leftEnd,  y, tz]}
          color={alum} r={0.022}
        />
      );
      // Right arm
      els.push(
        <Rail key={`armR-${ti}-${t}`}
          from={[0, y, tz]} to={[rightEnd, y, tz]}
          color={alum} r={0.022}
        />
      );
      {/* pads are full-length rails added below */}
    }
  }

  // â”€â”€ 3. Two longitudinal runner beams linking all towers along the length â”€â”€â”€â”€â”€â”€
  // One level below the top â€” at the second-from-top tier height.
  const runnerY = tierY(1, tiers);
  for (const pz of [-postHW, postHW]) {
    els.push(
      <Rail key={`runner-${pz}`}
        from={[0, runnerY, towerZs[0] + pz]}
        to={[0, runnerY, towerZs[nTowers - 1] + pz]}
        color={alum} r={0.026}
      />
    );
  }



  // â”€â”€ 5. Foam pad strips on each arm â€” run across the trailer (X direction) â”€â”€â”€
  // One pad per tower Ã— per tier, spanning the full arm width port-to-starboard.
  for (let ti = 0; ti < towerZs.length; ti++) {
    const tz = towerZs[ti];
    for (let t = 0; t < tiers; t++) {
      const y   = tierY(t, tiers);
      const gxs = gunwalesByTier[t];
      if (!gxs.length) continue;
      const leftEnd  = gxs[0]  - 0.05;
      const rightEnd = gxs[gxs.length - 1] + 0.05;
      const padWidth = rightEnd - leftEnd;
      els.push(
        <mesh key={`pad-${ti}-${t}`}
          position={[(leftEnd + rightEnd) / 2, y + 0.026, tz]}
        >
          <boxGeometry args={[padWidth, 0.040, 0.055]} />
          <meshStandardMaterial color="#111118" roughness={0.97} />
        </mesh>
      );
    }
  }

  // â”€â”€ 7. Tandem axle: two close axles, shared fender, diamond-plate toolboxes â”€â”€
  const fenderMidZ   = (axle1Z + axle2Z) / 2;
  const fenderLenZ   = Math.abs(axle2Z - axle1Z) + 0.88;
  const axleOutboard = chHW + 0.30;

  for (const az of [axle1Z, axle2Z]) {
    els.push(
      <Rail key={`axl-${az}`}
        from={[-axleOutboard, axleCentY, az]}
        to={[ axleOutboard, axleCentY, az]}
        color={dark} r={0.026}
      />
    );
    for (const xs of [-1, 1]) {
      const wx = xs * axleOutboard;
      els.push(
        <mesh key={`tyre-${az}-${xs}`}
          position={[wx, axleCentY, az]}
          rotation={[0, 0, Math.PI / 2]}
        >
          <cylinderGeometry args={[wheelR, wheelR, 0.19, 28]} />
          <meshStandardMaterial color="#0d1117" roughness={0.98} />
        </mesh>
      );
      els.push(
        <mesh key={`rim-${az}-${xs}`}
          position={[wx, axleCentY, az]}
          rotation={[0, 0, Math.PI / 2]}
        >
          <cylinderGeometry args={[wheelR * 0.56, wheelR * 0.56, 0.20, 10]} />
          <meshStandardMaterial color="#b0bbc4" metalness={0.6} roughness={0.35} />
        </mesh>
      );
    }
  }
  // Shared fender spanning both axles
  for (const xs of [-1, 1]) {
    els.push(
      <mesh key={`fender-${xs}`}
        position={[xs * axleOutboard, axleCentY + wheelR * 1.60, fenderMidZ]}
      >
        <boxGeometry args={[0.22, 0.13, fenderLenZ]} />
        <meshStandardMaterial color={alum} metalness={0.4} roughness={0.5} />
      </mesh>
    );
  }
  // Diamond-plate toolbox covers over chassis beams at axle zone
  for (const xs of [-chHW, chHW]) {
    els.push(
      <mesh key={`tbox-${xs}`}
        position={[xs, deckY + 0.07, fenderMidZ]}
      >
        <boxGeometry args={[beamW + 0.06, 0.14, fenderLenZ * 0.85]} />
        <meshStandardMaterial color="#ccd4da" metalness={0.45} roughness={0.45} />
      </mesh>
    );
  }

  // â”€â”€ 6. Single-spine straight tongue â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const tongueEnd = trayFront + tongueLengthM;
  els.push(
    <mesh key="tongue-spine"
      position={[0, groundY + beamDepth * 0.45, (trayFront + tongueEnd) / 2]}
    >
      <boxGeometry args={[beamW, beamDepth * 0.85, tongueEnd - trayFront]} />
      <meshStandardMaterial color={alum} metalness={0.4} roughness={0.5} />
    </mesh>
  );
  for (const xs of [-chHW, chHW]) {
    els.push(
      <Rail key={`gus-${xs}`}
        from={[xs,  groundY + beamDepth * 0.5, trayFront - 0.1]}
        to={[0, groundY + beamDepth * 0.5, trayFront + 0.9]}
        color="#a8b4bc" r={0.028}
      />
    );
  }
  els.push(
    <mesh key="coupler"
      position={[0, groundY + beamDepth * 0.45 - 0.04, tongueEnd + 0.06]}
    >
      <boxGeometry args={[0.20, 0.14, 0.26]} />
      <meshStandardMaterial color={dark} metalness={0.55} roughness={0.4} />
    </mesh>
  );
  els.push(
    <mesh key="actuator"
      position={[0, groundY + beamDepth * 0.45 + 0.10, tongueEnd - 0.32]}
    >
      <boxGeometry args={[0.13, 0.09, 0.19]} />
      <meshStandardMaterial color="#cc1100" roughness={0.65} />
    </mesh>
  );

  // â”€â”€ 7. Screw-down landing leg â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const jackZ = trayFront + 0.55;
  els.push(
    <Rail key="jack-outer"
      from={[0, deckY,       jackZ]}
      to={[0, deckY - 0.28, jackZ]}
      color={alum} r={0.022}
    />
  );
  els.push(
    <Rail key="jack-inner"
      from={[0, deckY - 0.28, jackZ]}
      to={[0, realFloor,      jackZ]}
      color="#9aaab2" r={0.016}
    />
  );
  els.push(
    <mesh key="jack-foot" position={[0, realFloor, jackZ]}>
      <boxGeometry args={[0.18, 0.025, 0.18]} />
      <meshStandardMaterial color={dark} roughness={0.7} />
    </mesh>
  );

  // â”€â”€ 8. Ground plane â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  els.push(
    <mesh key="ground"
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, realFloor, 0]}
      receiveShadow
    >
      <planeGeometry args={[60, 100]} />
      <meshStandardMaterial color="#d0d4d8" />
    </mesh>
  );

  return <group>{els}</group>;
}


// â”€â”€ Staging rack â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Same tower/arm/pad/runner/diagonal structure as TrailerFrame but without
// wheels, axles, tray, tongue, or landing leg. Ground legs replace the chassis.
function StagingRack({ tiers, rackLength, tierSlotXs, slotWidths, offsetX }: {
  tiers: number; rackLength: number; tierSlotXs: number[][];
  slotWidths: number[][]; offsetX: number;
}) {
  const halfLen  = rackLength / 2;
  const groundY  = -0.05;
  const deckY    = groundY + 0.28;   // shorter legs than the trailer chassis
  const topY     = tierY(0, tiers) + 0.14;
  const alum     = '#c4cdd6';

  const allEdges = tierSlotXs.flatMap((xs, t) =>
    xs.flatMap((cx, p) => { const hw = (slotWidths[t]?.[p] ?? 0.30) / 2; return [cx - hw, cx + hw]; })
  );
  const frameHW = allEdges.length ? Math.max(...allEdges.map(Math.abs)) + 0.22 : 0.65;
  const chHW    = frameHW * 0.52;

  const rackRear  = -halfLen * 0.70;
  const rackFront =  halfLen * 0.78;
  const rLen      = rackFront - rackRear;
  const nTowers   = rackLength < 8 ? 2 : rackLength < 14 ? 3 : 4;
  const towerZs   = Array.from({ length: nTowers }, (_, i) =>
    rackRear + ((i + 1) / (nTowers + 1)) * rLen
  );

  const gunwalesByTier: number[][] = Array.from({ length: tiers }, (_, t) => {
    const gxs: number[] = [];
    tierSlotXs[t]?.forEach((cx, p) => {
      const hw = (slotWidths[t]?.[p] ?? 0.30) / 2;
      gxs.push(cx - hw, cx + hw);
    });
    return gxs.sort((a, b) => a - b);
  });

  const postHW = 0.07;
  const els: React.ReactElement[] = [];

  // Ground legs: at each tower, four corner posts from deck to ground
  for (const tz of towerZs) {
    for (const xs of [-chHW, chHW]) {
      for (const pz of [-postHW * 1.5, postHW * 1.5]) {
        els.push(
          <Rail key={`leg-${tz}-${xs}-${pz}`}
            from={[xs, groundY, tz + pz]} to={[xs, deckY, tz + pz]}
            color={alum} r={0.026}
          />
        );
      }
      // Horizontal base stretcher per side
      els.push(
        <Rail key={`base-${tz}-${xs}`}
          from={[xs, groundY + 0.02, tz - postHW * 1.5]}
          to={[xs, groundY + 0.02, tz + postHW * 1.5]}
          color={alum} r={0.018}
        />
      );
    }
    // Foot pads
    for (const pz of [-postHW * 1.5, postHW * 1.5]) {
      els.push(
        <mesh key={`foot-${tz}-${pz}`} position={[0, groundY, tz + pz]}>
          <boxGeometry args={[chHW * 2 + 0.06, 0.022, 0.12]} />
          <meshStandardMaterial color={alum} metalness={0.3} roughness={0.65} />
        </mesh>
      );
    }
  }

  // Tower posts + cross-members
  for (let ti = 0; ti < towerZs.length; ti++) {
    const tz = towerZs[ti];
    for (const pz of [-postHW, postHW]) {
      els.push(<Rail key={`post-${ti}-${pz}`} from={[0, deckY, tz+pz]} to={[0, topY, tz+pz]} color={alum} r={0.034} />);
    }
    els.push(<Rail key={`ptop-${ti}`} from={[0, topY, tz-postHW]} to={[0, topY, tz+postHW]} color={alum} r={0.026} />);
    els.push(<Rail key={`pbot-${ti}`} from={[0, deckY, tz-postHW]} to={[0, deckY, tz+postHW]} color={alum} r={0.026} />);

    // Horizontal arms at each tier
    for (let t = 0; t < tiers; t++) {
      const y   = tierY(t, tiers);
      const gxs = gunwalesByTier[t];
      if (!gxs.length) continue;
      const leftEnd  = gxs[0] - 0.05;
      const rightEnd = gxs[gxs.length - 1] + 0.05;
      els.push(<Rail key={`armL-${ti}-${t}`} from={[0, y, tz]} to={[leftEnd,  y, tz]} color={alum} r={0.022} />);
      els.push(<Rail key={`armR-${ti}-${t}`} from={[0, y, tz]} to={[rightEnd, y, tz]} color={alum} r={0.022} />);
    }
  }

  // Longitudinal runner beams (one below top)
  const runnerY = tierY(1, tiers);
  for (const pz of [-postHW, postHW]) {
    els.push(
      <Rail key={`runner-${pz}`}
        from={[0, runnerY, towerZs[0]+pz]} to={[0, runnerY, towerZs[nTowers-1]+pz]}
        color={alum} r={0.026}
      />
    );
  }


  // Foam pad strips
  for (let ti = 0; ti < towerZs.length; ti++) {
    const tz = towerZs[ti];
    for (let t = 0; t < tiers; t++) {
      const y   = tierY(t, tiers);
      const gxs = gunwalesByTier[t];
      if (!gxs.length) continue;
      const leftEnd  = gxs[0] - 0.05;
      const rightEnd = gxs[gxs.length - 1] + 0.05;
      els.push(
        <mesh key={`pad-${ti}-${t}`} position={[(leftEnd+rightEnd)/2, y+0.026, tz]}>
          <boxGeometry args={[rightEnd - leftEnd, 0.040, 0.055]} />
          <meshStandardMaterial color="#111118" roughness={0.97} />
        </mesh>
      );
    }
  }

  return <group position={[offsetX, 0, 0]}>{els}</group>;
}

// â”€â”€ Controls â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function Controls({ maxDist, enabled }: { maxDist: number; enabled: boolean }) {
  const ref = useRef<any>(null);
  useFrame(() => {});
  return <OrbitControls ref={ref} enabled={enabled} enablePan={false} minDistance={2} maxDistance={maxDist} />;
}

// â”€â”€ Scene â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function Scene({ dragBoatId, setDragBoatId, hoverSlotId, setHoverSlotId }: {
  dragBoatId: string | null;
  setDragBoatId: (id: string | null) => void;
  hoverSlotId: string | null;
  setHoverSlotId: (id: string | null) => void;
}) {
  const { trailer, stagingSlots, boats, assignment, autoStageUnassigned } = useStore();

  // On mount, move any already-existing unassigned boats into staging slots
  useEffect(() => { autoStageUnassigned(); }, []);
  const boatById     = Object.fromEntries(boats.map(b => [b.id, b]));
  const boatColorIdx = Object.fromEntries(boats.map((b, i) => [b.id, i]));

  // Boats sit side-by-side in X on each tier, all centred at Z=0 along the trailer.
  // Slot positions are based on the fixed bay width (trailer.slotWidthM) so the rack
  // frame size never changes regardless of which boats are loaded.
  const slotW = trailer.slotWidthM ?? 0.55;
  const { slotPosX, tierSlotXs, slotWidths } = useMemo(() => {
    const posX:   Record<string, number> = {};
    const txs:    number[][] = [];
    const widths: number[][] = [];

    for (let t = 0; t < trailer.tiers; t++) {
      const tierSlots = trailer.slots
        .filter(s => s.tier === t && !s.slung)
        .sort((a, b) => a.position - b.position);

      const n      = tierSlots.length;
      const totalW = slotW * n + BOAT_GAP_X * Math.max(n - 1, 0);
      let x = -totalW / 2;
      const xs: number[] = [];
      const ws: number[] = [];
      tierSlots.forEach((s) => {
        const cx = x + slotW / 2;
        posX[s.id] = cx;
        xs.push(cx);
        ws.push(slotW);
        x += slotW + BOAT_GAP_X;
      });
      // Slung slots sit midway between adjacent normal slots of the tier below
      const slingSlots = trailer.slots
        .filter(s => s.tier === t && s.slung === true)
        .sort((a, b) => a.position - b.position);
      slingSlots.forEach((s, i) => { posX[s.id] = ((xs[i] ?? 0) + (xs[i + 1] ?? 0)) / 2; });

      txs.push(xs);
      widths.push(ws);
    }

    return { slotPosX: posX, tierSlotXs: txs, slotWidths: widths };
  }, [trailer.slots, trailer.tiers, slotW]);

  const trailerLength = trailer.bedLengthM ?? 10.97;

  // Hitch Z: tray front edge (bedLengthM/2) + tongue length + coupler offset
  // Road surface â€” matches TrailerFrame's realFloor

  // Staging rack — fixed dimensions, independent of trailer config
  const STAGING_SLOT_W = 0.55;
  const stagingTierCount = useMemo(() => {
    const max = stagingSlots.reduce((m, s) => Math.max(m, s.tier), 0);
    return max + 1;
  }, [stagingSlots]);

  const { stagingSlotPosX, stagingTierSlotXs, stagingSlotWidths } = useMemo(() => {
    const posX:   Record<string, number> = {};
    const txs:    number[][] = [];
    const widths: number[][] = [];
    for (let t = 0; t < stagingTierCount; t++) {
      const tierSlots = stagingSlots.filter(s => s.tier === t).sort((a, b) => a.position - b.position);
      const n      = tierSlots.length;
      const totalW = STAGING_SLOT_W * n + BOAT_GAP_X * Math.max(n - 1, 0);
      let x = -totalW / 2;
      const xs: number[] = []; const ws: number[] = [];
      tierSlots.forEach((s) => {
        const cx = x + STAGING_SLOT_W / 2;
        posX[s.id] = cx; xs.push(cx); ws.push(STAGING_SLOT_W);
        x += STAGING_SLOT_W + BOAT_GAP_X;
      });
      txs.push(xs); widths.push(ws);
    }
    return { stagingSlotPosX: posX, stagingTierSlotXs: txs, stagingSlotWidths: widths };
  }, [stagingSlots, stagingTierCount]);

  // Compute half-widths of each rack to position them without overlap
  // Physical half-width of the trailer for staging rack offset â€” use the fixed trailer width
  // (arms may extend further, but the tray edge defines the trailer's footprint)
  const trailerFrameHW = (trailer.trailerWidthM ?? 2.44) / 2;

  const stagingFrameHW = useMemo(() => {
    const edges = stagingTierSlotXs.flatMap((xs, t) =>
      xs.flatMap((cx, p) => { const hw = (stagingSlotWidths[t]?.[p] ?? 0.30) / 2; return [cx - hw, cx + hw]; })
    );
    return edges.length ? Math.max(...edges.map(Math.abs)) + 0.22 : 0.65;
  }, [stagingTierSlotXs, stagingSlotWidths]);

  const stagingOffsetX = trailerFrameHW + stagingFrameHW + 3.5;


  const handleDragStart = useCallback((boatId: string) => {
    setDragBoatId(boatId);
    setHoverSlotId(null);
  }, [setDragBoatId, setHoverSlotId]);

  // Pointer move on drag plane â€” find nearest open slot across trailer + staging rack
  const handleDragMove = useCallback((e: any) => {
    if (!dragBoatId) return;
    e.stopPropagation();
    const { x, y } = e.point;
    let bestId: string | null = null;
    let bestDist = Infinity;
    // Trailer slots (world X = local X, offset 0)
    for (const slot of trailer.slots) {
      const occupant = assignment[slot.id];
      if (occupant && occupant !== dragBoatId) continue;
      const sx = slotPosX[slot.id] ?? 0;
      const sy = slot.slung ? slingY(slot.tier, trailer.tiers) : tierY(slot.tier, trailer.tiers);
      const d = Math.sqrt((x - sx) ** 2 + (y - sy) ** 2);
      if (d < bestDist) { bestDist = d; bestId = slot.id; }
    }
    // Staging slots (world X = stagingOffsetX + local X)
    for (const slot of stagingSlots) {
      const occupant = assignment[slot.id];
      if (occupant && occupant !== dragBoatId) continue;
      const sx = stagingOffsetX + (stagingSlotPosX[slot.id] ?? 0);
      const sy = tierY(slot.tier, stagingTierCount);
      const d = Math.sqrt((x - sx) ** 2 + (y - sy) ** 2);
      if (d < bestDist) { bestDist = d; bestId = slot.id; }
    }
    setHoverSlotId(bestDist < 1.5 ? bestId : null);
  }, [dragBoatId, trailer.slots, stagingSlots, slotPosX, stagingSlotPosX, stagingOffsetX, trailer.tiers, assignment, setHoverSlotId]);

  // Camera: look along the trailer length (Z) from a 3/4 elevated angle.
  const totalLen = trailerLength + (trailer.tongueLengthM ?? 2.0);
  const camD = Math.max(totalLen * 0.65, 14);

  return (
    <>
      <PerspectiveCamera makeDefault position={[camD * 0.5, camD * 0.38, camD * 0.75]} fov={50} />
      <Controls maxDist={trailerLength * 4} enabled={!dragBoatId} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 10, -4]} intensity={1.4} castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-4, 4,  8]} intensity={0.5} />
      <hemisphereLight args={['#bfdbfe', '#94a3b8', 0.4]} />

      <group>
        <TrailerFrame
          tiers={trailer.tiers}
          trailerLength={trailerLength}
          trailerWidthM={trailer.trailerWidthM ?? 2.44}
          tongueLengthM={trailer.tongueLengthM ?? 2.0}
          towerCount={trailer.towerCount ?? 3}
          tierSlotXs={tierSlotXs}
          slotWidths={slotWidths}
        />


        {/* Invisible drag plane â€” catches pointer moves for slot snapping */}
        {dragBoatId && (
          <mesh onPointerMove={handleDragMove}>
            <planeGeometry args={[40, 12]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} />
          </mesh>
        )}

        {/* Slot drop-target highlight â€” works for both trailer and staging slots */}
        {dragBoatId && hoverSlotId && (() => {
          const isStaging = hoverSlotId.startsWith('stg-');
          const slot = isStaging
            ? stagingSlots.find(s => s.id === hoverSlotId)
            : trailer.slots.find(s => s.id === hoverSlotId);
          if (!slot) return null;
          const localX = isStaging ? (stagingSlotPosX[hoverSlotId] ?? 0) : (slotPosX[hoverSlotId] ?? 0);
          const worldX = isStaging ? stagingOffsetX + localX : localX;
          const sw = isStaging
            ? (stagingSlotWidths[slot.tier]?.[slot.position] ?? 0.35)
            : (slotWidths[slot.tier]?.[slot.position] ?? 0.35);
          return (
            <mesh position={[worldX, slot.slung ? slingY(slot.tier, trailer.tiers) : tierY(slot.tier, trailer.tiers), 0]}>
              <boxGeometry args={[sw + 0.06, 0.018, trailerLength * 0.88]} />
              <meshStandardMaterial
                color="#facc15" emissive="#facc15" emissiveIntensity={1.5}
                transparent opacity={0.65} depthWrite={false}
              />
            </mesh>
          );
        })()}

        {/* Trailer boats */}
        {trailer.slots.map(slot => {
          const boat = assignment[slot.id] ? boatById[assignment[slot.id]] : null;
          if (!boat) return null;
          const posY = slot.slung
            ? slingY(slot.tier, trailer.tiers)
            : tierY(slot.tier, trailer.tiers) + 0.03;
          return (
            <ShellMesh
              key={slot.id}
              boat={boat}
              posX={slotPosX[slot.id] ?? 0}
              posY={posY}
              slung={slot.slung}
              colorIndex={boatColorIdx[boat.id]}
              isSelected={dragBoatId === boat.id}
              onDragStart={handleDragStart}
            />
          );
        })}

        {/* Staging rack */}
        <StagingRack
          tiers={stagingTierCount}
          rackLength={6.0}
          tierSlotXs={stagingTierSlotXs}
          slotWidths={stagingSlotWidths}
          offsetX={stagingOffsetX}
        />

        {/* Boats on staging rack */}
        {stagingSlots.map(slot => {
          const boat = assignment[slot.id] ? boatById[assignment[slot.id]] : null;
          if (!boat) return null;
          return (
            <ShellMesh
              key={slot.id}
              boat={boat}
              posX={stagingOffsetX + (stagingSlotPosX[slot.id] ?? 0)}
              posY={tierY(slot.tier, stagingTierCount) + 0.03}
              colorIndex={boatColorIdx[boat.id]}
              isSelected={dragBoatId === boat.id}
              onDragStart={handleDragStart}
            />
          );
        })}

      </group>
    </>
  );
}

// â”€â”€ Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function Visualizer3D() {
  const { boats, assignment, assign } = useStore();
  const assigned = Object.keys(assignment).length;

  const [dragBoatId,  setDragBoatId]  = useState<string | null>(null);
  const [hoverSlotId, setHoverSlotId] = useState<string | null>(null);

  // Release anywhere â†’ commit the move (or cancel if no slot hovered)
  const handlePointerUp = useCallback(() => {
    if (dragBoatId && hoverSlotId) assign(hoverSlotId, dragBoatId);
    setDragBoatId(null);
    setHoverSlotId(null);
  }, [dragBoatId, hoverSlotId, assign]);

  // Escape cancels mid-drag
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setDragBoatId(null); setHoverSlotId(null); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div
      style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}
      onPointerUp={handlePointerUp}
    >
      {assigned === 0 && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)',
          zIndex: 10, textAlign: 'center', pointerEvents: 'none',
          color: '#94a3b8', fontSize: 14,
        }}>
          {boats.length === 0
            ? 'Add boats and arrange them in the Layout tab.'
            : 'Arrange boats in the Layout tab to see the 3D view.'}
        </div>
      )}

      {/* Drag-in-progress banner */}
      {dragBoatId && (
        <div style={{
          position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
          zIndex: 20, pointerEvents: 'none',
          background: 'rgba(250,204,21,0.92)', color: '#1a1a00',
          fontSize: 12, fontWeight: 600,
          padding: '5px 16px', borderRadius: 99,
        }}>
          {hoverSlotId ? 'Release to drop here' : 'Hover a slot Â· Esc to cancel'}
        </div>
      )}

      <Canvas
        dpr={[1, 1]}
        style={{ flex: 1, background: '#0f172a', cursor: dragBoatId ? 'grabbing' : 'default' }}
        gl={{ antialias: false }}
        onCreated={({ gl }) => {
          gl.shadowMap.enabled = false;
        }}
      >
        <Suspense fallback={null}>
          <Scene
            dragBoatId={dragBoatId}
            setDragBoatId={setDragBoatId}
            hoverSlotId={hoverSlotId}
            setHoverSlotId={setHoverSlotId}
          />
        </Suspense>
      </Canvas>

      <div style={{
        position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)',
        background: 'rgba(0,0,0,0.55)', color: 'white', fontSize: 11,
        padding: '4px 12px', borderRadius: 99, pointerEvents: 'none',
      }}>
        {dragBoatId ? 'Move pointer to a slot Â· Release to drop Â· Esc to cancel' : 'Click a boat to move it Â· Drag to orbit Â· Pinch to zoom'}
      </div>
    </div>
  );
}


