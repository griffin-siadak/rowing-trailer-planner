import { useRef, useState } from 'react';
import { useStore } from '../store';
import { tierYs } from '../utils';
import type { Trailer } from '../types';
import { useIsMobile } from '../useIsMobile';

const TIER_NAMES = ['Top', 'Upper-Mid', 'Lower-Mid', 'Bottom', 'Fifth', 'Sixth'];

// The model stores metres; the editor UI shows/edits inches.
const M_TO_IN = 39.3701;
const toIn = (m: number) => m * M_TO_IN;                 // metres → inches
const fromIn = (inch: number) => inch / M_TO_IN;         // inches → metres
const inStr = (m: number) => `${toIn(m).toFixed(1)}"`;   // display string

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

// Inline numeric editor: click an SVG readout to type an exact value. The input
// is an HTML overlay positioned over the clicked <text> (crisp, unlike scaled
// foreignObject). Each editable text passes its current value + a commit fn.
function useInlineEdit() {
  const ref = useRef<HTMLDivElement>(null);
  const [edit, setEdit] = useState<
    null | { left: number; top: number; draft: string; commit: (n: number) => void }
  >(null);

  // `value`/`commit` are in metres (model units); the input shows inches.
  function open(e: React.MouseEvent, value: number, commit: (n: number) => void) {
    e.stopPropagation();
    const tb = (e.currentTarget as Element).getBoundingClientRect();
    const cb = ref.current!.getBoundingClientRect();
    setEdit({
      left: tb.left - cb.left + tb.width / 2 - 36,
      top: tb.top - cb.top - 2,
      draft: String(+toIn(value).toFixed(1)),
      commit,
    });
  }
  function commitNow() {
    if (!edit) return;
    const n = parseFloat(edit.draft);
    if (!isNaN(n)) edit.commit(fromIn(n));   // inches → metres
    setEdit(null);
  }
  const overlay = edit ? (
    <input
      autoFocus type="number" value={edit.draft}
      onChange={(e) => setEdit({ ...edit, draft: e.target.value })}
      onBlur={commitNow}
      onKeyDown={(e) => { if (e.key === 'Enter') commitNow(); if (e.key === 'Escape') setEdit(null); }}
      style={{
        position: 'absolute', left: edit.left, top: edit.top, width: 72,
        fontSize: 11, padding: '1px 4px', border: '1px solid #1d4ed8',
        borderRadius: 4, zIndex: 5, boxSizing: 'border-box',
      }}
    />
  ) : null;
  return { ref, open, overlay };
}

// ─── Side profile: looking from the side (Z = length horizontal, Y = height) ──
type SideDrag =
  | { kind: 'bed' }
  | { kind: 'tongue' }
  | { kind: 'towerZ'; id: string }
  | { kind: 'axleZ'; id: string };

