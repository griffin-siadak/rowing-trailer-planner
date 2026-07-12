import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '../store';
import { tierYs } from '../utils';
import type { Trailer } from '../types';
import { useIsMobile } from '../useIsMobile';

const TIER_NAMES = ['Top', 'Upper-Mid', 'Lower-Mid', 'Bottom', 'Fifth', 'Sixth'];

// The model stores metres; the editor UI shows/edits inches or millimetres.
export type Unit = 'in' | 'mm';
const UNIT_PER_M: Record<Unit, number> = { in: 39.3701, mm: 1000 };
const toUnit   = (m: number, u: Unit) => m * UNIT_PER_M[u];
const fromUnit = (v: number, u: Unit) => v / UNIT_PER_M[u];
const fmtUnit  = (m: number, u: Unit) => toUnit(m, u).toFixed(u === 'in' ? 1 : 0);

// Geometry constants mirrored from the 3D renderer so the editor matches it.
const GROUND_Y   = -0.05;
const BEAM_DEPTH = 0.22;
const DECK_Y     = GROUND_Y + BEAM_DEPTH;

const COL = {
  frame:  '#475569',
  beam:   '#94a3b8',
  tier:   '#1d4ed8',
  post:   '#0f766e',
  wheel:  '#1e293b',
  tongue: '#64748b',
  ground: '#e2e8f0',
  label:  '#334155',
  dim:    '#94a3b8',
};

function trailerGeom(t: Trailer) {
  const tYs        = tierYs(t);
  const halfLen    = t.bedLengthM / 2;
  const chHW       = t.beamSpacingM / 2;
  const maxWheelR  = Math.max(0.2, ...t.axles.map(a => a.wheelDiaM / 2));
  const axleCentY  = GROUND_Y - maxWheelR + 0.04;
  const realFloor  = axleCentY - maxWheelR;
  const topY       = tYs[0];
  const towerZs    = t.towerGroups.map(g => g.zPosM);
  const frontZ     = Math.max(...towerZs);
  const rearZ      = Math.min(...towerZs);
  return { tYs, halfLen, chHW, maxWheelR, axleCentY, realFloor, topY, frontZ, rearZ };
}

const card: React.CSSProperties = {
  background: 'white', borderRadius: 12, padding: 12, marginBottom: 12,
  boxShadow: '0 1px 3px rgba(0,0,0,.1)',
};
const panelTitle: React.CSSProperties = {
  fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase',
  letterSpacing: '0.5px', marginBottom: 6,
};
const inStyle: React.CSSProperties = {
  width: '100%', marginTop: 4, padding: '8px 10px', border: '1px solid #cbd5e1',
  borderRadius: 8, fontSize: 14, boxSizing: 'border-box',
};

// Maps SVG viewBox coordinates to CSS pixels inside the wrapper div, so HTML
// inputs can be overlaid on the drawing. Tracks the rendered size (the SVG is
// width-constrained or maxHeight-constrained, with xMidYMid letterboxing).
function useFitScale(vbW: number, vbH: number) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setDims({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setDims({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);
  const toPx = (x: number, y: number) => {
    if (!dims || dims.w === 0) return null;
    const s = Math.min(dims.w / vbW, dims.h / vbH);
    return { left: (dims.w - vbW * s) / 2 + x * s, top: (dims.h - vbH * s) / 2 + y * s };
  };
  return { wrapRef, toPx };
}

// Persistent numeric input overlaid on the SVG, centred on a drawing point,
// with the active unit shown as a suffix. Fixed pixel size (crisp text,
// finger-friendly); shows/edits in `unit` while the model stays in metres.
function NumBox({ at, valueM, unit, commit }: {
  at: { left: number; top: number } | null;
  valueM: number; unit: Unit; commit: (m: number) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  if (!at) return null;
  function commitDraft() {
    if (draft !== null) {
      const n = parseFloat(draft);
      if (!isNaN(n)) commit(fromUnit(n, unit));
    }
    setDraft(null);
  }
  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      style={{
        position: 'absolute', left: at.left, top: at.top,
        transform: 'translate(-50%, -50%)',
        width: 66, height: 20, boxSizing: 'border-box',
        display: 'flex', alignItems: 'center',
        border: '1px solid #cbd5e1', borderRadius: 4,
        background: 'rgba(255,255,255,0.95)', paddingRight: 4,
      }}
    >
      <input
        type="text" inputMode="decimal"
        value={draft ?? fmtUnit(valueM, unit)}
        onChange={(e) => setDraft(e.target.value)}
        onFocus={(e) => { setDraft(fmtUnit(valueM, unit)); e.target.select(); }}
        onBlur={commitDraft}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
          if (e.key === 'Escape') setDraft(null);
        }}
        style={{
          flex: 1, minWidth: 0, height: '100%', boxSizing: 'border-box',
          fontSize: 11, textAlign: 'right', color: '#334155',
          border: 'none', background: 'transparent',
          padding: 0, outline: 'none',
        }}
      />
      <span style={{ fontSize: 9, color: '#94a3b8', marginLeft: 2, userSelect: 'none' }}>
        {unit}
      </span>
    </div>
  );
}

