import { useState, useRef } from 'react';
import { useStore } from '../store';
import { computeTowerZs, computeTowerXZs, snapZ, isValidZ, footprintsOverlap, boatClearsTowers } from '../utils';
import { SHELL_DB } from '../shellDatabase';
import { useIsMobile } from '../useIsMobile';

const TIER_NAMES = ['Top', 'Upper-Mid', 'Lower-Mid', 'Bottom', 'Fifth', 'Sixth'];
const BOAT_COLORS = [
  '#2563eb', '#dc2626', '#16a34a', '#d97706', '#7c3aed',
  '#db2777', '#0891b2', '#65a30d', '#ea580c', '#4f46e5',
];

const CLASS_ORDER = ['8+', '4+', '4-', '4x', '2-', '2x', '1x'];

const MIN_OVERHANG = 1.5;
const COL_GAP  = 0.5;
const SVG_PAD  = 0.35;
const HDR_H    = 0.45;

function colX(tier: number, trayW: number) {
  return SVG_PAD + tier * (trayW + COL_GAP);
}

function boatOutlinePath(w: number, l: number): string {
  const hw = w / 2;
  const hl = l / 2;
  const bt = hl * 0.13;
  const st = hl * 0.17;
  return (
    `M 0,${-hl} ` +
    `C ${hw * 0.10},${-hl + bt} ${hw},${-hl + bt * 4} ${hw},0 ` +
    `C ${hw},${hl - st * 3} ${hw * 0.14},${hl - st} 0,${hl} ` +
    `C ${-hw * 0.14},${hl - st} ${-hw},${hl - st * 3} ${-hw},0 ` +
    `C ${-hw},${-hl + bt * 4} ${-hw * 0.10},${-hl + bt} 0,${-hl} Z`
  );
}

function zToSvgY(zM: number, halfLen: number, overhang: number) {
  return HDR_H + overhang + halfLen - zM;
}

function svgYToZ(svgY: number, halfLen: number, overhang: number) {
  return HDR_H + overhang + halfLen - svgY;
}

function svgPtToScene(
  svgEl: SVGSVGElement, clientX: number, clientY: number,
  trayW: number, halfLen: number, halfW: number, tier: number, overhang: number,
): { xM: number; zM: number } {
  const pt = svgEl.createSVGPoint();
  pt.x = clientX; pt.y = clientY;
  const p = pt.matrixTransform(svgEl.getScreenCTM()!.inverse());
  const cx = colX(tier, trayW);
  return {
    xM: halfW - (p.x - cx),
    zM: svgYToZ(p.y, halfLen, overhang),
  };
}

function tierFromSvgX(
  svgEl: SVGSVGElement, clientX: number,
  trayW: number, totalTiers: number,
): number {
  const pt = svgEl.createSVGPoint();
  pt.x = clientX; pt.y = 0;
  const p = pt.matrixTransform(svgEl.getScreenCTM()!.inverse());
  const t = Math.floor((p.x - SVG_PAD) / (trayW + COL_GAP));
  return Math.max(0, Math.min(totalTiers - 1, t));
}

interface DragState {
  placementId: string;
  boatId: string;
  tier: number;
  slung: boolean;
  offsetX: number;
  offsetZ: number;
  previewX: number;
  previewZ: number;
  valid: boolean;
}

// End-on hull silhouette: flat gunwale across the top, sides curving in to a
// rounded keel at the bottom centre. Centred at origin, spanning w × h.
function hullEndPath(w: number, h: number): string {
  const hw = w / 2;
  const top = -h / 2;
  const bot = h / 2;
  return (
    `M ${-hw},${top} ` +
    `L ${hw},${top} ` +
    `C ${hw},${top + h * 0.55} ${hw * 0.34},${bot} 0,${bot} ` +
    `C ${-hw * 0.34},${bot} ${-hw},${top + h * 0.55} ${-hw},${top} Z`
  );
}

