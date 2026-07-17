import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store';
import { boatShapeOf, STATIONS, maxBeamOf, sampleProfile } from '../boatShape';
import type { BoatShape } from '../types';

const M_TO_IN = 39.3701;
const inch = (m: number) => `${(m * M_TO_IN).toFixed(1)}"`;

// Maps SVG viewBox coordinates to CSS pixels inside a wrapper div so HTML
// inputs can sit on the drawing (same approach as the trailer editor).
function useFit(vbW: number, vbH: number) {
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

// Small always-editable value box centred on a drawing point. Shows/edits
// inches; commits metres on blur/Enter.
function NumIn({ at, valueM, commit }: {
  at: { left: number; top: number } | null;
  valueM: number; commit: (m: number) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  if (!at) return null;
  function done() {
    if (draft !== null) {
      const n = parseFloat(draft);
      if (!isNaN(n)) commit(n / M_TO_IN);
    }
    setDraft(null);
  }
  return (
    <input
      type="text" inputMode="decimal"
      value={draft ?? (valueM * M_TO_IN).toFixed(1)}
      onChange={(e) => setDraft(e.target.value)}
      onFocus={(e) => { setDraft((valueM * M_TO_IN).toFixed(1)); e.target.select(); }}
      onBlur={done}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
        if (e.key === 'Escape') setDraft(null);
      }}
      onPointerDown={(e) => e.stopPropagation()}
      style={{
        position: 'absolute', left: at.left, top: at.top,
        transform: 'translate(-50%, -50%)',
        width: 46, height: 17, boxSizing: 'border-box',
        fontSize: 10, textAlign: 'center', color: '#334155',
        border: '1px solid #cbd5e1', borderRadius: 3,
        background: 'rgba(255,255,255,0.95)', padding: 0, outline: 'none',
      }}
    />
  );
}

// Fixed display scales (metres → viewBox units). Fixed so dragging never
// rescales the drawing out from under the cursor.
const PLAN_VBW = 12, PLAN_VBH = 5;
const PLAN_KW = (PLAN_VBH * 0.42) / 0.6;      // 0.6 m half-beam ≈ 42% height
const SIDE_VBW = 12, SIDE_VBH = 4;
const SIDE_KD = 4.6;                           // metres → units for depth/rocker
const SIDE_BASE = SIDE_VBH - 0.5;              // keel baseline (deepest)

const px = (f: number, vbw: number) => 1 + f * (vbw - 2);

type Drag = { curve: 'beam' | 'depth' | 'rocker'; i: number } | null;