function SideView({ trailer }: { trailer: Trailer }) {
  const { updateTrailer, updateTowerGroup, updateAxle, updateTier } = useStore();
  const svgRef = useRef<SVGSVGElement>(null);
  const [drag, setDrag] = useState<SideDrag | null>(null);
  const { ref, open, overlay } = useInlineEdit();
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
  const vbW = C.frontMax + C.halfLen + 2 * pad;
  const vbH = C.yTop - (C.realFloor - pad * 0.6);

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

  return (
    <div ref={ref} style={{ position: 'relative' }}>
    <svg ref={svgRef} viewBox={`0 0 ${vbW} ${vbH}`}
      style={{ width: '100%', maxHeight: 340, display: 'block', margin: '0 auto', touchAction: 'none' }}
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
      <text x={(sx(g.halfLen + trailer.tongueLengthM) + sx(g.halfLen)) / 2} y={sy(DECK_Y) + 0.07 - 0.12}
        textAnchor="middle" fontSize={fs * 0.85} fill={COL.label} style={{ cursor: 'text' }}
        onClick={(e) => open(e, trailer.tongueLengthM, (n) => updateTrailer({ tongueLengthM: Math.max(0.3, Math.min(6, n)) }))}>
        tongue {inStr(trailer.tongueLengthM)}
      </text>

      {/* tier rails */}
      {g.tYs.map((y, t) => (
        <g key={t}>
          <line x1={sx(g.frontZ)} y1={sy(y)} x2={sx(g.rearZ)} y2={sy(y)} stroke={COL.tier} strokeWidth={stroke} />
          <text x={sx(g.rearZ) + 0.12} y={sy(y) + 0.16} textAnchor="start" fontSize={fs * 0.8} fill={COL.label} style={{ cursor: 'text' }}
            onClick={(e) => open(e, trailer.tiers[t].heightM, (n) => updateTier(trailer.tiers[t].id, { heightM: Math.max(0.15, Math.min(1.5, n)) }))}>
            {TIER_NAMES[t] ?? `T${t + 1}`} · {inStr(trailer.tiers[t].heightM)}
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
          <text x={sx(grp.zPosM)} y={sy(g.topY) - 0.10} textAnchor="middle" fontSize={fs * 0.8} fill={COL.post} style={{ cursor: 'text' }}
            onClick={(e) => open(e, grp.zPosM, (n) => updateTowerGroup(grp.id, { zPosM: Math.max(-g.halfLen - 1, Math.min(g.halfLen + 1, n)) }))}>
            G{i + 1} · z{grp.zPosM >= 0 ? '+' : ''}{toIn(grp.zPosM).toFixed(1)}"
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
      <text x={(sx(g.halfLen) + sx(-g.halfLen)) / 2} y={sy(g.realFloor) + 0.30}
        textAnchor="middle" fontSize={fs} fill={COL.dim} style={{ cursor: 'text' }}
        onClick={(e) => open(e, trailer.bedLengthM, (n) => updateTrailer({ bedLengthM: Math.max(2, Math.min(20, n)) }))}>
        bed {inStr(trailer.bedLengthM)}
      </text>
    </svg>
    {overlay}
    </div>
  );
}

// ─── End cross-section: looking down the length (X = lateral, Y = height) ─────
type EndDrag =
  | { kind: 'width' }
  | { kind: 'tierH'; i: number }
  | { kind: 'tierW'; i: number }
  | { kind: 'postX' };

function EndView({ trailer }: { trailer: Trailer }) {
  const { updateTrailer, updateTier, updateTowerGroup } = useStore();
  // Posts are edited uniformly: every tower group shares the same lateral layout.
  const postsPerTower = trailer.towerGroups[0]?.postXs.length ?? 1;
  const postOffset = postsPerTower > 1 ? Math.abs(trailer.towerGroups[0].postXs[1]) : 0;
  const setUniformPostXs = (xs: number[]) => trailer.towerGroups.forEach(grp => updateTowerGroup(grp.id, { postXs: xs }));
  const svgRef = useRef<SVGSVGElement>(null);
  const [drag, setDrag] = useState<EndDrag | null>(null);
  const { ref, open, overlay } = useInlineEdit();
  const isMobile = useIsMobile();

  const g = trailerGeom(trailer);
  const maxRail  = Math.max(trailer.trailerWidthM, ...trailer.tiers.map(t => t.railWidthM));
  const halfSpan = maxRail / 2;
  const pad = 0.55;

  const ex = (x: number) => (halfSpan + pad) + x;       // x=0 at centre
  const yTop = g.topY + pad;
  const ey = (y: number) => yTop - y;

  const vbW = 2 * (halfSpan + pad);
  const vbH = yTop - (g.realFloor - pad * 0.6);
  const stroke = 0.03;
  const fs = 0.20;
  const HANDLE = isMobile ? 0.26 : 0.13;
  const HIT = isMobile ? 0.36 : 0.16;   // invisible hit-line width for rail/post drags

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
    } else if (drag.kind === 'postX' && postsPerTower > 1) {
      const off = Math.max(0.05, Math.min(trailer.trailerWidthM / 2 - 0.05, Math.abs(mx)));
      setUniformPostXs([-off, off]);
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
    <div ref={ref} style={{ position: 'relative' }}>
    <svg ref={svgRef} viewBox={`0 0 ${vbW} ${vbH}`}
      style={{ width: '100%', maxHeight: 360, display: 'block', margin: '0 auto', touchAction: 'none' }}
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
      <text x={ex(0)} y={ey(DECK_Y) - 0.16} textAnchor="middle" fontSize={fs * 0.8} fill={COL.frame} style={{ cursor: 'text' }}
        onClick={(e) => open(e, trailer.trailerWidthM, (n) => updateTrailer({ trailerWidthM: Math.max(0.6, Math.min(4, n)) }))}>
        width {inStr(trailer.trailerWidthM)}
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
            <text x={ex(-hw) - 0.12} y={ey(y) - 0.05} textAnchor="end" fontSize={fs * 0.7} fill={COL.label} style={{ cursor: 'text' }}
              onClick={(e) => open(e, trailer.tiers[t].heightM, (n) => updateTier(trailer.tiers[t].id, { heightM: Math.max(0.15, Math.min(1.5, n)) }))}>
              {(TIER_NAMES[t] ?? `T${t + 1}`)}: h{inStr(trailer.tiers[t].heightM)}
            </text>
            <text x={ex(-hw) - 0.12} y={ey(y) + 0.18} textAnchor="end" fontSize={fs * 0.7} fill={COL.label} style={{ cursor: 'text' }}
              onClick={(e) => open(e, trailer.tiers[t].railWidthM, (n) => updateTier(trailer.tiers[t].id, { railWidthM: Math.max(0.3, Math.min(4, n)) }))}>
              w{inStr(trailer.tiers[t].railWidthM)}
            </text>
          </g>
        );
      })}

      {/* tower posts (vertical at each unique X) — draggable laterally (uniform) */}
      {postXs.map((px, i) => (
        <g key={i}>
          <line x1={ex(px)} y1={ey(DECK_Y)} x2={ex(px)} y2={ey(g.topY)} stroke="transparent" strokeWidth={HIT}
            style={{ cursor: postsPerTower > 1 ? 'ew-resize' : 'default' }}
            onPointerDown={(e) => postsPerTower > 1 && startDrag(e, { kind: 'postX' })} />
          <line x1={ex(px)} y1={ey(DECK_Y)} x2={ex(px)} y2={ey(g.topY)} stroke={COL.post} strokeWidth={postW} />
        </g>
      ))}
      <text x={ex(0)} y={ey(g.topY) - 0.10} textAnchor="middle" fontSize={fs * 0.72} fill={COL.post}
        style={{ cursor: postsPerTower > 1 ? 'text' : 'default' }}
        onClick={(e) => postsPerTower > 1 && open(e, postOffset, (n) => {
          const off = Math.max(0.05, Math.min(trailer.trailerWidthM / 2 - 0.05, n));
          setUniformPostXs([-off, off]);
        })}>
        {postsPerTower > 1 ? `posts ±${inStr(postOffset)}` : 'single centre post'}
      </text>
    </svg>
    {overlay}
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

  return (
    <div style={{ padding: 16, overflowY: 'auto', flex: 1 }}>
      <div style={{ ...card, background: '#eff6ff', border: '1px solid #bfdbfe', fontSize: 13, color: '#1d4ed8' }}>
        Visual trailer editor — drag the handles in either view to reshape the trailer, or click any
        value to type an exact number; changes show live here and in the 3D view.
        <strong> Side profile:</strong> tongue, bed length, tower-group spacing, axle positions.
        <strong> End cross-section:</strong> tray, width, each tier's height &amp; rail width, posts.
      </div>

      <div style={card}>
        <div style={panelTitle}>Structure</div>
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
        <SideView trailer={trailer} />
      </div>

      <div style={card}>
        <div style={panelTitle}>End cross-section</div>
        <EndView trailer={trailer} />
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
            ['Bed length (in)', 'bedLengthM'],
            ['Width (in)', 'trailerWidthM'],
            ['Tongue (in)', 'tongueLengthM'],
            ['Beam width (in)', 'beamWidthM'],
          ] as const).map(([label, key]) => (
            <label key={key} style={{ flex: '1 1 140px', fontSize: 12, fontWeight: 600, color: '#475569' }}>
              {label}
              <input type="number" step="0.25"
                value={toIn(trailer[key] as number).toFixed(1)}
                onChange={(e) => updateTrailer({ [key]: fromIn(Number(e.target.value)) } as Partial<Trailer>)}
                style={inStyle}
              />
            </label>
          ))}
          <label style={{ flex: '1 1 140px', fontSize: 12, fontWeight: 600, color: '#475569' }}>
            Post width (in)
            <input type="number" step="0.25"
              value={toIn(trailer.towerGroups[0]?.postWidthM ?? 0.08).toFixed(1)}
              onChange={(e) => setPostWidth(fromIn(Number(e.target.value)))}
              style={inStyle}
            />
          </label>
          <label style={{ flex: '1 1 140px', fontSize: 12, fontWeight: 600, color: '#475569' }}>
            Wheel track (in)
            <input type="number" step="0.25"
              value={toIn(wheelTrack).toFixed(1)}
              onChange={(e) => setTrack(fromIn(Number(e.target.value)))}
              style={inStyle}
            />
          </label>
        </div>
      </div>
    </div>
  );
}
