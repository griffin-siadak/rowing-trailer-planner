import React, { Suspense, useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Text } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../store';
import type { Boat, BoatPlacement, Trailer } from '../types';
import { computeTowerZs, computeTowerXZs, tierYs, snapZ, boatClearsTowers } from '../utils';
import { boatHalfWidthAt, boatDepthAt, boatRockerAt } from '../boatShape';
import { liveryOf } from '../livery';

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

// Uniform tier-Y for the staging racks (the trailer uses tierYs() from the model).
function tierY(tier: number, totalTiers: number) {
  return (totalTiers - 1 - tier) * TIER_HEIGHT + TIER_BASE_Y;
}

// â”€â”€ Hull geometry factory â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Open-top V-shaped cross-section: port gunwale (âˆ’hw,0) â†’ keel (0,âˆ’depth) â†’ starboard (hw,0).
// Parabolic floor: y = âˆ’depth Â· taper Â· 4u(1âˆ’u)  where uâˆˆ[0,1] portâ†’stbd.
// Hull surface swept from the boat's real beam/depth/rocker profiles. The
// profiles are sampled smoothly (cosine easing in sampleProfile), so the many
// longitudinal stations give a fair, curved hull rather than blocky facets.
// vShape controls cross-section fullness (per-manufacturer theme).
function buildHullGeometry(boat: Boat, vShape = 1.0): THREE.BufferGeometry {
  const L = boat.lengthM;
  const LONG = 64;
  const CROSS = 28;
  const pos: number[] = [];
  const idx: number[] = [];

  for (let i = 0; i <= LONG; i++) {
    const t = i / LONG;               // 0 = stern tip, 1 = bow tip
    const z = (t - 0.5) * L;          // z: stern −L/2 … bow +L/2 (+z faces the tongue)
    const hb = Math.max(HULL_MIN_TIP * 0.01, boatHalfWidthAt(boat, z));
    const d  = boatDepthAt(boat, z);
    const rk = boatRockerAt(boat, z); // keel rise toward the ends

    for (let j = 0; j <= CROSS; j++) {
      const u        = j / CROSS;
      const x        = (u - 0.5) * 2 * hb;
      const parabola = 4 * u * (1 - u);              // 0 at gunwale edges, 1 at keel centre
      // Keel depth from the depth curve; rocker lifts the keel line toward the ends.
      const y        = d * Math.pow(parabola, vShape) - rk * parabola;
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


// â”€â”€ Shell mesh â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const CREW_DISPLAY: Record<string, number> = {
  '1x':1, '2x':2, '2-':2, '4x':4, '4-':4, '4+':4, '8+':4,
};
// True seat counts per class — one cockpit assembly is rendered per rower.
const SEAT_COUNT: Record<string, number> = {
  '1x':1, '2x':2, '2-':2, '4x':4, '4-':4, '4+':4, '8+':8,
};
const SCULLING_CLASSES = new Set(['1x', '2x', '4x']);

// One rower's station, visible on the deck side (downward when the boat rides
// inverted). Proportions from real fittings: seat ~31 cm wide with twin
// sit-bone holes, track centres ~28 cm and ~86 cm long, footplate at ~42°
// mounted sternward of the slide. `w` = available lateral space at this z.
// Interior half-width available inside the hull at longitudinal z and height y
// above the gunwale plane: the parabolic section narrows with depth, so
// x_avail = hb·√(1 − y/d), with a safety margin so nothing kisses the skin.
function hullInteriorHW(boat: Boat, z: number, y: number): number {
  const hb = boatHalfWidthAt(boat, z);
  const d  = boatDepthAt(boat, z);
  if (d <= 0 || y >= d) return 0;
  return hb * Math.sqrt(1 - y / d) * 0.9;
}

// The per-rower stations for a boat: cockpit centre z, one rower's section
// length, and the tray width (clamped to the hull width across the whole
// opening). Shared by the deck cut-outs and SeatUnit so they always align.
function seatStations(boat: Boat): { z: number; trayW: number; unitLen: number }[] {
  const n = SEAT_COUNT[boat.boatClass] ?? 1;
  const pitch = n > 1 ? Math.min(1.32, (boat.lengthM * 0.8) / n) : 0;
  const unitLen = n > 1 ? pitch : Math.min(1.6, boat.lengthM * 0.35);
  const out: { z: number; trayW: number; unitLen: number }[] = [];
  for (let i = 0; i < n; i++) {
    const z = (i - (n - 1) / 2) * pitch;
    const hl = unitLen * 0.48;
    const hbEnd = Math.min(boatHalfWidthAt(boat, z - hl), boatHalfWidthAt(boat, z + hl));
    const trayW = Math.min(0.34, 2 * boatHalfWidthAt(boat, z) * 0.85, 2 * hbEnd * 0.88);
    if (trayW >= 0.07) out.push({ z, trayW, unitLen });
  }
  return out;
}

// Everything is recessed INTO the hull (y >= 0, i.e. inboard of the gunwale
// plane): seen from below through the deck cut-out, the seat sits nearest the
// opening, the slide tracks behind it, and the cockpit floor deepest. Every
// part is clamped to the hull's interior width at its own depth so nothing
// pokes through the outer skin — vital on fine singles.
function SeatUnit({ boat, z, trayW, unitLen }: { boat: Boat; z: number; trayW: number; unitLen: number }) {
  const slideC   = z + unitLen * 0.12;         // slide centred slightly bow-side
  const stretchZ = z - unitLen * 0.30;         // footplate toward the stern
  const depth    = boatDepthAt(boat, z);
  const floorY   = Math.min(0.085, depth * 0.45);   // cockpit floor depth

  // Floor: fit inside the section at floor depth, across the whole opening.
  const floorHW = Math.min(
    trayW / 2 + 0.02,
    hullInteriorHW(boat, z - unitLen * 0.46, floorY),
    hullInteriorHW(boat, z + unitLen * 0.46, floorY),
  );

  // Tracks: fit at their own height along the slide span.
  const trackY   = Math.max(0.02, floorY - 0.012);
  const trackLen = Math.min(0.86, unitLen * 0.62);
  const trackAvail = Math.min(
    hullInteriorHW(boat, slideC - trackLen / 2, trackY + 0.007),
    hullInteriorHW(boat, slideC + trackLen / 2, trackY + 0.007),
  );
  const trackX = Math.min(0.14, trayW * 0.40, trackAvail - 0.012);

  // Seat: shallow, so it gets the most width; still clamped at its depth.
  const seatAvail = hullInteriorHW(boat, slideC, 0.045);
  const seatW = Math.min(0.31, trayW * 0.90, 2 * seatAvail);

  // Stretcher: clamp the plate to the section at its mid-height.
  const stretchY = Math.max(0.055, floorY - 0.02);
  const plateW = Math.min(0.30, trayW * 0.88, 2 * hullInteriorHW(boat, stretchZ, stretchY + 0.03));

  return (
    <group>
      {/* cockpit floor (dark, deepest inside the hull) */}
      {floorHW > 0.02 && (
        <mesh position={[0, floorY, z]}>
          <boxGeometry args={[floorHW * 2, 0.004, unitLen * 0.96]} />
          <meshStandardMaterial color="#171a1e" roughness={0.9} />
        </mesh>
      )}
      {/* slide tracks, mounted just off the floor */}
      {trackX > 0.025 && [-trackX, trackX].map((tx) => (
        <mesh key={tx} position={[tx, trackY, slideC]}>
          <boxGeometry args={[0.020, 0.014, trackLen]} />
          <meshStandardMaterial color="#b8c0c8" metalness={0.7} roughness={0.35} />
        </mesh>
      ))}
      {/* seat riding the tracks, top just inboard of the gunwale plane */}
      {seatW > 0.06 && (
        <>
          <mesh position={[0, 0.030, slideC]}>
            <boxGeometry args={[seatW, 0.024, 0.18]} />
            <meshStandardMaterial color="#e8e6de" roughness={0.55} />
          </mesh>
          {[-0.057, 0.057].map((hx) => (
            <mesh key={hx} position={[hx * (seatW / 0.31), 0.016, slideC - 0.012]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.024 * (seatW / 0.31), 0.024 * (seatW / 0.31), 0.004, 16]} />
              <meshStandardMaterial color="#20242a" roughness={0.85} />
            </mesh>
          ))}
        </>
      )}
      {/* foot stretcher: angled plate + shoes, sternward of the slide, fully inboard */}
      {plateW > 0.06 && (
        <group position={[0, stretchY, stretchZ]} rotation={[-THREE.MathUtils.degToRad(42), 0, 0]}>
          <mesh>
            <boxGeometry args={[plateW, 0.010, Math.min(0.15, depth * 0.8)]} />
            <meshStandardMaterial color="#2a2f36" metalness={0.4} roughness={0.5} />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * Math.min(0.065, plateW * 0.22), -0.018, 0.01]}>
              <boxGeometry args={[Math.min(0.085, plateW * 0.30), 0.028, 0.055]} />
              <meshStandardMaterial color="#111418" roughness={0.8} />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
}

function ShellMesh({ boat, posX, posY, posZ = 0, colorIndex, isSelected, slung, onPointerDown }: {
  boat: Boat; posX: number; posY: number; posZ?: number; colorIndex: number;
  isSelected: boolean; slung?: boolean;
  onPointerDown: (e: ThreeEvent<PointerEvent>) => void;
}) {
  // Geometry/finish still come from the manufacturer theme; colours + markings
  // come from the boat's editable livery (which defaults to the maker's scheme).
  const theme = boat.manufacturer ? MANUFACTURER_THEMES[boat.manufacturer] : undefined;
  const livery = liveryOf(boat, BOAT_COLORS[colorIndex % BOAT_COLORS.length]);
  const hullColor  = livery.hullColor;
  const deckColor  = livery.deckColor;
  const roughness  = theme?.roughness ?? 0.50;
  const metalness  = theme?.metalness ?? 0.10;
  const vShape     = theme?.vShape    ?? 1.0;

  const midDepth = boatDepthAt(boat, 0);                                             // keel depth at midships
  const bowKeelY = Math.max(0, boatDepthAt(boat, boat.lengthM / 2) - boatRockerAt(boat, boat.lengthM / 2));

  // Skeg parameters â€” per-manufacturer or sensible defaults
  const skegCfg    = theme?.skeg;
  const sChord     = skegCfg?.chord      ?? 0.100;
  const sHeight    = skegCfg?.height     ?? 0.032;
  const sLeadSweep = skegCfg?.leadSweep  ?? 0.008;
  const sTrailSwp  = skegCfg?.trailSweep ?? 0.025;
  const sPosF      = skegCfg?.posF       ?? 0.09;

  const hullGeom = useMemo(
    () => buildHullGeometry(boat, vShape),
    [boat.lengthM, boat.shape, vShape]
  );

  // Skeg geometry â€” flat trapezoidal plate (DoubleSide) on the keel near the stern.
  // Seat the fin against the real keel Y (depth − rocker) at the skeg position.
  const skegGeom = useMemo(() => {
    const L  = boat.lengthM;
    const z0 = -L / 2 + sPosF * L;         // trailing edge at keel (stern side)
    const z1 = z0 + sChord;                 // leading edge at keel (bow side)
    const z2 = z1 - sTrailSwp;             // leading edge tip (swept toward stern)
    const z3 = z0 + sLeadSweep;            // trailing edge tip (raked slightly toward bow)

    const zMid = (z0 + z1) / 2;
    const y0 = boatDepthAt(boat, zMid) - boatRockerAt(boat, zMid);  // keel Y at skeg
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
  }, [boat.lengthM, boat.shape, sChord, sHeight, sLeadSweep, sTrailSwp, sPosF]);

  // Deck: flat panel at y=0, tracing the hull gunwale (beam profile) so the two
  // align — with a cockpit opening cut out per rower so the recessed seat
  // hardware shows through instead of protruding past the gunwale.
  const deckGeom = useMemo(() => {
    const N   = 56;
    const pts: THREE.Vector2[] = [];
    for (let i = 0; i <= N; i++) {
      const z = (i / N - 0.5) * boat.lengthM;
      pts.push(new THREE.Vector2(boatHalfWidthAt(boat, z), z));
    }
    const shape = new THREE.Shape();
    const left  = pts.map(p => new THREE.Vector2(-p.x, p.y));
    const right = [...pts].reverse().map(p => new THREE.Vector2(p.x, p.y));
    shape.moveTo(left[0].x, left[0].y);
    left.forEach(p  => shape.lineTo(p.x, p.y));
    right.forEach(p => shape.lineTo(p.x, p.y));
    for (const st of seatStations(boat)) {
      const hw = st.trayW / 2;
      const hl = st.unitLen * 0.92 / 2;
      const hole = new THREE.Path();
      hole.moveTo(-hw, st.z - hl);
      hole.lineTo(-hw, st.z + hl);
      hole.lineTo(hw, st.z + hl);
      hole.lineTo(hw, st.z - hl);
      hole.closePath();
      shape.holes.push(hole);
    }
    return new THREE.ShapeGeometry(shape);
  }, [boat.lengthM, boat.boatClass, boat.shape]);

  // Gunwale stripe: a thin ribbon hugging each side of the hull just above the
  // gunwale plane, following the beam profile (as displayed hull-up, this is
  // the classic stripe painted "just below the gunwale" on the water).
  const gunwaleStripeGeom = useMemo(() => {
    const h = livery.gunwaleStripeM;
    if (h <= 0) return null;
    const L = boat.lengthM, N = 48, off = 0.004;
    const pos: number[] = [];
    const idx: number[] = [];
    for (const side of [-1, 1]) {
      const base = pos.length / 3;
      for (let i = 0; i <= N; i++) {
        const z = (i / N - 0.5) * L;
        const hw = boatHalfWidthAt(boat, z) + off;
        pos.push(side * hw, 0.002, z, side * hw, h, z);
      }
      for (let i = 0; i < N; i++) {
        const a = base + i * 2;
        idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }, [boat.lengthM, boat.shape, livery.gunwaleStripeM]);

  // Name decal placement: on both sides of the bow, centred namePosM aft of
  // the bow tip, sitting within the hull side just above the gunwale plane.
  const nameZ  = BOW_Z_LOCAL * (boat.lengthM / 2 - livery.namePosM);
  const nameHW = boatHalfWidthAt(boat, nameZ) + 0.006;
  const nameY  = Math.max(livery.nameHeightM * 0.7, livery.gunwaleStripeM + livery.nameHeightM * 0.7);

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
      position={[posX, posY, posZ]}
      rotation={slung ? [0, 0, Math.PI] : [0, 0, 0]}
      onPointerDown={(e) => { e.stopPropagation(); onPointerDown(e); }}
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

      {/* Livery: gunwale stripe ribbons following the hull sides */}
      {gunwaleStripeGeom && (
        <mesh geometry={gunwaleStripeGeom}>
          <meshStandardMaterial color={livery.stripeColor} roughness={roughness} metalness={metalness} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Livery: spine stripe along the deck centreline (deck faces down when trailered) */}
      {livery.spineStripeM > 0 && (
        <mesh position={[0, -0.002, 0]}>
          <boxGeometry args={[livery.spineStripeM, 0.003, boat.lengthM * 0.92]} />
          <meshStandardMaterial color={livery.stripeColor} roughness={roughness} metalness={metalness} />
        </mesh>
      )}

      {/* Cockpits: one seat/track/stretcher station per rower, recessed into the
          hull and visible through the deck cut-outs from below */}
      {seatStations(boat).map((st, i) => (
        <SeatUnit key={i} boat={boat} z={st.z} trayW={st.trayW} unitLen={st.unitLen} />
      ))}

      {/* Livery: boat name painted on both sides of the bow */}
      {livery.showName && boat.name && (
        <>
          <Text position={[nameHW, nameY, nameZ]} rotation={[0, Math.PI / 2, 0]}
            fontSize={livery.nameHeightM} color={livery.nameColor}
            anchorX="center" anchorY="middle" maxWidth={boat.lengthM * 0.3}>
            {boat.name}
          </Text>
          <Text position={[-nameHW, nameY, nameZ]} rotation={[0, -Math.PI / 2, 0]}
            fontSize={livery.nameHeightM} color={livery.nameColor}
            anchorX="center" anchorY="middle" maxWidth={boat.lengthM * 0.3}>
            {boat.name}
          </Text>
        </>
      )}

      {/* Bow ball â€” white safety sphere pressed against the tongue-facing bow tip.
          At t=1 (bow) the hull keel sits at y = depth Ã— HULL_MIN_TIP, so that is
          exactly where the apex of the bow tip is. The ball is centred there and
          nudged just past the hull end in Z so it sits flush rather than embedded. */}
      <mesh position={[0, bowKeelY, BOW_Z_LOCAL * (boat.lengthM / 2 + BOW_BALL_R * 0.6)]}>
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
        position={[0, midDepth + 0.12, 0]}
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

function TrailerFrame({ trailer }: { trailer: Trailer }) {
  const trailerLength = trailer.bedLengthM;
  const tongueLengthM = trailer.tongueLengthM;
  const towerGroups   = trailer.towerGroups;

  const tYs       = tierYs(trailer);
  const nTiers    = trailer.tiers.length;
  const halfLen   = trailerLength / 2;
  const groundY   = -0.05;
  const beamDepth = 0.22;
  const beamW     = trailer.beamWidthM;
  const deckY     = groundY + beamDepth;
  const topY      = tYs[0];

  // chHW: half-width between the two chassis beams (centre-to-centre / 2).
  const chHW = trailer.beamSpacingM / 2;

  // Ground/jack reference taken from the largest wheel.
  const maxWheelR = Math.max(0.2, ...trailer.axles.map(a => a.wheelDiaM / 2));
  const axleCentY = groundY - maxWheelR + 0.04;
  const realFloor = axleCentY - maxWheelR;

  // Tray spans the full bed length, centered at origin
  const trayFront =  halfLen;
  const trayLen   = trailerLength;
  const towerZs   = towerGroups.map(g => g.zPosM);

  const alum   = '#c4cdd6';
  const dark   = '#2a3540';

  const els: React.ReactElement[] = [];

  const trayCentZ = 0;

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
  // Independent tray height, capped just under the bottom rack tier.
  const trayWallTop  = Math.min(deckY + (trailer.trayHeightM ?? 0.34), tYs[nTiers - 1] - 0.02);
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
  for (let ti = 0; ti < towerGroups.length; ti++) {
    const group = towerGroups[ti];
    const tz    = group.zPosM;
    const txs   = group.postXs;
    const postR = group.postWidthM / 2;
    const leftX  = Math.min(...txs);
    const rightX = Math.max(...txs);

    // One post per tower in the group — runs from tray deck up through all tier rails
    for (const tx of txs) {
      els.push(
        <Rail key={`post-${ti}-${tx}`}
          from={[tx, deckY, tz]}
          to={[tx,   topY, tz]}
          color={alum} r={postR}
        />
      );
    }

    // Within-group lateral cross-member (if multiple towers side by side)
    if (txs.length > 1) {
      els.push(
        <Rail key={`grptop-${ti}`}
          from={[leftX, topY, tz]} to={[rightX, topY, tz]}
          color={alum} r={0.026}
        />
      );
      els.push(
        <Rail key={`grpbot-${ti}`}
          from={[leftX, deckY, tz]} to={[rightX, deckY, tz]}
          color={alum} r={0.026}
        />
      );
    }

    // Arms extend from outermost towers to each tier's rail edge
    for (let t = 0; t < nTiers; t++) {
      const y     = tYs[t];
      const armHW = trailer.tiers[t].railWidthM / 2;
      els.push(
        <Rail key={`armL-${ti}-${t}`}
          from={[leftX, y, tz]} to={[-armHW, y, tz]}
          color={alum} r={0.022}
        />
      );
      els.push(
        <Rail key={`armR-${ti}-${t}`}
          from={[rightX, y, tz]} to={[armHW, y, tz]}
          color={alum} r={0.022}
        />
      );
      if (txs.length > 1) {
        els.push(
          <Rail key={`armX-${ti}-${t}`}
            from={[leftX, y, tz]} to={[rightX, y, tz]}
            color={alum} r={0.022}
          />
        );
      }
    }
  }

  // â”€â”€ 3. Two longitudinal runner beams linking all towers along the length â”€â”€â”€â”€â”€â”€
  // One level below the top â€” at the second-from-top tier height.
  const runnerY = tYs[1] ?? tYs[0];
  const runnerXs = towerGroups[0]?.postXs ?? [0];
  const runnerZFront = Math.max(...towerZs);
  const runnerZRear  = Math.min(...towerZs);
  for (const rx of runnerXs) {
    els.push(
      <Rail key={`runner-${rx}`}
        from={[rx, runnerY, runnerZFront]}
        to={[rx, runnerY, runnerZRear]}
        color={alum} r={0.026}
      />
    );
  }



  // â”€â”€ 5. Foam pad strips on each arm â€” run across the trailer (X direction) â”€â”€â”€
  // One pad per tower Ã— per tier, spanning the full arm width port-to-starboard.
  for (let ti = 0; ti < towerGroups.length; ti++) {
    const tz = towerGroups[ti].zPosM;
    for (let t = 0; t < nTiers; t++) {
      const y     = tYs[t];
      const padHW = trailer.tiers[t].railWidthM / 2;
      els.push(
        <mesh key={`pad-${ti}-${t}`} position={[0, y + 0.026, tz]}>
          <boxGeometry args={[padHW * 2, 0.040, 0.055]} />
          <meshStandardMaterial color="#111118" roughness={0.97} />
        </mesh>
      );
    }
  }

  // â”€â”€ 7. Axles (one or more), shared fender, diamond-plate toolboxes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const axleZs       = trailer.axles.map(a => a.zPosM);
  const fenderMidZ   = axleZs.reduce((s, z) => s + z, 0) / axleZs.length;
  const fenderLenZ   = (Math.max(...axleZs) - Math.min(...axleZs)) + 0.88;
  const maxOutboard  = Math.max(...trailer.axles.map(a => a.trackWidthM / 2));

  for (const axle of trailer.axles) {
    const az       = axle.zPosM;
    const outboard = axle.trackWidthM / 2;
    const wheelR   = axle.wheelDiaM / 2;
    els.push(
      <Rail key={`axl-${axle.id}`}
        from={[-outboard, axleCentY, az]}
        to={[ outboard, axleCentY, az]}
        color={dark} r={0.026}
      />
    );
    for (const xs of [-1, 1]) {
      const wx = xs * outboard;
      els.push(
        <mesh key={`tyre-${axle.id}-${xs}`}
          position={[wx, axleCentY, az]}
          rotation={[0, 0, Math.PI / 2]}
        >
          <cylinderGeometry args={[wheelR, wheelR, 0.19, 28]} />
          <meshStandardMaterial color="#0d1117" roughness={0.98} />
        </mesh>
      );
      els.push(
        <mesh key={`rim-${axle.id}-${xs}`}
          position={[wx, axleCentY, az]}
          rotation={[0, 0, Math.PI / 2]}
        >
          <cylinderGeometry args={[wheelR * 0.56, wheelR * 0.56, 0.20, 10]} />
          <meshStandardMaterial color="#b0bbc4" metalness={0.6} roughness={0.35} />
        </mesh>
      );
    }
  }
  // Shared fender spanning the axle group
  for (const xs of [-1, 1]) {
    els.push(
      <mesh key={`fender-${xs}`}
        position={[xs * maxOutboard, axleCentY + maxWheelR * 1.60, fenderMidZ]}
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
// Fixed 2-group, 4-tier staging rack — same visual language as the trailer rack.
// armHW: half-width of the horizontal arms (sized to the widest boat configuration).
function StagingRack({ tiers, rackLength, armHW, offsetX, label }: {
  tiers: number; rackLength: number; armHW: number; offsetX: number; label?: string;
}) {
  const halfLen = rackLength / 2;
  const groundY = -0.05;
  const legH    = 0.30;
  const deckY   = groundY + legH;
  const topY    = tierY(0, tiers);
  const alum    = '#c4cdd6';

  // Two tower groups, evenly distributed along the rack length
  const towerInset = 0.20;
  const towerSpan  = rackLength - 2 * towerInset;
  const nTowers    = 2;
  const towerZs    = Array.from({ length: nTowers }, (_, i) =>
    halfLen - towerInset - (i / (nTowers - 1)) * towerSpan
  );

  const legSpread = armHW * 0.48; // A-frame feet spread in X
  const els: React.ReactElement[] = [];

  for (let ti = 0; ti < towerZs.length; ti++) {
    const tz = towerZs[ti];

    // Single vertical post from deck to top tier
    els.push(
      <Rail key={`post-${ti}`}
        from={[0, deckY, tz]} to={[0, topY, tz]}
        color={alum} r={0.034}
      />
    );

    // A-frame legs: two pairs spreading in X and Z
    for (const xs of [-legSpread, legSpread]) {
      for (const pz of [-0.18, 0.18]) {
        els.push(
          <Rail key={`leg-${ti}-${xs}-${pz}`}
            from={[0, deckY, tz]}
            to={[xs, groundY, tz + pz]}
            color={alum} r={0.022}
          />
        );
      }
      // Foot bar
      els.push(
        <mesh key={`foot-${ti}-${xs}`} position={[xs, groundY - 0.01, tz]}>
          <boxGeometry args={[0.06, 0.022, 0.44]} />
          <meshStandardMaterial color={alum} metalness={0.3} roughness={0.65} />
        </mesh>
      );
    }

    // Horizontal arms at each tier
    for (let t = 0; t < tiers; t++) {
      const y = tierY(t, tiers);
      els.push(
        <Rail key={`armL-${ti}-${t}`}
          from={[0, y, tz]} to={[-armHW, y, tz]}
          color={alum} r={0.022}
        />
      );
      els.push(
        <Rail key={`armR-${ti}-${t}`}
          from={[0, y, tz]} to={[armHW, y, tz]}
          color={alum} r={0.022}
        />
      );
    }

    // Foam pad strips
    for (let t = 0; t < tiers; t++) {
      const y = tierY(t, tiers);
      els.push(
        <mesh key={`pad-${ti}-${t}`} position={[0, y + 0.026, tz]}>
          <boxGeometry args={[armHW * 2, 0.040, 0.055]} />
          <meshStandardMaterial color="#111118" roughness={0.97} />
        </mesh>
      );
    }
  }

  // Longitudinal runner linking the two tower groups
  const runnerY = tierY(1, tiers);
  els.push(
    <Rail key="runner"
      from={[0, runnerY, towerZs[0]]}
      to={[0, runnerY, towerZs[nTowers - 1]]}
      color={alum} r={0.026}
    />
  );

  return (
    <group position={[offsetX, 0, 0]}>
      {els}
      {label && (
        <Text
          position={[0, tierY(0, tiers) + 0.45, 0]}
          fontSize={0.34}
          color="#334155"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.012}
          outlineColor="#ffffff"
        >
          {label}
        </Text>
      )}
    </group>
  );
}

// â”€â”€ Controls â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function Controls({ maxDist, enabled }: { maxDist: number; enabled: boolean }) {
  const ref = useRef<any>(null);
  useFrame(() => {});
  return <OrbitControls ref={ref} enabled={enabled} enablePan={false} minDistance={2} maxDistance={maxDist} />;
}

// -- Scene --------------------------------------------------------------------
function Scene() {
  const { trailer, boats, placements, movePlacement, addPlacement, removePlacement } = useStore();

  const boatById     = Object.fromEntries(boats.map(b => [b.id, b]));
  const boatColorIdx = Object.fromEntries(boats.map((b, i) => [b.id, i]));

  // ── Drag state ────────────────────────────────────────────────────────────
  // source: 'placement' = dragging a placed boat; 'staging' = dragging from staging rack
  interface DragState {
    source: 'placement' | 'staging';
    id: string;       // placementId (placement) or boatId (staging)
    boatId: string;
    origTier: number;
    screenX0: number;
    screenY0: number;
    offsetX: number;
    offsetZ: number;
    previewX: number;
    previewZ: number;
    previewTier: number;
  }
  const [drag, setDrag] = useState<DragState | null>(null);

  const towerZs  = useMemo(() => computeTowerZs(trailer),  [trailer]);
  const towerXZs = useMemo(() => computeTowerXZs(trailer), [trailer]);
  const halfLen = trailer.bedLengthM / 2;
  const halfW   = trailer.trailerWidthM / 2;

  // Tier changes only when vertical movement dominates and exceeds threshold
  const TIER_THRESHOLD_PX = 80;

  function calcTier(e: React.PointerEvent | PointerEvent, drag: DragState) {
    const dx = Math.abs(e.clientX - drag.screenX0);
    const dy = e.clientY - drag.screenY0;
    // Only register tier change when moving more vertically than horizontally
    if (Math.abs(dy) < TIER_THRESHOLD_PX || Math.abs(dy) < dx * 1.2) return drag.previewTier;
    const delta = Math.round(dy / TIER_THRESHOLD_PX);
    return Math.max(0, Math.min(trailer.tiers.length - 1, drag.origTier + delta));
  }

  function startDrag(e: ThreeEvent<PointerEvent>, placement: BoatPlacement) {
    setDrag({
      source: 'placement',
      id: placement.id,
      boatId: placement.boatId,
      origTier: placement.tier,
      screenX0: e.nativeEvent.clientX,
      screenY0: e.nativeEvent.clientY,
      offsetX: e.point.x - placement.xM,
      offsetZ: e.point.z - placement.zCenterM,
      previewX: placement.xM,
      previewZ: placement.zCenterM,
      previewTier: placement.tier,
    });
  }

  function startStagingDrag(e: ThreeEvent<PointerEvent>, boat: { id: string; lengthM: number; widthM: number }, stagingX: number) {
    setDrag({
      source: 'staging',
      id: boat.id,
      boatId: boat.id,
      origTier: 0,
      screenX0: e.nativeEvent.clientX,
      screenY0: e.nativeEvent.clientY,
      offsetX: e.point.x - stagingX,
      offsetZ: e.point.z,
      previewX: 0,
      previewZ: 0,
      previewTier: 0,
    });
  }

  function onDragMove(e: ThreeEvent<PointerEvent>) {
    if (!drag) return;
    const boat = boatById[drag.boatId];
    if (!boat) return;
    const newTier = calcTier(e.nativeEvent, drag);
    const rawX = e.point.x - drag.offsetX;
    const rawZ = e.point.z - drag.offsetZ;
    const snZ  = snapZ(rawZ, boat.lengthM, towerZs, halfLen);
    // Don't clamp X — allow dragging off the trailer so the user can unplace boats
    setDrag(d => d ? { ...d, previewX: rawX, previewZ: snZ, previewTier: newTier } : null);
  }

  function onDragEnd(e: ThreeEvent<PointerEvent>) {
    if (!drag) return;
    const boat = boatById[drag.boatId];
    const newTier = calcTier(e.nativeEvent, drag);
    const isOnTrailer = drag.previewX >= -halfW - 0.5 && drag.previewX <= halfW + 0.5;
    const clear = boat
      ? (newTier === 0 || boatClearsTowers(boat, drag.previewX, drag.previewZ, towerXZs))
      : true;

    if (drag.source === 'placement') {
      if (!isOnTrailer) {
        removePlacement(drag.id);
      } else if (clear) {
        movePlacement(drag.id, { tier: newTier, xM: drag.previewX, zCenterM: drag.previewZ });
      }
    } else {
      // staging → trailer
      if (isOnTrailer && clear && boat) {
        addPlacement({ boatId: drag.boatId, tier: newTier, xM: drag.previewX, zCenterM: drag.previewZ });
      }
    }
    setDrag(null);
  }
  // ──────────────────────────────────────────────────────────────────────────

  const trailerLength = trailer.bedLengthM ?? 10.97;


  // Unplaced boats go on staging racks — 16 boats per rack, new rack added when full
  const STAGING_SLOT_W    = 0.55;
  const STAGING_PER_TIER  = 4;
  const STAGING_TIERS     = 4;
  const STAGING_CAPACITY  = STAGING_PER_TIER * STAGING_TIERS; // 16 per rack
  const placedIds = new Set(placements.map(p => p.boatId));
  const unplaced  = boats.filter(b => !placedIds.has(b.id));
  const homeUnplaced  = unplaced.filter(b => !b.guest);
  const guestUnplaced = unplaced.filter(b => b.guest);

  function buildGrid(list: Boat[]) {
    const halfW = ((STAGING_PER_TIER * STAGING_SLOT_W) + (STAGING_PER_TIER - 1) * BOAT_GAP_X) / 2;
    return list.map((boat, i) => {
      const rackIdx   = Math.floor(i / STAGING_CAPACITY);
      const posInRack = i % STAGING_CAPACITY;
      const tier = Math.floor(posInRack / STAGING_PER_TIER);
      const pos  = posInRack % STAGING_PER_TIER;
      const x    = -halfW + pos * (STAGING_SLOT_W + BOAT_GAP_X) + STAGING_SLOT_W / 2;
      return { boat, tier, x, rackIdx };
    });
  }
  const homeGrid  = useMemo(() => buildGrid(homeUnplaced),  [homeUnplaced]);
  const guestGrid = useMemo(() => buildGrid(guestUnplaced), [guestUnplaced]);

  const homeRackCount  = Math.max(1, Math.ceil(homeUnplaced.length / STAGING_CAPACITY));
  const guestRackCount = Math.ceil(guestUnplaced.length / STAGING_CAPACITY); // 0 when no guests

  // Fixed arm half-width: span all 4 slots plus clearance
  const stagingArmHW  = ((STAGING_PER_TIER * STAGING_SLOT_W) + (STAGING_PER_TIER - 1) * BOAT_GAP_X) / 2 + 0.20;
  const rackSpacing   = stagingArmHW * 2 + 1.0;
  const trailerFrameHW = (trailer.trailerWidthM ?? 2.44) / 2;
  const firstRackX    = trailerFrameHW + stagingArmHW + 3.5;
  // Home racks extend on the +X side, guest racks mirror onto the −X side
  const homeRackX  = (ri: number) =>  (firstRackX + ri * rackSpacing);
  const guestRackX = (ri: number) => -(firstRackX + ri * rackSpacing);

  const totalLen = trailerLength + (trailer.tongueLengthM ?? 2.0);
  const camD     = Math.max(totalLen * 0.65, 14);
  const tYs      = tierYs(trailer);

  return (
    <>
      <PerspectiveCamera makeDefault position={[camD * 0.5, camD * 0.38, camD * 0.75]} fov={50} />
      <Controls maxDist={trailerLength * 4} enabled={drag === null} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 10, -4]} intensity={1.4} castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-4, 4, 8]} intensity={0.5} />
      <hemisphereLight args={['#bfdbfe', '#94a3b8', 0.4]} />

      <group>
        <TrailerFrame trailer={trailer} />

        {/* Placed boats on trailer */}
        {placements.map(p => {
          const boat = boatById[p.boatId];
          if (!boat) return null;
          const isDragging = drag?.source === 'placement' && drag.id === p.id;
          const rawDispX = isDragging ? drag!.previewX : p.xM;
          const dispX = isDragging ? Math.max(-halfW - 1, Math.min(halfW + 1, rawDispX)) : rawDispX;
          const dispZ = isDragging ? drag!.previewZ : p.zCenterM;
          const dispTier = isDragging ? drag!.previewTier : p.tier;
          const posY  = p.slung ? tYs[p.tier] : tYs[dispTier] + 0.03;
          return (
            <ShellMesh
              key={p.id}
              boat={boat}
              posX={dispX}
              posY={posY}
              posZ={dispZ}
              slung={p.slung}
              colorIndex={boatColorIdx[boat.id]}
              isSelected={isDragging}
              onPointerDown={(e) => { if (!drag) startDrag(e, p); }}
            />
          );
        })}

        {/* Ghost boat when dragging from staging rack onto trailer */}
        {drag?.source === 'staging' && (() => {
          const boat = boatById[drag.boatId];
          if (!boat) return null;
          const isOnTrailer = drag.previewX >= -halfW - 0.5 && drag.previewX <= halfW + 0.5;
          if (!isOnTrailer) return null;
          return (
            <ShellMesh
              boat={boat}
              posX={drag.previewX}
              posY={tYs[drag.previewTier] + 0.03}
              posZ={drag.previewZ}
              colorIndex={boatColorIdx[boat.id]}
              isSelected={true}
              onPointerDown={() => {}}
            />
          );
        })()}

        {/* Invisible drag-capture plane at ground level — absorbs pointer move/up while dragging */}
        {drag && (
          <mesh
            position={[0, 0.01, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            onPointerMove={onDragMove}
            onPointerUp={onDragEnd}
          >
            <planeGeometry args={[200, 200]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>
        )}

        {/* Home staging racks on the +X side */}
        {Array.from({ length: homeRackCount }, (_, ri) => (
          <StagingRack
            key={`home-${ri}`}
            tiers={STAGING_TIERS}
            rackLength={6.0}
            armHW={stagingArmHW}
            offsetX={homeRackX(ri)}
            label={ri === 0 ? 'CLUB' : undefined}
          />
        ))}

        {/* Guest staging racks on the −X side (only when there are guest boats) */}
        {Array.from({ length: guestRackCount }, (_, ri) => (
          <StagingRack
            key={`guest-${ri}`}
            tiers={STAGING_TIERS}
            rackLength={6.0}
            armHW={stagingArmHW}
            offsetX={guestRackX(ri)}
            label={ri === 0 ? 'GUEST' : undefined}
          />
        ))}

        {/* Home unplaced boats */}
        {homeGrid.map(({ boat, tier, x, rackIdx }) => {
          const stagingX = homeRackX(rackIdx) + x;
          const isDragging = drag?.source === 'staging' && drag.id === boat.id;
          if (isDragging) return null; // ghost shown on trailer instead
          return (
            <ShellMesh
              key={boat.id}
              boat={boat}
              posX={stagingX}
              posY={tierY(tier, STAGING_TIERS) + 0.03}
              posZ={0}
              colorIndex={boatColorIdx[boat.id]}
              isSelected={false}
              onPointerDown={(e) => { if (!drag) startStagingDrag(e, boat, stagingX); }}
            />
          );
        })}

        {/* Guest unplaced boats */}
        {guestGrid.map(({ boat, tier, x, rackIdx }) => {
          const stagingX = guestRackX(rackIdx) + x;
          const isDragging = drag?.source === 'staging' && drag.id === boat.id;
          if (isDragging) return null; // ghost shown on trailer instead
          return (
            <ShellMesh
              key={boat.id}
              boat={boat}
              posX={stagingX}
              posY={tierY(tier, STAGING_TIERS) + 0.03}
              posZ={0}
              colorIndex={boatColorIdx[boat.id]}
              isSelected={false}
              onPointerDown={(e) => { if (!drag) startStagingDrag(e, boat, stagingX); }}
            />
          );
        })}
      </group>
    </>
  );
}

// -- Page ---------------------------------------------------------------------
export default function Visualizer3D() {
  const { boats, placements, autoLayout, clearPlacements } = useStore();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { void e; };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const btnStyle: React.CSSProperties = {
    padding: '8px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
    fontWeight: 600, fontSize: 13, backdropFilter: 'blur(8px)',
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {placements.length === 0 && (
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

      {/* Toolbar overlay */}
      <div style={{
        position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
        zIndex: 10, display: 'flex', gap: 8,
      }}>
        <button
          onClick={autoLayout}
          style={{ ...btnStyle, background: 'rgba(29,78,216,0.85)', color: 'white' }}
        >
          ✨ Auto-Arrange
        </button>
        <button
          onClick={clearPlacements}
          style={{ ...btnStyle, background: 'rgba(255,255,255,0.15)', color: 'white' }}
        >
          Clear Layout
        </button>
      </div>

      <Canvas
        dpr={[1, 1]}
        style={{ flex: 1, background: '#0f172a' }}
        gl={{ antialias: false }}
        onCreated={({ gl }) => { gl.shadowMap.enabled = false; }}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>

      <div style={{
        position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)',
        background: 'rgba(0,0,0,0.55)', color: 'white', fontSize: 11,
        padding: '4px 12px', borderRadius: 99, pointerEvents: 'none',
      }}>
        Drag to orbit · Pinch to zoom
      </div>
    </div>
  );
}
