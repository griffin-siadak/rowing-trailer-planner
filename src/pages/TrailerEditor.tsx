import { useRef, useState } from 'react';
import { useStore } from '../store';
import { tierYs } from '../utils';
import type { Trailer } from '../types';

const TIER_NAMES = ['Top', 'Upper-Mid', 'Lower-Mid', 'Bottom', 'Fifth', 'Sixth'];

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

// Inline numeric editor: click an SVG readout to type an exact value. The input
// is an HTML overlay positioned over the clicked <text> (crisp, unlike scaled
// foreignObject). Each editable text passes its current value + a commit fn.
function useInlineEdit() {
  const ref = useRef<HTMLDivElement>(null);
  const [edit, setEdit] = useState<
    null | { left: number; top: number; draft: string; commit: (n: number) => void }
  >(null);

  function open(e: React.MouseEvent, value: number, commit: (n: number) => void) {
    e.stopPropagation();
    const tb = (e.currentTarget as Element).getBoundingClientRect();
    const cb = ref.current!.getBoundingClientRect();
    setEdit({
      left: tb.left - cb.left + tb.width / 2 - 36,
      top: tb.top - cb.top - 2,
      draft: String(+value.toFixed(3)),
      commit,
    });
  }
  function commitNow() {
    if (!edit) return;
    const n = parseFloat(edit.draft);
    if (!isNaN(n)) edit.commit(n);
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
  const HANDLE = 0.16;

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
        style={{ cursor: 'ew-resize' }} onPointerDown={(e) => startDrag(e, { kind: 'tongue' })} />
      <text x={(sx(g.halfLen + trailer.tongueLengthM) + sx(g.halfLen)) / 2} y={sy(DECK_Y) + 0.07 - 0.12}
        textAnchor="middle" fontSize={fs * 0.85} fill={COL.label} style={{ cursor: 'text' }}
        onClick={(e) => open(e, trailer.tongueLengthM, (n) => updateTrailer({ tongueLengthM: Math.max(0.3, Math.min(6, n)) }))}>
        tongue {trailer.tongueLengthM.toFixed(2)} m
      </text>

      {/* tier rails */}
      {g.tYs.map((y, t) => (
        <g key={t}>
          <line x1={sx(g.frontZ)} y1={sy(y)} x2={sx(g.rearZ)} y2={sy(y)} stroke={COL.tier} strokeWidth={stroke} />
          <text x={sx(g.rearZ) + 0.12} y={sy(y) + 0.16} textAnchor="start" fontSize={fs * 0.8} fill={COL.label} style={{ cursor: 'text' }}
            onClick={(e) => open(e, trailer.tiers[t].heightM, (n) => updateTier(trailer.tiers[t].id, { heightM: Math.max(0.15, Math.min(1.5, n)) }))}>
            {TIER_NAMES[t] ?? `T${t + 1}`} · {trailer.tiers[t].heightM.toFixed(2)} m
          </text>
        </g>
      ))}

      {/* tower groups — vertical posts, draggable along Z */}
      {trailer.towerGroups.map((grp, i) => (
        <g key={grp.id}>
          <line x1={sx(grp.zPosM)} y1={sy(DECK_Y)} x2={sx(grp.zPosM)} y2={sy(g.topY)} stroke="transparent" strokeWidth={0.20}
            style={{ cursor: 'ew-resize' }} onPointerDown={(e) => startDrag(e, { kind: 'towerZ', id: grp.id })} />
          <line x1={sx(grp.zPosM)} y1={sy(DECK_Y)} x2={sx(grp.zPosM)} y2={sy(g.topY)}
            stroke={COL.post} strokeWidth={Math.max(0.03, grp.postWidthM)} />
          <text x={sx(grp.zPosM)} y={sy(g.topY) - 0.10} textAnchor="middle" fontSize={fs * 0.8} fill={COL.post} style={{ cursor: 'text' }}
            onClick={(e) => open(e, grp.zPosM, (n) => updateTowerGroup(grp.id, { zPosM: Math.max(-g.halfLen - 1, Math.min(g.halfLen + 1, n)) }))}>
            G{i + 1} · z{grp.zPosM >= 0 ? '+' : ''}{grp.zPosM.toFixed(2)}
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
        fill={COL.frame} style={{ cursor: 'ew-resize' }} onPointerDown={(e) => startDrag(e, { kind: 'bed' })} />
      <text x={(sx(g.halfLen) + sx(-g.halfLen)) / 2} y={sy(g.realFloor) + 0.30}
        textAnchor="middle" fontSize={fs} fill={COL.dim} style={{ cursor: 'text' }}
        onClick={(e) => open(e, trailer.bedLengthM, (n) => updateTrailer({ bedLengthM: Math.max(2, Math.min(20, n)) }))}>
        bed {trailer.bedLengthM.toFixed(2)} m
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
  | { kind: 'track' };

function EndView({ trailer }: { trailer: Trailer }) {
  const { updateTrailer, updateTier, updateAxle } = useStore();
  const svgRef = useRef<SVGSVGElement>(null);
  const [drag, setDrag] = useState<EndDrag | null>(null);
  const { ref, open, overlay } = useInlineEdit();

  const g = trailerGeom(trailer);
  const maxRail  = Math.max(trailer.trailerWidthM, ...trailer.tiers.map(t => t.railWidthM));
  const maxTrack = Math.max(...trailer.axles.map(a => a.trackWidthM));
  const halfSpan = Math.max(maxRail, maxTrack) / 2;
  const pad = 0.55;

  const ex = (x: number) => (halfSpan + pad) + x;       // x=0 at centre
  const yTop = g.topY + pad;
  const ey = (y: number) => yTop - y;

  const vbW = 2 * (halfSpan + pad);
  const vbH = yTop - (g.realFloor - pad * 0.6);
  const stroke = 0.03;
  const fs = 0.20;
  const HANDLE = 0.13;

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
    } else if (drag.kind === 'track') {
      const tw = Math.max(0.6, Math.min(4, Math.abs(mx) * 2));
      trailer.axles.forEach(a => updateAxle(a.id, { trackWidthM: tw }));
    } else if (drag.kind === 'tierW') {
      updateTier(trailer.tiers[drag.i].id, { railWidthM: Math.max(0.3, Math.min(4, Math.abs(mx) * 2)) });
    } else if (drag.kind === 'tierH') {
      // Drag tier i vertically → adjust its band height (distance to the tier below).
      const belowY = g.tYs[drag.i + 1] ?? 0;   // bottom tier measures from the deck datum (0)
      updateTier(trailer.tiers[drag.i].id, { heightM: Math.max(0.15, Math.min(1.5, my - belowY)) });
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

      {/* chassis beams */}
      {[-g.chHW, g.chHW].map((bx, i) => (
        <rect key={i} x={ex(bx) - trailer.beamWidthM / 2} y={ey(DECK_Y)} width={trailer.beamWidthM} height={0.14} fill={COL.beam} />
      ))}

      {/* trailer width handles (at deck level, ± width/2) */}
      {[-1, 1].map(s => (
        <rect key={s} x={ex(s * trailer.trailerWidthM / 2) - HANDLE / 2} y={ey(DECK_Y) - HANDLE / 2}
          width={HANDLE} height={HANDLE} rx={0.03} fill={COL.frame}
          style={{ cursor: 'ew-resize' }} onPointerDown={(e) => startDrag(e, { kind: 'width' })} />
      ))}
      <text x={ex(0)} y={ey(DECK_Y) - 0.16} textAnchor="middle" fontSize={fs * 0.8} fill={COL.frame} style={{ cursor: 'text' }}
        onClick={(e) => open(e, trailer.trailerWidthM, (n) => updateTrailer({ trailerWidthM: Math.max(0.6, Math.min(4, n)) }))}>
        width {trailer.trailerWidthM.toFixed(2)} m
      </text>

      {/* wheels + track handle */}
      {[-maxTrack / 2, maxTrack / 2].map((wx, i) => (
        <circle key={i} cx={ex(wx)} cy={ey(g.axleCentY)} r={g.maxWheelR} fill={COL.wheel} />
      ))}
      {[-1, 1].map(s => (
        <rect key={s} x={ex(s * maxTrack / 2) - HANDLE / 2} y={ey(g.axleCentY) - HANDLE / 2}
          width={HANDLE} height={HANDLE} rx={0.03} fill="#3b82f6"
          style={{ cursor: 'ew-resize' }} onPointerDown={(e) => startDrag(e, { kind: 'track' })} />
      ))}
      <text x={ex(0)} y={ey(g.axleCentY) + 0.04} textAnchor="middle" fontSize={fs * 0.7} fill="white" style={{ cursor: 'text' }}
        onClick={(e) => open(e, maxTrack, (n) => { const tw = Math.max(0.6, Math.min(4, n)); trailer.axles.forEach(a => updateAxle(a.id, { trackWidthM: tw })); })}>
        track {maxTrack.toFixed(2)} m
      </text>

      {/* tier rails — draggable vertically (height) with end handle (width) */}
      {g.tYs.map((y, t) => {
        const hw = trailer.tiers[t].railWidthM / 2;
        return (
          <g key={t}>
            {/* fat invisible hit-line for vertical drag */}
            <line x1={ex(-hw)} y1={ey(y)} x2={ex(hw)} y2={ey(y)} stroke="transparent" strokeWidth={0.16}
              style={{ cursor: 'ns-resize' }} onPointerDown={(e) => startDrag(e, { kind: 'tierH', i: t })} />
            <line x1={ex(-hw)} y1={ey(y)} x2={ex(hw)} y2={ey(y)} stroke={COL.tier} strokeWidth={stroke} />
            {/* width handle at right end */}
            <rect x={ex(hw) - HANDLE / 2} y={ey(y) - HANDLE / 2} width={HANDLE} height={HANDLE} rx={0.03}
              fill={COL.tier} style={{ cursor: 'ew-resize' }} onPointerDown={(e) => startDrag(e, { kind: 'tierW', i: t })} />
            <text x={ex(-hw) - 0.12} y={ey(y) - 0.05} textAnchor="end" fontSize={fs * 0.7} fill={COL.label} style={{ cursor: 'text' }}
              onClick={(e) => open(e, trailer.tiers[t].heightM, (n) => updateTier(trailer.tiers[t].id, { heightM: Math.max(0.15, Math.min(1.5, n)) }))}>
              {(TIER_NAMES[t] ?? `T${t + 1}`)}: h{trailer.tiers[t].heightM.toFixed(2)}
            </text>
            <text x={ex(-hw) - 0.12} y={ey(y) + 0.18} textAnchor="end" fontSize={fs * 0.7} fill={COL.label} style={{ cursor: 'text' }}
              onClick={(e) => open(e, trailer.tiers[t].railWidthM, (n) => updateTier(trailer.tiers[t].id, { railWidthM: Math.max(0.3, Math.min(4, n)) }))}>
              w{trailer.tiers[t].railWidthM.toFixed(2)}
            </text>
          </g>
        );
      })}

      {/* tower posts (vertical at each unique X) */}
      {postXs.map((px, i) => (
        <line key={i} x1={ex(px)} y1={ey(DECK_Y)} x2={ex(px)} y2={ey(g.topY)} stroke={COL.post} strokeWidth={postW} />
      ))}
    </svg>
    {overlay}
    </div>
  );
}

export default function TrailerEditor() {
  const { trailer, updateTrailer } = useStore();

  return (
    <div style={{ padding: 16, overflowY: 'auto', flex: 1 }}>
      <div style={{ ...card, background: '#eff6ff', border: '1px solid #bfdbfe', fontSize: 13, color: '#1d4ed8' }}>
        Visual trailer editor — drag the handles in either view to reshape the trailer; changes
        show live here and in the 3D view. <strong>Side profile:</strong> tongue length, bed length
        (rear edge), tower-group spacing (drag a post), and axle positions (drag a wheel).
        <strong> End cross-section:</strong> trailer width, each tier's height &amp; rail width, and
        wheel track. <strong>Or click any value</strong> to type an exact number. Tower posts and
        add/remove controls are coming next.
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
          {([
            ['Name', 'name', 'text'],
            ['Bed length (m)', 'bedLengthM', 'number'],
            ['Width (m)', 'trailerWidthM', 'number'],
            ['Tongue (m)', 'tongueLengthM', 'number'],
          ] as const).map(([label, key, type]) => (
            <label key={key} style={{ flex: '1 1 140px', fontSize: 12, fontWeight: 600, color: '#475569' }}>
              {label}
              <input
                type={type}
                step={type === 'number' ? '0.01' : undefined}
                value={trailer[key] as string | number}
                onChange={(e) => updateTrailer({ [key]: type === 'number' ? Number(e.target.value) : e.target.value } as Partial<Trailer>)}
                style={{
                  width: '100%', marginTop: 4, padding: '8px 10px', border: '1px solid #cbd5e1',
                  borderRadius: 8, fontSize: 14, boxSizing: 'border-box',
                }}
              />
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
