import { useState } from 'react';
import { useStore } from '../store';
import { computeTowerZs, snapZ, isValidZ, footprintsOverlap } from '../utils';
import { SHELL_DB } from '../shellDatabase';

const TIER_NAMES = ['Top', 'Upper-Mid', 'Lower-Mid', 'Bottom', 'Fifth', 'Sixth'];
const BOAT_COLORS = [
  '#2563eb', '#dc2626', '#16a34a', '#d97706', '#7c3aed',
  '#db2777', '#0891b2', '#65a30d', '#ea580c', '#4f46e5',
];

const MIN_OVERHANG = 1.5; // minimum canvas beyond each trailer end
const COL_GAP  = 0.5;  // m gap between tier columns
const SVG_PAD  = 0.35; // m padding around all columns
const HDR_H    = 0.45; // m header zone above overhang (for tier labels)

function colX(tier: number, trayW: number) {
  return SVG_PAD + tier * (trayW + COL_GAP);
}

// Rowing shell silhouette centred at origin, bow at top (−y), stern at bottom (+y)
function boatOutlinePath(w: number, l: number): string {
  const hw = w / 2;
  const hl = l / 2;
  const bt = hl * 0.13; // bow taper length
  const st = hl * 0.17; // stern taper length (slightly blunter)
  return (
    `M 0,${-hl} ` +
    `C ${hw * 0.10},${-hl + bt} ${hw},${-hl + bt * 4} ${hw},0 ` +
    `C ${hw},${hl - st * 3} ${hw * 0.14},${hl - st} 0,${hl} ` +
    `C ${-hw * 0.14},${hl - st} ${-hw},${hl - st * 3} ${-hw},0 ` +
    `C ${-hw},${-hl + bt * 4} ${-hw * 0.10},${-hl + bt} 0,${-hl} Z`
  );
}

// world zCenterM (+ = front) → SVG y
function zToSvgY(zM: number, halfLen: number, overhang: number) {
  return HDR_H + overhang + halfLen - zM;
}

// SVG y → world zCenterM
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

const btnPrimary: React.CSSProperties = {
  flex: 1, padding: '8px 12px', background: '#1d4ed8', color: 'white',
  border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer',
};
const btnSecondary: React.CSSProperties = {
  padding: '8px 12px', background: 'white', color: '#1d4ed8',
  border: '1px solid #93c5fd', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer',
};