// ─── Side profile: looking from the side (Z = length horizontal, Y = height) ──
type SideDrag =
  | { kind: 'bed' }
  | { kind: 'tongue' }
  | { kind: 'towerZ'; id: string }
  | { kind: 'axleZ'; id: string };

function SideView({ trailer, unit }: { trailer: Trailer; unit: Unit }) {
  const { updateTrailer, updateTowerGroup, updateAxle, updateTier } = useStore();
  const svgRef = useRef<SVGSVGElement>(null);
  const [drag, setDrag] = useState<SideDrag | null>(null);
  const isMobile = useIsMobile();

  const g = trailerGeom(trailer);
  const pad = 0.6;

  // Coordinate frame is frozen while dragging so grabbed extremities track the
  // cursor (otherwise the auto-fitting viewBox would rescale out from under it).
  const liveC = { frontMax: g.halfLen + trailer.tongueLengthM, halfLen: g.halfLen, yTop: g.topY + pad, realFloor: g.realFloor };
  const frozen = useRef(liveC);
  if (!drag) frozen.current = liveC;
  const C = drag ? frozen.current : liveC;

  const sx = (z: number) => (C.frontMax + pad) - z;   // front (+Z, tongue) on the left
  const sy = (y: number) => C.yTop - y;
  const vbW = C.frontMax + C.halfLen + 2 * pad + 2.45;  // extra right room for tier boxes
  const vbH = C.yTop - (C.realFloor - pad * 0.6);
  const { wrapRef, toPx } = useFitScale(vbW, vbH);

  const stroke = 0.03;
  const fs = 0.20;
  const HANDLE = isMobile ? 0.30 : 0.16;
  const HIT = isMobile ? 0.40 : 0.20;   // invisible hit-line width for post/axle drags

  function toMeters(clientX: number, clientY: number) {
    const svg = svgRef.current!;
    const pt = svg.createSVGPoint();
    pt.x = clientX; pt.y = clientY;
    const p = pt.matrixTransform(svg.getScreenCTM()!.inverse());
    return { mz: (C.frontMax + pad) - p.x, my: C.yTop - p.y };
  }

  function onMove(e: React.PointerEvent<SVGSVGElement>) {
    if (!drag) return;
    const { mz } = toMeters(e.clientX, e.clientY);
    if (drag.kind === 'bed') {
      updateTrailer({ bedLengthM: Math.max(2, Math.min(20, Math.abs(mz) * 2)) });
    } else if (drag.kind === 'tongue') {
      updateTrailer({ tongueLengthM: Math.max(0.3, Math.min(6, mz - g.halfLen)) });
    } else if (drag.kind === 'towerZ') {
      updateTowerGroup(drag.id, { zPosM: Math.max(-g.halfLen - 1, Math.min(g.halfLen + 1, mz)) });
    } else if (drag.kind === 'axleZ') {
      updateAxle(drag.id, { zPosM: Math.max(-g.halfLen - 2, Math.min(g.halfLen, mz)) });
    }
  }

  function startDrag(e: React.PointerEvent, d: SideDrag) {
    e.stopPropagation();
    frozen.current = liveC;
    try { svgRef.current?.setPointerCapture(e.pointerId); } catch { /* non-active pointer */ }
    setDrag(d);
  }
  function endDrag(e: React.PointerEvent<SVGSVGElement>) {
    if (drag) {
      try { svgRef.current?.releasePointerCapture(e.pointerId); } catch { /* ignore */ }
      setDrag(null);
    }
  }

  const tongueMid = (sx(g.halfLen + trailer.tongueLengthM) + sx(g.halfLen)) / 2;
  const bedMid    = (sx(g.halfLen) + sx(-g.halfLen)) / 2;

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
    <svg ref={svgRef} viewBox={`0 0 ${vbW} ${vbH}`}
      style={{ width: '100%', height: 300, display: 'block', margin: '0 auto', touchAction: 'none' }}
      onPointerMove={onMove} onPointerUp={endDrag} onPointerLeave={endDrag}
    >
      {/* ground */}
      <line x1={0} y1={sy(g.realFloor)} x2={vbW} y2={sy(g.realFloor)} stroke={COL.ground} strokeWidth={0.04} />

      {/* chassis deck beam (bed) */}
      <rect x={sx(g.halfLen)} y={sy(DECK_Y)} width={sx(-g.halfLen) - sx(g.halfLen)} height={0.14} fill={COL.beam} />

      {/* tongue */}
      <line x1={sx(g.halfLen + trailer.tongueLengthM)} y1={sy(DECK_Y) + 0.07} x2={sx(g.halfLen)} y2={sy(DECK_Y) + 0.07}
        stroke={COL.tongue} strokeWidth={0.06} strokeLinecap="round" />
      <rect x={sx(g.halfLen + trailer.tongueLengthM) - HANDLE / 2} y={sy(DECK_Y) + 0.07 - HANDLE / 2}
        width={HANDLE} height={HANDLE} rx={0.03} fill={COL.tongue}
        stroke="transparent" strokeWidth={isMobile ? 0.7 : 0}
        style={{ cursor: 'ew-resize' }} onPointerDown={(e) => startDrag(e, { kind: 'tongue' })} />
      <text x={tongueMid - 0.06} y={sy(DECK_Y) - 0.20} textAnchor="end" fontSize={fs * 0.85} fill={COL.label}>
        tongue
      </text>

      {/* tier rails */}
      {g.tYs.map((y, t) => (
        <g key={t}>
          <line x1={sx(g.frontZ)} y1={sy(y)} x2={sx(g.rearZ)} y2={sy(y)} stroke={COL.tier} strokeWidth={stroke} />
          <text x={sx(g.rearZ) + 0.12} y={sy(y) + 0.16} textAnchor="start" fontSize={fs * 0.8} fill={COL.label}>
            {TIER_NAMES[t] ?? `T${t + 1}`}
          </text>
        </g>
      ))}

      {/* tower groups — vertical posts, draggable along Z */}
      {trailer.towerGroups.map((grp, i) => (
        <g key={grp.id}>
          <line x1={sx(grp.zPosM)} y1={sy(DECK_Y)} x2={sx(grp.zPosM)} y2={sy(g.topY)} stroke="transparent" strokeWidth={HIT}
            style={{ cursor: 'ew-resize' }} onPointerDown={(e) => startDrag(e, { kind: 'towerZ', id: grp.id })} />
          <line x1={sx(grp.zPosM)} y1={sy(DECK_Y)} x2={sx(grp.zPosM)} y2={sy(g.topY)}
            stroke={COL.post} strokeWidth={Math.max(0.03, grp.postWidthM)} />
          <text x={sx(grp.zPosM)} y={sy(g.topY) - 0.54} textAnchor="middle" fontSize={fs * 0.8} fill={COL.post}>
            G{i + 1}
          </text>
        </g>
      ))}

      {/* axles / wheels — draggable along Z */}
      {trailer.axles.map((a) => (
        <g key={a.id} style={{ cursor: 'ew-resize' }} onPointerDown={(e) => startDrag(e, { kind: 'axleZ', id: a.id })}>
          <circle cx={sx(a.zPosM)} cy={sy(g.axleCentY)} r={a.wheelDiaM / 2} fill={COL.wheel} />
          <circle cx={sx(a.zPosM)} cy={sy(g.axleCentY)} r={a.wheelDiaM / 2 * 0.45} fill="#b0bbc4" />
        </g>
      ))}

      {/* bed length + rear-edge handle */}
      <rect x={sx(-g.halfLen) - HANDLE / 2} y={sy(DECK_Y) - HANDLE / 2} width={HANDLE} height={HANDLE} rx={0.03}
        fill={COL.frame} stroke="transparent" strokeWidth={isMobile ? 0.7 : 0}
        style={{ cursor: 'ew-resize' }} onPointerDown={(e) => startDrag(e, { kind: 'bed' })} />
      <text x={bedMid - 0.06} y={sy(g.realFloor) + 0.27} textAnchor="end" fontSize={fs} fill={COL.dim}>
        bed
      </text>
    </svg>

    {/* HTML input overlays, positioned in drawing coordinates */}
    <NumBox unit={unit} at={toPx(tongueMid + 0.75, sy(DECK_Y) - 0.27)}
      valueM={trailer.tongueLengthM}
      commit={(n) => updateTrailer({ tongueLengthM: Math.max(0.3, Math.min(6, n)) })} />
    {g.tYs.map((y, t) => (
      <NumBox key={trailer.tiers[t].id} unit={unit} at={toPx(sx(g.rearZ) + 1.7, sy(y) + 0.09)}
        valueM={trailer.tiers[t].heightM}
        commit={(n) => updateTier(trailer.tiers[t].id, { heightM: Math.max(0.15, Math.min(1.5, n)) })} />
    ))}
    {trailer.towerGroups.map((grp) => (
      // Tower position shown as distance rearward from the bed's front edge (datum).
      <NumBox key={grp.id} unit={unit} at={toPx(sx(grp.zPosM), sy(g.topY) - 0.28)}
        valueM={g.halfLen - grp.zPosM}
        commit={(d) => updateTowerGroup(grp.id, { zPosM: Math.max(-g.halfLen - 1, Math.min(g.halfLen + 1, g.halfLen - d)) })} />
    ))}
    <NumBox unit={unit} at={toPx(bedMid + 0.72, sy(g.realFloor) + 0.19)}
      valueM={trailer.bedLengthM}
      commit={(n) => updateTrailer({ bedLengthM: Math.max(2, Math.min(20, n)) })} />
    </div>
  );
}