// ─── End view (cross-section looking down the trailer length) ───────────────
const EV_PAD     = 0.12;
const EV_HDR     = 0.24;
const EV_TOP_H   = 0.38;  // top of rail — boats sit here
const EV_RAIL_T  = 0.05;  // thin rail bar between top and underside
const EV_UNDER_H = 0.28;  // underside of rail — slung boats hang here
const EV_UNIT    = EV_TOP_H + EV_RAIL_T + EV_UNDER_H; // total height per tier

function EndView({ label, placements, boatById, boatColorIdx, tiers, trayW }: {
  label: string;
  placements: Array<{ id: string; boatId: string; tier: number; xM: number; slung?: boolean }>;
  boatById: Record<string, { boatClass: string; widthM: number }>;
  boatColorIdx: Record<string, number>;
  tiers: number;
  trayW: number;
}) {
  const svgW = EV_PAD * 2 + trayW;
  const svgH = EV_HDR + tiers * EV_UNIT + EV_PAD;
  // y-origin of each tier's top section
  const topY   = (t: number) => EV_HDR + t * EV_UNIT;
  // y-origin of each tier's underside (slung) section
  const underY = (t: number) => topY(t) + EV_TOP_H + EV_RAIL_T;
  // xM → SVG x (centre of boat); xM=0 = centre, +halfW = left, -halfW = right
  const bx = (xM: number) => EV_PAD + trayW / 2 - xM;

  const BOAT_H  = EV_TOP_H   * 0.72;
  const SLUNG_H = EV_UNDER_H * 0.70;

  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} style={{ maxWidth: '100%', maxHeight: '100%', width: '100%', height: 'auto', display: 'block' }}>
      {/* per-tier bands */}
      {Array.from({ length: tiers }, (_, t) => (
        <g key={t}>
          {/* top surface */}
          <rect x={EV_PAD} y={topY(t)} width={trayW} height={EV_TOP_H}
            fill={t % 2 === 0 ? '#e8edf3' : '#dde3ea'} />
          <text x={EV_PAD + 0.05} y={topY(t) + EV_TOP_H / 2}
            dominantBaseline="middle" fontSize={0.09} fill="#94a3b8">
            {TIER_NAMES[t] ?? `T${t + 1}`}
          </text>

          {/* rail bar */}
          <rect x={EV_PAD} y={topY(t) + EV_TOP_H} width={trayW} height={EV_RAIL_T}
            fill="#64748b" />

          {/* underside / slung zone */}
          <rect x={EV_PAD} y={underY(t)} width={trayW} height={EV_UNDER_H}
            fill={t % 2 === 0 ? '#f1f5f9' : '#e8eef4'}
            stroke="#cbd5e1" strokeWidth={0.012} strokeDasharray="0.06 0.04" />
          <text x={EV_PAD + 0.05} y={underY(t) + EV_UNDER_H / 2}
            dominantBaseline="middle" fontSize={0.08} fill="#b0bec5">↓</text>
        </g>
      ))}

      {/* normal boats — end-on hull silhouette sitting upright on the rail */}
      {placements.filter(p => !p.slung).map(p => {
        const boat = boatById[p.boatId];
        if (!boat) return null;
        const color = BOAT_COLORS[boatColorIdx[p.boatId] % BOAT_COLORS.length];
        const cx = bx(p.xM);
        const cy = topY(p.tier) + EV_TOP_H / 2;
        return (
          <g key={p.id}>
            <path d={hullEndPath(boat.widthM, BOAT_H)}
              transform={`translate(${cx},${cy}) scale(1,-1)`}
              fill={color} fillOpacity={0.84}
              stroke="rgba(255,255,255,0.7)" strokeWidth={0.014} />
            <text x={cx} y={cy + BOAT_H * 0.08}
              textAnchor="middle" dominantBaseline="middle"
              fontSize={0.09} fill="white" fontWeight={700}
              style={{ pointerEvents: 'none', userSelect: 'none' }}>
              {boat.boatClass}
            </text>
          </g>
        );
      })}

      {/* slung boats — inverted hull silhouette hanging under the rail */}
      {placements.filter(p => !!p.slung).map(p => {
        const boat = boatById[p.boatId];
        if (!boat) return null;
        const color = BOAT_COLORS[boatColorIdx[p.boatId] % BOAT_COLORS.length];
        const cx = bx(p.xM);
        const cy = underY(p.tier) + EV_UNDER_H / 2;
        return (
          <g key={p.id}>
            <path d={hullEndPath(boat.widthM, SLUNG_H)}
              transform={`translate(${cx},${cy})`}
              fill={color} fillOpacity={0.65}
              stroke="rgba(255,255,255,0.7)" strokeWidth={0.014} />
            <text x={cx} y={cy - SLUNG_H * 0.08}
              textAnchor="middle" dominantBaseline="middle"
              fontSize={0.09} fill="white" fontWeight={700}
              style={{ pointerEvents: 'none', userSelect: 'none' }}>
              {boat.boatClass}
            </text>
          </g>
        );
      })}

      {/* outer frame */}
      <rect x={EV_PAD} y={topY(0)} width={trayW} height={tiers * EV_UNIT}
        fill="none" stroke="#475569" strokeWidth={0.025} />

      {/* label */}
      <text x={svgW / 2} y={EV_HDR / 2}
        textAnchor="middle" dominantBaseline="middle"
        fontSize={0.13} fontWeight={700} fill="#334155">
        {label}
      </text>
    </svg>
  );
}