export default function Layout() {
  const {
    trailer, boats, placements,
    addPlacement, movePlacement, setSlung, removePlacement, clearPlacements,
    autoLayout, addBoat,
  } = useStore();

  const towerZs = computeTowerZs(trailer);
  const halfLen = trailer.bedLengthM / 2;
  const halfW   = trailer.trailerWidthM / 2;
  const bedLen  = trailer.bedLengthM;
  const trayW   = trailer.trailerWidthM;

  const boatById      = Object.fromEntries(boats.map(b => [b.id, b]));
  const boatColorIdx  = Object.fromEntries(boats.map((b, i) => [b.id, i]));
  const placedIds     = new Set(placements.map(p => p.boatId));
  const unplacedBoats = boats.filter(b => !placedIds.has(b.id));

  const [pendingBoatId, setPendingBoatId] = useState<string | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);

  // Overhang buffer: enough to show the longest boat overhanging both ends
  const maxBoatLen = boats.reduce((m, b) => Math.max(m, b.lengthM), 0);
  const overhang = Math.max(MIN_OVERHANG, (maxBoatLen - bedLen) / 2 + 0.5);

  const svgH = HDR_H + overhang + bedLen + overhang;
  const svgW = SVG_PAD + trailer.tiers * trayW + (trailer.tiers - 1) * COL_GAP + SVG_PAD;

  function isOk(tier: number, boatId: string, xM: number, zM: number, isSlung: boolean, excludeId?: string) {
    const boat = boatById[boatId];
    if (!boat) return false;
    if (!isValidZ(zM, boat.lengthM, towerZs)) return false;
    return !placements.some(p => {
      if (p.tier !== tier || p.id === excludeId) return false;
      // slung and non-slung are at different heights — no XZ conflict between them
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
      const tier  = tierFromSvgX(svgEl, e.clientX, trayW, trailer.tiers);
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
    const { xM: ptrX, zM: ptrZ } = svgPtToScene(e.currentTarget, e.clientX, e.clientY, trayW, halfLen, halfW, drag.tier, overhang);
    const rawZ = ptrZ - drag.offsetZ;
    const rawX = ptrX - drag.offsetX;
    const snZ  = snapZ(rawZ, boat.lengthM, towerZs, halfLen);
    const clX  = Math.max(-halfW + boat.widthM / 2, Math.min(halfW - boat.widthM / 2, rawX));
    const valid = isOk(drag.tier, drag.boatId, clX, snZ, drag.slung, drag.placementId);
    setDrag(d => d ? { ...d, previewX: clX, previewZ: snZ, valid } : null);
  }

  function handlePointerUp() {
    if (!drag) return;
    if (drag.valid) movePlacement(drag.placementId, { xM: drag.previewX, zCenterM: drag.previewZ });
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      {/* Toolbar */}
      <div style={{ padding: '10px 16px', background: 'white', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: 8 }}>
        <button onClick={autoLayout} style={btnPrimary}>✨ Auto-Arrange</button>
        <button onClick={addRandom} style={btnSecondary}>+ 10 Random</button>
        <button onClick={clearPlacements} style={{ ...btnSecondary, color: '#64748b', borderColor: '#cbd5e1' }}>Clear</button>
      </div>

      {pendingBoatId && (
        <div style={{ padding: '6px 16px', background: '#eff6ff', borderBottom: '1px solid #93c5fd', fontSize: 12, color: '#1d4ed8', display: 'flex', alignItems: 'center' }}>
          Click a tier column to place <strong style={{ marginLeft: 4 }}>{boatById[pendingBoatId]?.name}</strong>
          <button onClick={() => setPendingBoatId(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#1d4ed8', cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>✕</button>
        </div>
      )}

      {/* SVG — fills remaining height, scrolls horizontally for many tiers */}
      <div style={{ flex: 1, overflowX: 'auto', overflowY: 'hidden', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
          <svg
            viewBox={`0 0 ${svgW} ${svgH}`}
            style={{ display: 'block', height: '100%', width: 'auto', minWidth: '100%', cursor: pendingBoatId ? 'crosshair' : 'default', touchAction: 'none' }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            {Array.from({ length: trailer.tiers }, (_, t) => {
              const cx = colX(t, trayW);
              return (
                <g key={t}>
                  {/* Front overhang zone */}
                  <rect x={cx} y={HDR_H} width={trayW} height={overhang} fill="#dde3ea" />
                  {/* Bed zone */}
                  <rect x={cx} y={HDR_H + overhang} width={trayW} height={bedLen} fill="#e8edf3" />
                  {/* Rear overhang zone */}
                  <rect x={cx} y={HDR_H + overhang + bedLen} width={trayW} height={overhang} fill="#dde3ea" />
                  {/* Column outline */}
                  <rect x={cx} y={HDR_H} width={trayW} height={overhang * 2 + bedLen}
                    fill="none" stroke="#94a3b8" strokeWidth={0.03} />
                  {/* Bed boundary lines */}
                  <line x1={cx} y1={HDR_H + overhang} x2={cx + trayW} y2={HDR_H + overhang}
                    stroke="#475569" strokeWidth={0.05} />
                  <line x1={cx} y1={HDR_H + overhang + bedLen} x2={cx + trayW} y2={HDR_H + overhang + bedLen}
                    stroke="#475569" strokeWidth={0.05} />
                  {/* Tier label */}
                  <text x={cx + trayW / 2} y={HDR_H * 0.52} textAnchor="middle" dominantBaseline="middle"
                    fontSize={0.24} fontWeight="700" fill="#334155">
                    {TIER_NAMES[t] ?? `Tier ${t + 1}`}
                  </text>
                  {/* Front / Rear labels in overhang zones */}
                  <text x={cx + trayW / 2} y={HDR_H + overhang * 0.3} textAnchor="middle" dominantBaseline="middle"
                    fontSize={0.18} fill="#64748b">▲ Front</text>
                  <text x={cx + trayW / 2} y={HDR_H + overhang + bedLen + overhang * 0.7} textAnchor="middle" dominantBaseline="middle"
                    fontSize={0.18} fill="#64748b">Rear ▼</text>
                  {/* Tower lines (horizontal dashes) */}
                  {towerZs.map((tz, i) => {
                    const lineY = zToSvgY(tz, halfLen, overhang);
                    return (
                      <line key={i}
                        x1={cx} y1={lineY} x2={cx + trayW} y2={lineY}
                        stroke="#64748b" strokeWidth={0.03} strokeDasharray="0.14 0.08"
                      />
                    );
                  })}
                  {/* Boats */}
                  {placements.filter(p => p.tier === t).map(p => {
                    const boat = boatById[p.boatId];
                    if (!boat) return null;
                    const isDragging = drag?.placementId === p.id;
                    const dispX = isDragging ? drag!.previewX : p.xM;
                    const dispZ = isDragging ? drag!.previewZ : p.zCenterM;
                    const isSlung = !!p.slung;
                    const color = BOAT_COLORS[boatColorIdx[p.boatId] % BOAT_COLORS.length];
                    const invalid = isDragging ? !drag!.valid : !isOk(t, p.boatId, dispX, dispZ, isSlung, p.id);
                    const boatCX = cx + (halfW - dispX);
                    const boatCY = zToSvgY(dispZ, halfLen, overhang);
                    const rmX = boatCX + boat.widthM * 0.38;
                    const rmY = boatCY - boat.lengthM * 0.44;
                    const slX = boatCX - boat.widthM * 0.38;
                    const slY = rmY;
                    // slung boats: flip vertically + dashed outline + reduced opacity
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
                        {/* Sling toggle button */}
                        <circle
                          cx={slX} cy={slY} r={0.08}
                          fill={isSlung ? '#7c3aed' : '#64748b'}
                          style={{ cursor: 'pointer' }}
                          onPointerDown={e => e.stopPropagation()}
                          onClick={e => { e.stopPropagation(); setSlung(p.id, !isSlung); }}
                        />
                        <text
                          x={slX} y={slY}
                          textAnchor="middle" dominantBaseline="middle"
                          fontSize={0.10} fill="white"
                          style={{ pointerEvents: 'none', userSelect: 'none' }}
                        >{isSlung ? '⌃' : '⌄'}</text>
                        {/* Remove ✕ button */}
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
          </svg>
      </div>

      {/* Boathouse — fixed strip at bottom */}
      <div style={{ borderTop: '1px solid #e2e8f0', padding: '8px 12px', background: 'white' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Boathouse ({unplacedBoats.length})
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, minHeight: 36 }}>
          {unplacedBoats.map(boat => {
            const color = BOAT_COLORS[boatColorIdx[boat.id] % BOAT_COLORS.length];
            const sel   = pendingBoatId === boat.id;
            return (
              <div
                key={boat.id}
                onClick={() => setPendingBoatId(sel ? null : boat.id)}
                style={{
                  background: sel ? '#dbeafe' : color,
                  color: sel ? '#1d4ed8' : 'white',
                  border: sel ? '2px solid #1d4ed8' : '2px solid transparent',
                  borderRadius: 6, padding: '3px 7px',
                  fontSize: 11, fontWeight: 600, cursor: 'pointer',
                }}
              >
                <div style={{ fontSize: 9, opacity: 0.75 }}>{boat.boatClass} · {boat.lengthM}m</div>
                {boat.name}
              </div>
            );
          })}
          {unplacedBoats.length === 0 && boats.length > 0 && (
            <span style={{ fontSize: 12, color: '#94a3b8', alignSelf: 'center' }}>All boats placed</span>
          )}
          {boats.length === 0 && (
            <span style={{ fontSize: 12, color: '#94a3b8', alignSelf: 'center' }}>Add boats in the Boats tab first.</span>
          )}
        </div>
      </div>
    </div>
  );
}