// ─── End cross-section: looking down the length (X = lateral, Y = height) ─────
type EndDrag =
  | { kind: 'width' }
  | { kind: 'tierH'; i: number }
  | { kind: 'tierW'; i: number }
  | { kind: 'postX' };

function EndView({ trailer, unit }: { trailer: Trailer; unit: Unit }) {
  const { updateTrailer, updateTier, updateTowerGroup } = useStore();
  // Posts are edited uniformly: every tower group shares the same lateral layout.
  const postsPerTower = trailer.towerGroups[0]?.postXs.length ?? 1;
  // Two posts: symmetric ± offset. Single post: signed lateral position.
  const postOffset = postsPerTower > 1
    ? Math.abs(trailer.towerGroups[0].postXs[1])
    : (trailer.towerGroups[0]?.postXs[0] ?? 0);
  const setUniformPostXs = (xs: number[]) => trailer.towerGroups.forEach(grp => updateTowerGroup(grp.id, { postXs: xs }));
  const svgRef = useRef<SVGSVGElement>(null);
  const [drag, setDrag] = useState<EndDrag | null>(null);
  const isMobile = useIsMobile();

  const g = trailerGeom(trailer);
  const maxRail  = Math.max(trailer.trailerWidthM, ...trailer.tiers.map(t => t.railWidthM));
  const pad = 1.6;   // wide margins leave room for the tier input boxes

  // Coordinate frame is frozen while dragging: resizing a tier/width changes the
  // auto-fit viewBox, which would shift the pointer→metres mapping mid-drag and
  // make the handle chase (overshoot) the cursor.
  const liveC = { halfSpan: maxRail / 2, yTop: g.topY + pad, realFloor: g.realFloor };
  const frozen = useRef(liveC);
  if (!drag) frozen.current = liveC;
  const C = drag ? frozen.current : liveC;
  const halfSpan = C.halfSpan;
  const yTop = C.yTop;

  const ex = (x: number) => (halfSpan + pad) + x;       // x=0 at centre
  const ey = (y: number) => yTop - y;

  const vbW = 2 * (halfSpan + pad);
  const vbH = yTop - (C.realFloor - pad * 0.6);
  const stroke = 0.03;
  const fs = 0.20;
  const HANDLE = isMobile ? 0.26 : 0.15;
  const HIT = isMobile ? 0.36 : 0.18;   // invisible hit-line width for rail/post drags
  const { wrapRef, toPx } = useFitScale(vbW, vbH);

  // Unique post X positions across all groups (they overlap in an end view).
  const postXs = Array.from(new Set(trailer.towerGroups.flatMap(grp => grp.postXs))).sort((a, b) => a - b);
  const postW  = Math.max(0.03, trailer.towerGroups[0]?.postWidthM ?? 0.08);

  // Convert a client point into model metres (centre origin, Y up).
  function toMeters(clientX: number, clientY: number) {
    const svg = svgRef.current!;
    const pt = svg.createSVGPoint();
    pt.x = clientX; pt.y = clientY;
    const p = pt.matrixTransform(svg.getScreenCTM()!.inverse());
    return { mx: p.x - (halfSpan + pad), my: yTop - p.y };
  }

  function onMove(e: React.PointerEvent<SVGSVGElement>) {
    if (!drag) return;
    const { mx, my } = toMeters(e.clientX, e.clientY);
    if (drag.kind === 'width') {
      updateTrailer({ trailerWidthM: Math.max(0.6, Math.min(4, Math.abs(mx) * 2)) });
    } else if (drag.kind === 'tierW') {
      updateTier(trailer.tiers[drag.i].id, { railWidthM: Math.max(0.3, Math.min(4, Math.abs(mx) * 2)) });
    } else if (drag.kind === 'tierH') {
      // Drag tier i vertically → adjust its band height (distance to the tier below).
      const belowY = g.tYs[drag.i + 1] ?? 0;   // bottom tier measures from the deck datum (0)
      updateTier(trailer.tiers[drag.i].id, { heightM: Math.max(0.15, Math.min(1.5, my - belowY)) });
    } else if (drag.kind === 'postX') {
      const lim = trailer.trailerWidthM / 2 - 0.05;
      if (postsPerTower > 1) {
        // Two posts stay symmetric about the centreline
        const off = Math.max(0.05, Math.min(lim, Math.abs(mx)));
        setUniformPostXs([-off, off]);
      } else {
        // A single post slides anywhere across the trailer width (signed offset)
        setUniformPostXs([Math.max(-lim, Math.min(lim, mx))]);
      }
    }
  }

  function startDrag(e: React.PointerEvent, d: EndDrag) {
    e.stopPropagation();
    try { svgRef.current?.setPointerCapture(e.pointerId); } catch { /* non-active pointer */ }
    setDrag(d);
  }
  function endDrag(e: React.PointerEvent<SVGSVGElement>) {
    if (drag) {
      try { svgRef.current?.releasePointerCapture(e.pointerId); } catch { /* ignore */ }
      setDrag(null);
    }
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
    <svg ref={svgRef} viewBox={`0 0 ${vbW} ${vbH}`}
      style={{ width: '100%', height: 520, display: 'block', margin: '0 auto', touchAction: 'none' }}
      onPointerMove={onMove} onPointerUp={endDrag} onPointerLeave={endDrag}
    >
      {/* ground */}
      <line x1={0} y1={ey(g.realFloor)} x2={vbW} y2={ey(g.realFloor)} stroke={COL.ground} strokeWidth={0.04} />

      {/* centreline */}
      <line x1={ex(0)} y1={ey(g.topY) - 0.2} x2={ex(0)} y2={ey(g.realFloor)} stroke="#e2e8f0" strokeWidth={0.012} strokeDasharray="0.1 0.08" />

      {/* U-tray: floor + raised side walls, sitting on the two box-section chassis beams */}
      {(() => {
        const trayInnerHW = g.chHW + trailer.beamWidthM / 2;
        const trayTop = g.tYs[trailer.tiers.length - 1] - 0.04;   // just under the bottom tier
        const wallT = 0.07;
        const floorT = 0.11;
        const wallH = ey(DECK_Y) - ey(trayTop);
        return (
          <g>
            {/* box-section chassis beams (structure below the tray) */}
            {[-g.chHW, g.chHW].map((bx, i) => (
              <rect key={i} x={ex(bx) - trailer.beamWidthM / 2} y={ey(DECK_Y) + floorT} width={trailer.beamWidthM} height={0.26}
                fill={COL.frame} rx={0.015} />
            ))}
            {/* tray interior */}
            <rect x={ex(-trayInnerHW)} y={ey(trayTop)} width={trayInnerHW * 2} height={wallH}
              fill="#dde5ee" stroke="#94a3b8" strokeWidth={0.012} />
            {/* raised side walls */}
            {[-1, 1].map(s => (
              <rect key={s} x={ex(s * trayInnerHW) - wallT / 2} y={ey(trayTop)} width={wallT} height={wallH + floorT}
                fill={COL.frame} rx={0.02} />
            ))}
            {/* floor */}
            <rect x={ex(-trayInnerHW) - wallT} y={ey(DECK_Y)} width={trayInnerHW * 2 + wallT * 2} height={floorT}
              fill={COL.frame} rx={0.025} />
          </g>
        );
      })()}

      {/* trailer width handles (at deck level, ± width/2) */}
      {[-1, 1].map(s => (
        <rect key={s} x={ex(s * trailer.trailerWidthM / 2) - HANDLE / 2} y={ey(DECK_Y) - HANDLE / 2}
          width={HANDLE} height={HANDLE} rx={0.03} fill={COL.frame}
          style={{ cursor: 'ew-resize' }} onPointerDown={(e) => startDrag(e, { kind: 'width' })} />
      ))}
      <text x={ex(0) - 0.05} y={ey(DECK_Y) - 0.27} textAnchor="end" fontSize={fs * 0.8} fill={COL.frame}>
        width
      </text>

      {/* tier rails — draggable vertically (height) with end handle (width) */}
      {g.tYs.map((y, t) => {
        const hw = trailer.tiers[t].railWidthM / 2;
        return (
          <g key={t}>
            {/* fat invisible hit-line for vertical drag */}
            <line x1={ex(-hw)} y1={ey(y)} x2={ex(hw)} y2={ey(y)} stroke="transparent" strokeWidth={HIT}
              style={{ cursor: 'ns-resize' }} onPointerDown={(e) => startDrag(e, { kind: 'tierH', i: t })} />
            <line x1={ex(-hw)} y1={ey(y)} x2={ex(hw)} y2={ey(y)} stroke={COL.tier} strokeWidth={stroke} />
            {/* width handle at right end */}
            <rect x={ex(hw) - HANDLE / 2} y={ey(y) - HANDLE / 2} width={HANDLE} height={HANDLE} rx={0.03}
              fill={COL.tier} style={{ cursor: 'ew-resize' }} onPointerDown={(e) => startDrag(e, { kind: 'tierW', i: t })} />
            <text x={ex(-hw) - 0.86} y={ey(y) - 0.10} textAnchor="end" fontSize={fs * 0.7} fill={COL.label}>
              {(TIER_NAMES[t] ?? `T${t + 1}`)} h
            </text>
            <text x={ex(-hw) - 0.86} y={ey(y) + 0.20} textAnchor="end" fontSize={fs * 0.7} fill={COL.label}>
              w
            </text>
          </g>
        );
      })}

      {/* tower posts (vertical at each unique X) — draggable laterally (uniform) */}
      {postXs.map((px, i) => (
        <g key={i}>
          <line x1={ex(px)} y1={ey(DECK_Y)} x2={ex(px)} y2={ey(g.topY)} stroke="transparent" strokeWidth={HIT}
            style={{ cursor: 'ew-resize' }}
            onPointerDown={(e) => startDrag(e, { kind: 'postX' })} />
          <line x1={ex(px)} y1={ey(DECK_Y)} x2={ex(px)} y2={ey(g.topY)} stroke={COL.post} strokeWidth={postW} />
        </g>
      ))}
      <text x={ex(0) - 0.05} y={ey(g.topY) - 0.21} textAnchor="end" fontSize={fs * 0.72} fill={COL.post}>
        {postsPerTower > 1 ? 'posts ±' : 'post ▸L'}
      </text>
    </svg>

    {/* HTML input overlays, positioned in drawing coordinates */}
    <NumBox unit={unit} at={toPx(ex(0) + 0.42, ey(DECK_Y) - 0.32)}
      valueM={trailer.trailerWidthM}
      commit={(n) => updateTrailer({ trailerWidthM: Math.max(0.6, Math.min(4, n)) })} />
    {g.tYs.map((y, t) => {
      const hw = trailer.tiers[t].railWidthM / 2;
      return (
        <React.Fragment key={trailer.tiers[t].id}>
          <NumBox unit={unit} at={toPx(ex(-hw) - 0.44, ey(y) - 0.14)}
            valueM={trailer.tiers[t].heightM}
            commit={(n) => updateTier(trailer.tiers[t].id, { heightM: Math.max(0.15, Math.min(1.5, n)) })} />
          <NumBox unit={unit} at={toPx(ex(-hw) - 0.44, ey(y) + 0.16)}
            valueM={trailer.tiers[t].railWidthM}
            commit={(n) => updateTier(trailer.tiers[t].id, { railWidthM: Math.max(0.3, Math.min(4, n)) })} />
        </React.Fragment>
      );
    })}
    <NumBox unit={unit} at={toPx(ex(0) + 0.42, ey(g.topY) - 0.26)}
      // Pair: symmetric ± offset. Single: distance from the driver's (left) edge.
      valueM={postsPerTower > 1 ? postOffset : postOffset + trailer.trailerWidthM / 2}
      commit={(v) => {
        const halfW = trailer.trailerWidthM / 2;
        const lim = halfW - 0.05;
        if (postsPerTower > 1) {
          const off = Math.max(0.05, Math.min(lim, v));
          setUniformPostXs([-off, off]);
        } else {
          const x = v - halfW;   // v is distance from the left edge
          setUniformPostXs([Math.max(-lim, Math.min(lim, x))]);
        }
      }} />
    </div>
  );
}