const btnPrimary: React.CSSProperties = {
  flex: 1, padding: '8px 12px', background: '#1d4ed8', color: 'white',
  border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer',
};
const btnSecondary: React.CSSProperties = {
  padding: '8px 12px', background: 'white', color: '#1d4ed8',
  border: '1px solid #93c5fd', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer',
};
const mobileTab: React.CSSProperties = {
  flex: 1, padding: '10px 12px', background: 'white', color: '#334155',
  border: '1px solid #cbd5e1', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer',
};
const mobileTabActive: React.CSSProperties = {
  ...mobileTab, background: '#dbeafe', color: '#1d4ed8', borderColor: '#1d4ed8',
};

export default function Layout() {
  const {
    trailer, boats, placements,
    addPlacement, movePlacement, setSlung, removePlacement, clearPlacements, clearAll,
    autoLayout, addBoat,
  } = useStore();

  const towerZs  = computeTowerZs(trailer);
  const towerXZs = computeTowerXZs(trailer);
  const halfLen = trailer.bedLengthM / 2;
  const halfW   = trailer.trailerWidthM / 2;
  const bedLen  = trailer.bedLengthM;
  const trayW   = trailer.trailerWidthM;
  const tierCount = trailer.tiers.length;
  // Bow of boats on the lowest 2 tiers cannot extend past half the tongue length
  const bowFrontLimit = halfLen + trailer.tongueLengthM / 2;

  const boatById      = Object.fromEntries(boats.map(b => [b.id, b]));
  const boatColorIdx  = Object.fromEntries(boats.map((b, i) => [b.id, i]));
  const placedIds     = new Set(placements.map(p => p.boatId));
  const unplacedBoats = boats.filter(b => !placedIds.has(b.id));

  const [pendingBoatId, setPendingBoatId] = useState<string | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const isMobile = useIsMobile();
  const [mobilePanel, setMobilePanel] = useState<'end' | 'boathouse' | null>(null);

  function printLayout() {
    const svg = svgRef.current;
    if (!svg) return;
    const svgHtml = svg.outerHTML;

    const tierSummaries = Array.from({ length: tierCount }, (_, t) => {
      const tierPlacements = placements.filter(p => p.tier === t);
      const counts = tierPlacements.reduce<Record<string, number>>((acc, p) => {
        const cls = boatById[p.boatId]?.boatClass ?? '?';
        acc[cls] = (acc[cls] ?? 0) + 1;
        return acc;
      }, {});
      const summary = Object.entries(counts).map(([cls, n]) => `${n}× ${cls}`).join(', ') || 'Empty';
      return `<tr><td style="font-weight:600;padding:3px 10px 3px 0">${TIER_NAMES[t] ?? `Tier ${t+1}`}</td><td style="color:#475569">${summary}</td></tr>`;
    }).join('');

    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head>
      <title>${trailer.name} — Layout</title>
      <style>
        body { font-family: system-ui, sans-serif; margin: 24px; color: #1e293b; }
        h1 { font-size: 20px; margin: 0 0 4px; }
        .meta { font-size: 12px; color: #64748b; margin-bottom: 12px; }
        table { border-collapse: collapse; margin-bottom: 16px; font-size: 13px; }
        svg { width: 100%; height: auto; display: block; }
        @media print { body { margin: 8px; } }
      </style>
    </head><body>
      <h1>${trailer.name}</h1>
      <div class="meta">${(trailer.bedLengthM * 39.3701).toFixed(1)}" bed · ${tierCount} tiers · ${placements.length} boats placed · Printed ${new Date().toLocaleDateString()}</div>
      <table>${tierSummaries}</table>
      ${svgHtml}
      <script>window.onload = () => { window.print(); }<\/script>
    </body></html>`);
    win.document.close();
  }

  const maxBoatLen = boats.reduce((m, b) => Math.max(m, b.lengthM), 0);
  const overhang = Math.max(MIN_OVERHANG, (maxBoatLen - bedLen) / 2 + 0.5);

  const svgH = HDR_H + overhang + bedLen + overhang;
  const svgW = SVG_PAD + tierCount * trayW + (tierCount - 1) * COL_GAP + SVG_PAD;

  function isOk(tier: number, boatId: string, xM: number, zM: number, isSlung: boolean, excludeId?: string) {
    const boat = boatById[boatId];
    if (!boat) return false;
    if (!isValidZ(zM, boat.lengthM, towerZs)) return false;
    if (tier >= tierCount - 2 && zM + boat.lengthM / 2 > bowFrontLimit) return false;
    if (tier > 0 && !boatClearsTowers(xM, zM, boat.widthM, boat.lengthM, towerXZs)) return false;
    return !placements.some(p => {
      if (p.tier !== tier || p.id === excludeId) return false;
      if (!!p.slung !== isSlung) return false;
      const pb = boatById[p.boatId];
      if (!pb) return false;
      const px = drag?.placementId === p.id ? drag.previewX : p.xM;
      const pz = drag?.placementId === p.id ? drag.previewZ : p.zCenterM;
      return footprintsOverlap(xM, zM, boat.widthM, boat.lengthM, px, pz, pb.widthM, pb.lengthM);
    });
  }

  function handlePointerDown(e: React.PointerEvent<SVGSVGElement>) {
    const svgEl = e.currentTarget;
    const pid   = (e.target as SVGElement).closest<SVGElement>('[data-pid]')?.dataset.pid;

    if (pid) {
      const p = placements.find(pl => pl.id === pid);
      if (!p) return;
      const { xM: ptrX, zM: ptrZ } = svgPtToScene(svgEl, e.clientX, e.clientY, trayW, halfLen, halfW, p.tier, overhang);
      setDrag({
        placementId: pid, boatId: p.boatId, tier: p.tier, slung: !!p.slung,
        offsetX: ptrX - p.xM, offsetZ: ptrZ - p.zCenterM,
        previewX: p.xM, previewZ: p.zCenterM, valid: true,
      });
      svgEl.setPointerCapture(e.pointerId);
      e.stopPropagation();
      return;
    }

    if (pendingBoatId) {
      const tier  = tierFromSvgX(svgEl, e.clientX, trayW, tierCount);
      const boat  = boatById[pendingBoatId];
      if (!boat) return;
      const { xM, zM } = svgPtToScene(svgEl, e.clientX, e.clientY, trayW, halfLen, halfW, tier, overhang);
      const snZ   = snapZ(zM, boat.lengthM, towerZs, halfLen);
      const clX   = Math.max(-halfW + boat.widthM / 2, Math.min(halfW - boat.widthM / 2, xM));
      addPlacement({ boatId: pendingBoatId, tier, xM: clX, zCenterM: snZ });
      setPendingBoatId(null);
    }
  }

  function handlePointerMove(e: React.PointerEvent<SVGSVGElement>) {
    if (!drag) return;
    const boat = boatById[drag.boatId];
    if (!boat) return;
    const svgEl = e.currentTarget;
    const newTier = tierFromSvgX(svgEl, e.clientX, trayW, tierCount);
    const { xM: ptrX, zM: ptrZ } = svgPtToScene(svgEl, e.clientX, e.clientY, trayW, halfLen, halfW, newTier, overhang);
    const rawZ = ptrZ - drag.offsetZ;
    const rawX = ptrX - drag.offsetX;
    const snZ  = snapZ(rawZ, boat.lengthM, towerZs, halfLen);
    const clX  = Math.max(-halfW + boat.widthM / 2, Math.min(halfW - boat.widthM / 2, rawX));
    const valid = isOk(newTier, drag.boatId, clX, snZ, drag.slung, drag.placementId);
    setDrag(d => d ? { ...d, tier: newTier, previewX: clX, previewZ: snZ, valid } : null);
  }

  function handlePointerUp() {
    if (!drag) return;
    if (drag.valid) movePlacement(drag.placementId, { tier: drag.tier, xM: drag.previewX, zCenterM: drag.previewZ });
    setDrag(null);
  }

  function addRandom() {
    const usable = SHELL_DB.filter(s => s.lengthM && s.widthM);
    [...usable].sort(() => Math.random() - 0.5).slice(0, 10).forEach(s =>
      addBoat({
        name: `${s.manufacturer} ${s.modelName}`,
        manufacturer: s.manufacturer,
        boatClass: s.boatClass.split('/')[0],
        lengthM: s.lengthM,
        widthM: s.widthM ?? 0.32,
        weightKg: s.hullWeightKg ?? 50,
      })
    );
  }

  // Group unplaced boats by class
  const classGroups: Record<string, typeof unplacedBoats> = {};
  for (const boat of unplacedBoats) {
    const cls = boat.boatClass ?? 'Other';
    if (!classGroups[cls]) classGroups[cls] = [];
    classGroups[cls].push(boat);
  }
  const classKeys = [
    ...CLASS_ORDER.filter(c => classGroups[c]),
    ...Object.keys(classGroups).filter(c => !CLASS_ORDER.includes(c)),
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      {/* Toolbar */}
      <div style={{ padding: '10px 16px', background: 'white', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
        <button onClick={autoLayout} style={btnPrimary}>✨ Auto-Arrange</button>
        <button onClick={addRandom} style={btnSecondary}>+ 10 Random</button>
        <button onClick={clearPlacements} style={{ ...btnSecondary, color: '#64748b', borderColor: '#cbd5e1' }}>Clear Layout</button>
        <button
          onClick={() => { if (window.confirm('Remove all boats and clear layout?')) clearAll(); }}
          style={{ ...btnSecondary, color: '#b91c1c', borderColor: '#fca5a5' }}
        >Clear All</button>
        <button onClick={printLayout} style={{ ...btnSecondary, color: '#0f766e', borderColor: '#99f6e4' }}>🖨 Print</button>
      </div>

      {pendingBoatId && (
        <div style={{ padding: '6px 16px', background: '#eff6ff', borderBottom: '1px solid #93c5fd', fontSize: 12, color: '#1d4ed8', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          Click a tier column to place <strong style={{ marginLeft: 4 }}>{boatById[pendingBoatId]?.name}</strong>
          <button onClick={() => setPendingBoatId(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#1d4ed8', cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>✕</button>
        </div>
      )}

      {/* Main area: end views + SVG + Boathouse sidebar */}
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', flex: 1, overflow: 'hidden', position: 'relative' }}>

      {/* Backdrop for mobile drawers */}
      {isMobile && mobilePanel && (
        <div onClick={() => setMobilePanel(null)}
          style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 10 }} />
      )}

      {/* End views: desktop = left sidebar; mobile = right slide-in drawer */}
      <div style={isMobile ? {
        position: 'absolute', top: 0, bottom: 0, right: 0, width: '88%', maxWidth: 420,
        background: 'white', display: 'flex', flexDirection: 'column', overflow: 'hidden', zIndex: 11,
        boxShadow: '-4px 0 16px rgba(0,0,0,0.15)',
        transform: mobilePanel === 'end' ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.22s ease',
      } : {
        width: 360, flexShrink: 0, borderRight: '1px solid #e2e8f0', background: 'white',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: '#334155' }}>End views</span>
            <button onClick={() => setMobilePanel(null)} style={{ background: 'none', border: 'none', fontSize: 18, color: '#64748b', cursor: 'pointer' }}>✕</button>
          </div>
        )}
        <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 12px' }}>
          <EndView
            label="Front Half"
            placements={placements.filter(p => p.zCenterM >= 0)}
            boatById={boatById}
            boatColorIdx={boatColorIdx}
            tiers={tierCount}
            trayW={trayW}
          />
        </div>
        <div style={{ height: 1, background: '#e2e8f0', flexShrink: 0 }} />
        <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 12px' }}>
          <EndView
            label="Rear Half"
            placements={placements.filter(p => p.zCenterM < 0)}
            boatById={boatById}
            boatColorIdx={boatColorIdx}
            tiers={tierCount}
            trayW={trayW}
          />
        </div>
      </div>

      {/* SVG */}
      <div style={{ flex: 1, overflowX: 'auto', overflowY: 'hidden', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${svgW} ${svgH}`}
          style={{ display: 'block', height: '100%', width: 'auto', minWidth: '100%', cursor: pendingBoatId ? 'crosshair' : 'default', touchAction: 'none' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          {Array.from({ length: tierCount }, (_, t) => {
            const cx = colX(t, trayW);
            const isDragTarget = drag?.tier === t;
            return (
              <g key={t}>
                <rect x={cx} y={HDR_H} width={trayW} height={overhang} fill="#dde3ea" />
                <rect x={cx} y={HDR_H + overhang} width={trayW} height={bedLen} fill={isDragTarget ? '#e0eaff' : '#e8edf3'} />
                <rect x={cx} y={HDR_H + overhang + bedLen} width={trayW} height={overhang} fill="#dde3ea" />
                <rect x={cx} y={HDR_H} width={trayW} height={overhang * 2 + bedLen}
                  fill="none" stroke={isDragTarget ? '#93c5fd' : '#94a3b8'} strokeWidth={isDragTarget ? 0.06 : 0.03} />
                <line x1={cx} y1={HDR_H + overhang} x2={cx + trayW} y2={HDR_H + overhang}
                  stroke="#475569" strokeWidth={0.05} />
                <line x1={cx} y1={HDR_H + overhang + bedLen} x2={cx + trayW} y2={HDR_H + overhang + bedLen}
                  stroke="#475569" strokeWidth={0.05} />
                <text x={cx + trayW / 2} y={HDR_H * 0.52} textAnchor="middle" dominantBaseline="middle"
                  fontSize={0.24} fontWeight="700" fill="#334155">
                  {TIER_NAMES[t] ?? `Tier ${t + 1}`}
                </text>
                <text x={cx + trayW / 2} y={HDR_H + overhang * 0.3} textAnchor="middle" dominantBaseline="middle"
                  fontSize={0.18} fill="#64748b">▲ Front</text>
                <text x={cx + trayW / 2} y={HDR_H + overhang + bedLen + overhang * 0.7} textAnchor="middle" dominantBaseline="middle"
                  fontSize={0.18} fill="#64748b">Rear ▼</text>
                {towerZs.map((tz, i) => {
                  const lineY = zToSvgY(tz, halfLen, overhang);
                  return (
                    <line key={i}
                      x1={cx} y1={lineY} x2={cx + trayW} y2={lineY}
                      stroke="#64748b" strokeWidth={0.03} strokeDasharray="0.14 0.08"
                    />
                  );
                })}
                {/* Bow limit line on the lowest 2 tiers */}
                {t >= tierCount - 2 && (() => {
                  const limY = zToSvgY(bowFrontLimit, halfLen, overhang);
                  return (
                    <g>
                      <line x1={cx} y1={limY} x2={cx + trayW} y2={limY}
                        stroke="#dc2626" strokeWidth={0.04} strokeDasharray="0.10 0.06" />
                      <text x={cx + trayW / 2} y={limY - 0.10} textAnchor="middle"
                        fontSize={0.13} fill="#dc2626" fontWeight={600}>bow limit</text>
                    </g>
                  );
                })()}
                {placements.filter(p => p.tier === t).map(p => {
                  const boat = boatById[p.boatId];
                  if (!boat) return null;
                  const isDragging = drag?.placementId === p.id;
                  const dispX = isDragging ? drag!.previewX : p.xM;
                  const dispZ = isDragging ? drag!.previewZ : p.zCenterM;
                  const renderTier = isDragging ? drag!.tier : t;
                  if (renderTier !== t) return null;
                  const isSlung = !!p.slung;
                  const canSling = ['1x', '2x', '2-'].includes(boat.boatClass) && p.tier < tierCount - 1;
                  const color = BOAT_COLORS[boatColorIdx[p.boatId] % BOAT_COLORS.length];
                  const invalid = isDragging ? !drag!.valid : !isOk(t, p.boatId, dispX, dispZ, isSlung, p.id);
                  const boatCX = cx + (halfW - dispX);
                  const boatCY = zToSvgY(dispZ, halfLen, overhang);
                  const rmX = boatCX + boat.widthM * 0.38;
                  const rmY = boatCY - boat.lengthM * 0.44;
                  const slX = boatCX - boat.widthM * 0.38;
                  const slY = rmY;
                  const shapeTransform = isSlung
                    ? `translate(${boatCX},${boatCY}) scale(1,-1)`
                    : `translate(${boatCX},${boatCY})`;
                  return (
                    <g key={p.id} data-pid={p.id} style={{ cursor: isDragging ? 'grabbing' : 'grab' }}>
                      <path
                        data-pid={p.id}
                        d={boatOutlinePath(boat.widthM, boat.lengthM)}
                        transform={shapeTransform}
                        fill={invalid ? '#fca5a5' : color}
                        fillOpacity={isDragging ? 0.55 : isSlung ? 0.60 : 0.88}
                        stroke={invalid ? '#dc2626' : isSlung ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.7)'}
                        strokeWidth={0.022}
                        strokeDasharray={isSlung ? '0.12 0.07' : undefined}
                      />
                      <text
                        x={boatCX} y={boatCY}
                        textAnchor="middle" dominantBaseline="middle"
                        fontSize={Math.min(0.20, boat.widthM * 0.65)}
                        fill="white" fontWeight="bold"
                        style={{ pointerEvents: 'none', userSelect: 'none' }}
                      >
                        {boat.boatClass}
                      </text>
                      <circle
                        cx={slX} cy={slY} r={0.08}
                        fill={isSlung ? '#7c3aed' : canSling ? '#64748b' : '#cbd5e1'}
                        style={{ cursor: canSling ? 'pointer' : 'not-allowed' }}
                        onPointerDown={e => e.stopPropagation()}
                        onClick={e => { e.stopPropagation(); if (canSling) setSlung(p.id, !isSlung); }}
                      />
                      <text
                        x={slX} y={slY}
                        textAnchor="middle" dominantBaseline="middle"
                        fontSize={0.10} fill="white"
                        style={{ pointerEvents: 'none', userSelect: 'none' }}
                      >{isSlung ? '⌃' : '⌄'}</text>
                      <circle
                        cx={rmX} cy={rmY} r={0.08}
                        fill="#ef4444" style={{ cursor: 'pointer' }}
                        onPointerDown={e => e.stopPropagation()}
                        onClick={e => { e.stopPropagation(); removePlacement(p.id); }}
                      />
                      <text
                        x={rmX} y={rmY}
                        textAnchor="middle" dominantBaseline="middle"
                        fontSize={0.09} fill="white"
                        style={{ pointerEvents: 'none', userSelect: 'none' }}
                      >×</text>
                    </g>
                  );
                })}
              </g>
            );
          })}
          {/* Dragged boat ghost rendered in its current tier column */}
          {drag && (() => {
            const boat = boatById[drag.boatId];
            if (!boat) return null;
            const p = placements.find(pl => pl.id === drag.placementId);
            if (!p) return null;
            if (drag.tier === p.tier) return null; // already rendered above
            const cx = colX(drag.tier, trayW);
            const color = BOAT_COLORS[boatColorIdx[drag.boatId] % BOAT_COLORS.length];
            const boatCX = cx + (halfW - drag.previewX);
            const boatCY = zToSvgY(drag.previewZ, halfLen, overhang);
            return (
              <g key="drag-ghost" style={{ pointerEvents: 'none' }}>
                <path
                  d={boatOutlinePath(boat.widthM, boat.lengthM)}
                  transform={`translate(${boatCX},${boatCY})`}
                  fill={drag.valid ? color : '#fca5a5'}
                  fillOpacity={0.55}
                  stroke={drag.valid ? 'rgba(255,255,255,0.7)' : '#dc2626'}
                  strokeWidth={0.022}
                />
                <text
                  x={boatCX} y={boatCY}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize={Math.min(0.20, boat.widthM * 0.65)}
                  fill="white" fontWeight="bold"
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >{boat.boatClass}</text>
              </g>
            );
          })()}
        </svg>
      </div>

      {/* Boathouse: desktop = right sidebar; mobile = bottom sheet */}
      <div style={isMobile ? {
        position: 'absolute', left: 0, right: 0, bottom: 0, height: '58%',
        background: 'white', display: 'flex', flexDirection: 'column', overflow: 'hidden', zIndex: 11,
        borderTopLeftRadius: 14, borderTopRightRadius: 14, boxShadow: '0 -4px 16px rgba(0,0,0,0.15)',
        transform: mobilePanel === 'boathouse' ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.22s ease',
      } : {
        width: 180, flexShrink: 0, borderLeft: '1px solid #e2e8f0', background: 'white',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px 4px', borderBottom: '1px solid #f1f5f9', flexShrink: 0 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Boathouse ({unplacedBoats.length})
          </span>
          {isMobile && (
            <button onClick={() => setMobilePanel(null)} style={{ background: 'none', border: 'none', fontSize: 18, color: '#64748b', cursor: 'pointer', lineHeight: 1 }}>✕</button>
          )}
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {boats.length === 0 && (
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Add boats in the Boats tab first.</div>
          )}
          {unplacedBoats.length === 0 && boats.length > 0 && (
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>All boats placed on trailer.</div>
          )}
          {classKeys.map(cls => (
            <div key={cls}>
              <div style={{
                fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase',
                letterSpacing: '0.4px', marginBottom: 4,
              }}>
                {cls}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {classGroups[cls].map(boat => {
                  const color = BOAT_COLORS[boatColorIdx[boat.id] % BOAT_COLORS.length];
                  const sel = pendingBoatId === boat.id;
                  return (
                    <div
                      key={boat.id}
                      onClick={() => { setPendingBoatId(sel ? null : boat.id); setMobilePanel(null); }}
                      title={`${boat.name} — ${boat.lengthM}m`}
                      style={{
                        background: sel ? '#dbeafe' : color,
                        color: sel ? '#1d4ed8' : 'white',
                        border: sel ? '2px solid #1d4ed8' : '2px solid transparent',
                        borderRadius: 5, padding: '3px 6px',
                        fontSize: 10, fontWeight: 600, cursor: 'pointer',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}
                    >
                      <span style={{ opacity: 0.75, fontSize: 9 }}>{boat.lengthM}m · </span>
                      {boat.name}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile toggle bar — open the end-views drawer or the boathouse sheet */}
      {isMobile && (
        <div style={{ display: 'flex', gap: 8, padding: '8px 12px', borderTop: '1px solid #e2e8f0', background: 'white', flexShrink: 0, zIndex: 1 }}>
          <button onClick={() => setMobilePanel(mobilePanel === 'end' ? null : 'end')}
            style={mobilePanel === 'end' ? mobileTabActive : mobileTab}>📐 End views</button>
          <button onClick={() => setMobilePanel(mobilePanel === 'boathouse' ? null : 'boathouse')}
            style={mobilePanel === 'boathouse' ? mobileTabActive : mobileTab}>🚣 Boathouse ({unplacedBoats.length})</button>
        </div>
      )}

      </div>{/* end main row */}
    </div>
  );
}