export default function BoatShapeEditor({ boatId, onClose }: { boatId: string; onClose: () => void }) {
  const { boats, updateBoat } = useStore();
  const boat = boats.find(b => b.id === boatId);
  const planRef = useRef<SVGSVGElement>(null);
  const sideRef = useRef<SVGSVGElement>(null);
  const [drag, setDrag] = useState<Drag>(null);
  const planFit = useFit(PLAN_VBW, PLAN_VBH);
  const sideFit = useFit(SIDE_VBW, SIDE_VBH);

  if (!boat) return null;
  const shape = boatShapeOf(boat);

  function commit(patch: Partial<BoatShape>) {
    const next = { ...shape, ...patch };
    updateBoat(boat!.id, { shape: next, widthM: +maxBeamOf(next).toFixed(4) });
  }
  function setField<K extends keyof BoatShape>(key: K, val: BoatShape[K]) {
    commit({ [key]: val } as Partial<BoatShape>);
  }

  // Pointer → viewBox coords for a given svg.
  function toVB(svg: SVGSVGElement, clientX: number, clientY: number) {
    const p = svg.createSVGPoint(); p.x = clientX; p.y = clientY;
    return p.matrixTransform(svg.getScreenCTM()!.inverse());
  }

  function onPlanMove(e: React.PointerEvent<SVGSVGElement>) {
    if (!drag || drag.curve !== 'beam') return;
    const v = toVB(planRef.current!, e.clientX, e.clientY);
    const hw = Math.max(0.01, Math.min(0.6, (PLAN_VBH / 2 - v.y) / PLAN_KW));
    const beam = [...shape.beam]; beam[drag.i] = +hw.toFixed(4);
    commit({ beam });
  }
  function onSideMove(e: React.PointerEvent<SVGSVGElement>) {
    if (!drag || (drag.curve !== 'depth' && drag.curve !== 'rocker')) return;
    const v = toVB(sideRef.current!, e.clientX, e.clientY);
    if (drag.curve === 'rocker') {
      const r = Math.max(0, Math.min(0.2, (SIDE_BASE - v.y) / SIDE_KD));
      const rocker = [...shape.rocker]; rocker[drag.i] = +r.toFixed(4);
      commit({ rocker });
    } else {
      const keelY = SIDE_BASE - shape.rocker[drag.i] * SIDE_KD;
      const d = Math.max(0.03, Math.min(0.5, (keelY - v.y) / SIDE_KD));
      const depth = [...shape.depth]; depth[drag.i] = +d.toFixed(4);
      commit({ depth });
    }
  }
  const endDrag = () => setDrag(null);
  function start(e: React.PointerEvent, d: Drag, svg: SVGSVGElement | null) {
    e.stopPropagation();
    try { svg?.setPointerCapture(e.pointerId); } catch { /* non-active pointer */ }
    setDrag(d);
  }

  const HANDLE = 0.14;
  const num: React.CSSProperties = {
    width: '100%', marginTop: 4, padding: '7px 9px', border: '1px solid #cbd5e1',
    borderRadius: 8, fontSize: 14, boxSizing: 'border-box',
  };
  const lbl: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: '#475569' };

  // ── Smoothly-sampled outlines (match the model's cosine interpolation) ──
  const SAMP = 48;
  const planTop: string[] = [], planBot: string[] = [];
  const keelLine: string[] = [], sheerLine: string[] = [];
  for (let k = 0; k <= SAMP; k++) {
    const f = k / SAMP;
    const hw = sampleProfile(shape.beam, f), xP = px(f, PLAN_VBW);
    planTop.push(`${xP},${PLAN_VBH / 2 - hw * PLAN_KW}`);
    planBot.push(`${xP},${PLAN_VBH / 2 + hw * PLAN_KW}`);
    const xS = px(f, SIDE_VBW);
    const ky = SIDE_BASE - sampleProfile(shape.rocker, f) * SIDE_KD;
    keelLine.push(`${xS},${ky}`);
    sheerLine.push(`${xS},${ky - sampleProfile(shape.depth, f) * SIDE_KD}`);
  }
  const planPath = `M ${planTop.join(' L ')} L ${planBot.reverse().join(' L ')} Z`;
  const sidePath = `M ${sheerLine.join(' L ')} L ${[...keelLine].reverse().join(' L ')} Z`;
  // Control-point positions (handles sit on the curve at each station)
  const keelPts = STATIONS.map((f, i) => ({ x: px(f, SIDE_VBW), y: SIDE_BASE - shape.rocker[i] * SIDE_KD }));
  const sheerPts = STATIONS.map((f, i) => ({ x: px(f, SIDE_VBW), y: keelPts[i].y - shape.depth[i] * SIDE_KD }));

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'white', borderRadius: 14, width: 'min(760px, 96vw)', maxHeight: '92vh',
        overflowY: 'auto', boxShadow: '0 10px 40px rgba(0,0,0,0.25)', padding: 18,
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#1e293b' }}>Hull shape · {boat.name}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, color: '#64748b', cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 12 }}>
          {boat.boatClass} · max beam {inch(maxBeamOf(shape))} · LOA {inch(boat.lengthM)}
        </div>

        {/* Plan view (top-down): beam taper */}
        <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>
          Plan · beam taper (bow → stern)
        </div>
        <div ref={planFit.wrapRef} style={{ position: 'relative', marginBottom: 14 }}>
        <svg ref={planRef} viewBox={`0 0 ${PLAN_VBW} ${PLAN_VBH}`}
          style={{ width: '100%', height: 190, display: 'block', touchAction: 'none', background: '#f8fafc', borderRadius: 8 }}
          onPointerMove={onPlanMove} onPointerUp={endDrag} onPointerLeave={endDrag}>
          <line x1={px(0, PLAN_VBW)} y1={PLAN_VBH / 2} x2={px(1, PLAN_VBW)} y2={PLAN_VBH / 2} stroke="#e2e8f0" strokeWidth={0.02} strokeDasharray="0.15 0.1" />
          <path d={planPath} fill="#dbeafe" stroke="#1d4ed8" strokeWidth={0.03} />
          {STATIONS.map((f, i) => {
            const x = px(f, PLAN_VBW), y = PLAN_VBH / 2 - shape.beam[i] * PLAN_KW;
            return (
              <rect key={i} x={x - HANDLE / 2} y={y - HANDLE / 2} width={HANDLE} height={HANDLE} rx={0.03}
                fill="#1d4ed8" style={{ cursor: 'ns-resize' }} onPointerDown={(e) => start(e, { curve: 'beam', i }, planRef.current)} />
            );
          })}
          <text x={px(0, PLAN_VBW)} y={PLAN_VBH - 0.12} textAnchor="middle" fontSize={0.22} fill="#94a3b8">bow</text>
          <text x={px(1, PLAN_VBW)} y={PLAN_VBH - 0.12} textAnchor="middle" fontSize={0.22} fill="#94a3b8">stern</text>
        </svg>
        {/* Editable width value at each station (full width, inches) */}
        {STATIONS.map((f, i) => (
          <NumIn key={i}
            at={planFit.toPx(px(f, PLAN_VBW), PLAN_VBH / 2 - shape.beam[i] * PLAN_KW - 0.32)}
            valueM={shape.beam[i] * 2}
            commit={(m) => {
              const beam = [...shape.beam];
              beam[i] = +Math.max(0.01, Math.min(0.6, m / 2)).toFixed(4);
              commit({ beam });
            }} />
        ))}
        </div>

        {/* Side view: depth + rocker */}
        <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>
          Side · depth (blue) &amp; keel rocker (teal)
        </div>
        <div ref={sideFit.wrapRef} style={{ position: 'relative', marginBottom: 14 }}>
        <svg ref={sideRef} viewBox={`0 0 ${SIDE_VBW} ${SIDE_VBH}`}
          style={{ width: '100%', height: 170, display: 'block', touchAction: 'none', background: '#f8fafc', borderRadius: 8 }}
          onPointerMove={onSideMove} onPointerUp={endDrag} onPointerLeave={endDrag}>
          <path d={sidePath} fill="#eef2ff" stroke="#94a3b8" strokeWidth={0.02} />
          {/* keel / rocker line */}
          <polyline points={keelLine.join(' ')} fill="none" stroke="#0f766e" strokeWidth={0.03} />
          {/* sheer / depth line */}
          <polyline points={sheerLine.join(' ')} fill="none" stroke="#1d4ed8" strokeWidth={0.03} />
          {STATIONS.map((_f, i) => (
            <g key={i}>
              <rect x={keelPts[i].x - HANDLE / 2} y={keelPts[i].y - HANDLE / 2} width={HANDLE} height={HANDLE} rx={0.03}
                fill="#0f766e" style={{ cursor: 'ns-resize' }} onPointerDown={(e) => start(e, { curve: 'rocker', i }, sideRef.current)} />
              <rect x={sheerPts[i].x - HANDLE / 2} y={sheerPts[i].y - HANDLE / 2} width={HANDLE} height={HANDLE} rx={0.03}
                fill="#1d4ed8" style={{ cursor: 'ns-resize' }} onPointerDown={(e) => start(e, { curve: 'depth', i }, sideRef.current)} />
            </g>
          ))}
        </svg>
        {/* Editable depth values above the sheer line, rocker values below the keel */}
        {STATIONS.map((_f, i) => (
          <NumIn key={`d${i}`}
            at={sideFit.toPx(sheerPts[i].x, sheerPts[i].y - 0.30)}
            valueM={shape.depth[i]}
            commit={(m) => {
              const depth = [...shape.depth];
              depth[i] = +Math.max(0.03, Math.min(0.5, m)).toFixed(4);
              commit({ depth });
            }} />
        ))}
        {STATIONS.map((_f, i) => (
          <NumIn key={`r${i}`}
            at={sideFit.toPx(keelPts[i].x, keelPts[i].y + 0.30)}
            valueM={shape.rocker[i]}
            commit={(m) => {
              const rocker = [...shape.rocker];
              rocker[i] = +Math.max(0, Math.min(0.2, m)).toFixed(4);
              commit({ rocker });
            }} />
        ))}
        </div>

        {/* Non-geometry fields */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <label style={{ flex: '1 1 130px', ...lbl }}>
            LOA (in)
            <input type="number" step="0.5" style={num}
              value={(boat.lengthM * M_TO_IN).toFixed(1)}
              onChange={(e) => updateBoat(boat.id, { lengthM: Number(e.target.value) / M_TO_IN })} />
          </label>
          <label style={{ flex: '1 1 130px', ...lbl }}>
            Rigging width (in)
            <input type="number" step="0.5" style={num}
              value={(shape.riggingWidthM * M_TO_IN).toFixed(1)}
              onChange={(e) => setField('riggingWidthM', Number(e.target.value) / M_TO_IN)} />
          </label>
          <label style={{ flex: '1 1 130px', ...lbl }}>
            Type
            <select style={num} value={shape.boatType} onChange={(e) => setField('boatType', e.target.value as BoatShape['boatType'])}>
              <option value="sweep">sweep</option>
              <option value="scull">scull</option>
            </select>
          </label>
          <label style={{ flex: '1 1 130px', ...lbl }}>
            Load (kg)
            <input type="number" step="1" style={num}
              value={shape.loadKg}
              onChange={(e) => setField('loadKg', Number(e.target.value))} />
          </label>
        </div>
        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 10 }}>
          Rigging width and load are stored for reference — boats travel de-rigged, so only the hull
          profile affects trailer packing. Waterline/draft/freeboard are on-water outputs and aren't tracked.
        </div>
      </div>
    </div>
  );
}