function Stepper({ label, count, min, max, onAdd, onRemove }: {
  label: string; count: number; min: number; max?: number; onAdd: () => void; onRemove: () => void;
}) {
  const atMax = max != null && count >= max;
  const btn = (enabled: boolean): React.CSSProperties => ({
    width: 30, height: 30, borderRadius: 6, border: '1px solid #cbd5e1', background: 'white',
    fontSize: 16, lineHeight: 1, cursor: enabled ? 'pointer' : 'not-allowed',
    color: enabled ? '#1e293b' : '#cbd5e1',
  });
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, flex: '1 1 180px' }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: '#475569', flex: 1 }}>{label}</span>
      <button style={btn(count > min)} disabled={count <= min} onClick={onRemove}>−</button>
      <span style={{ fontWeight: 700, fontSize: 15, minWidth: 16, textAlign: 'center' }}>{count}</span>
      <button style={btn(!atMax)} disabled={atMax} onClick={onAdd}>+</button>
    </div>
  );
}

export default function TrailerEditor() {
  const {
    trailer, updateTrailer, updateTowerGroup, updateAxle,
    addTier, removeTier, addTowerGroup, removeTowerGroup, addAxle, removeAxle, clearPlacements,
  } = useStore();

  const wheelTrack = trailer.axles[0]?.trackWidthM ?? 2.89;
  const setTrack = (w: number) =>
    trailer.axles.forEach(a => updateAxle(a.id, { trackWidthM: Math.max(0.6, Math.min(4, w)) }));
  const postsPerTower = trailer.towerGroups[0]?.postXs.length ?? 1;
  const setPosts = (count: number) => {
    const off = trailer.trailerWidthM / 6;
    const xs = count <= 1 ? [0] : [-off, off];
    trailer.towerGroups.forEach(g => updateTowerGroup(g.id, { postXs: xs }));
  };
  const setPostWidth = (w: number) =>
    trailer.towerGroups.forEach(g => updateTowerGroup(g.id, { postWidthM: Math.max(0.02, Math.min(0.3, w)) }));

  // Display unit for all measurements (model stays metric internally).
  const [unit, setUnitState] = useState<Unit>(() =>
    (localStorage.getItem('rtp-units') === 'mm' ? 'mm' : 'in'));
  const setUnit = (u: Unit) => { setUnitState(u); localStorage.setItem('rtp-units', u); };

  return (
    <div style={{ padding: 16, overflowY: 'auto', flex: 1 }}>
      <div style={{ ...card, background: '#eff6ff', border: '1px solid #bfdbfe', fontSize: 13, color: '#1d4ed8' }}>
        Visual trailer editor — drag the handles in either view to reshape the trailer, or click any
        value to type an exact number; changes show live here and in the 3D view. Positions are
        measured from the <strong>driver-side front corner of the bed</strong>: tower/axle distance
        is rearward from the front edge, and a single post's position is from the driver's-side edge.
      </div>

      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={panelTitle}>Structure</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>Units</span>
            {(['in', 'mm'] as const).map(u => (
              <button key={u} onClick={() => setUnit(u)}
                style={{
                  padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  border: unit === u ? '2px solid #1d4ed8' : '1px solid #cbd5e1',
                  background: unit === u ? '#dbeafe' : 'white',
                  color: unit === u ? '#1d4ed8' : '#64748b',
                }}
              >{u}</button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Stepper label="Tiers" count={trailer.tiers.length} min={1}
            onAdd={addTier} onRemove={() => { removeTier(trailer.tiers[trailer.tiers.length - 1].id); clearPlacements(); }} />
          <Stepper label="Tower groups" count={trailer.towerGroups.length} min={2}
            onAdd={addTowerGroup} onRemove={() => removeTowerGroup(trailer.towerGroups[trailer.towerGroups.length - 1].id)} />
          <Stepper label="Axles" count={trailer.axles.length} min={1}
            onAdd={addAxle} onRemove={() => removeAxle(trailer.axles[trailer.axles.length - 1].id)} />
          <Stepper label="Posts / tower" count={postsPerTower} min={1} max={2}
            onAdd={() => setPosts(2)} onRemove={() => setPosts(1)} />
        </div>
      </div>

      <div style={card}>
        <div style={panelTitle}>Side profile</div>
        <SideView trailer={trailer} unit={unit} />
      </div>

      <div style={card}>
        <div style={panelTitle}>End cross-section</div>
        <EndView trailer={trailer} unit={unit} />
      </div>

      <div style={card}>
        <div style={panelTitle}>Overall</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <label style={{ flex: '1 1 140px', fontSize: 12, fontWeight: 600, color: '#475569' }}>
            Name
            <input type="text" value={trailer.name}
              onChange={(e) => updateTrailer({ name: e.target.value })}
              style={inStyle} />
          </label>
          {([
            ['Bed length', 'bedLengthM'],
            ['Width', 'trailerWidthM'],
            ['Tongue', 'tongueLengthM'],
            ['Beam width', 'beamWidthM'],
          ] as const).map(([label, key]) => (
            <label key={key} style={{ flex: '1 1 140px', fontSize: 12, fontWeight: 600, color: '#475569' }}>
              {label} ({unit})
              <input type="number" step={unit === 'in' ? '0.25' : '1'}
                value={fmtUnit(trailer[key] as number, unit)}
                onChange={(e) => updateTrailer({ [key]: fromUnit(Number(e.target.value), unit) } as Partial<Trailer>)}
                style={inStyle}
              />
            </label>
          ))}
          <label style={{ flex: '1 1 140px', fontSize: 12, fontWeight: 600, color: '#475569' }}>
            Post width ({unit})
            <input type="number" step={unit === 'in' ? '0.25' : '1'}
              value={fmtUnit(trailer.towerGroups[0]?.postWidthM ?? 0.08, unit)}
              onChange={(e) => setPostWidth(fromUnit(Number(e.target.value), unit))}
              style={inStyle}
            />
          </label>
          <label style={{ flex: '1 1 140px', fontSize: 12, fontWeight: 600, color: '#475569' }}>
            Wheel track ({unit})
            <input type="number" step={unit === 'in' ? '0.25' : '1'}
              value={fmtUnit(wheelTrack, unit)}
              onChange={(e) => setTrack(fromUnit(Number(e.target.value), unit))}
              style={inStyle}
            />
          </label>
        </div>
      </div>
    </div>
  );
}
