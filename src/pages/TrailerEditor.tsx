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

// ─── Side profile: looking from the side (Z = length horizontal, Y = height) ──
function SideView({ trailer }: { trailer: Trailer }) {
  const g = trailerGeom(trailer);
  const pad = 0.6;
  const frontMax = g.halfLen + trailer.tongueLengthM;
  // Front (+Z, tongue) on the left.
  const sx = (z: number) => (frontMax + pad) - z;
  const yTop = g.topY + pad;
  const sy = (y: number) => yTop - y;

  const vbW = (frontMax + pad) - (-g.halfLen - pad);
  const vbH = yTop - (g.realFloor - pad * 0.6);

  const stroke = 0.03;
  const fs = 0.20;

  return (
    <svg viewBox={`0 0 ${vbW} ${vbH}`} style={{ width: '100%', maxHeight: 340, display: 'block', margin: '0 auto' }}>
      {/* ground */}
      <line x1={0} y1={sy(g.realFloor)} x2={vbW} y2={sy(g.realFloor)} stroke={COL.ground} strokeWidth={0.04} />

      {/* chassis deck beam (bed) */}
      <rect x={sx(g.halfLen)} y={sy(DECK_Y)} width={sx(-g.halfLen) - sx(g.halfLen)} height={0.14}
        fill={COL.beam} />

      {/* tongue */}
      <line x1={sx(frontMax)} y1={sy(DECK_Y) + 0.07} x2={sx(g.halfLen)} y2={sy(DECK_Y) + 0.07}
        stroke={COL.tongue} strokeWidth={0.06} strokeLinecap="round" />
      <text x={(sx(frontMax) + sx(g.halfLen)) / 2} y={sy(DECK_Y) + 0.07 - 0.12}
        textAnchor="middle" fontSize={fs * 0.85} fill={COL.label}>
        tongue {trailer.tongueLengthM.toFixed(2)} m
      </text>

      {/* tier rails (horizontal lines spanning the tower extent) */}
      {g.tYs.map((y, t) => (
        <g key={t}>
          <line x1={sx(g.frontZ)} y1={sy(y)} x2={sx(g.rearZ)} y2={sy(y)} stroke={COL.tier} strokeWidth={stroke} />
          <text x={sx(g.rearZ) + 0.12} y={sy(y) + 0.16} textAnchor="start" fontSize={fs * 0.8} fill={COL.label}>
            {TIER_NAMES[t] ?? `T${t + 1}`} · {trailer.tiers[t].heightM.toFixed(2)} m
          </text>
        </g>
      ))}

      {/* tower groups (vertical posts at their zPos) */}
      {trailer.towerGroups.map((grp, i) => (
        <g key={grp.id}>
          <line x1={sx(grp.zPosM)} y1={sy(DECK_Y)} x2={sx(grp.zPosM)} y2={sy(g.topY)}
            stroke={COL.post} strokeWidth={Math.max(0.03, grp.postWidthM)} />
          <text x={sx(grp.zPosM)} y={sy(g.topY) - 0.10} textAnchor="middle" fontSize={fs * 0.8} fill={COL.post}>
            G{i + 1} · z{grp.zPosM >= 0 ? '+' : ''}{grp.zPosM.toFixed(2)}
          </text>
        </g>
      ))}

      {/* axles / wheels */}
      {trailer.axles.map((a) => (
        <g key={a.id}>
          <circle cx={sx(a.zPosM)} cy={sy(g.axleCentY)} r={a.wheelDiaM / 2} fill={COL.wheel} />
          <circle cx={sx(a.zPosM)} cy={sy(g.axleCentY)} r={a.wheelDiaM / 2 * 0.45} fill="#b0bbc4" />
        </g>
      ))}

      {/* bed length dimension */}
      <text x={(sx(g.halfLen) + sx(-g.halfLen)) / 2} y={sy(g.realFloor) + 0.30}
        textAnchor="middle" fontSize={fs} fill={COL.dim}>
        bed {trailer.bedLengthM.toFixed(2)} m
      </text>
    </svg>
  );
}

// ─── End cross-section: looking down the length (X = lateral, Y = height) ─────
function EndView({ trailer }: { trailer: Trailer }) {
  const g = trailerGeom(trailer);
  const maxRail  = Math.max(trailer.trailerWidthM, ...trailer.tiers.map(t => t.railWidthM));
  const maxTrack = Math.max(...trailer.axles.map(a => a.trackWidthM));
  const halfSpan = Math.max(maxRail, maxTrack) / 2;
  const pad = 0.4;

  const ex = (x: number) => (halfSpan + pad) + x;       // x=0 at centre
  const yTop = g.topY + pad;
  const ey = (y: number) => yTop - y;

  const vbW = 2 * (halfSpan + pad);
  const vbH = yTop - (g.realFloor - pad * 0.6);
  const stroke = 0.03;
  const fs = 0.20;

  // Unique post X positions across all groups (they overlap in an end view).
  const postXs = Array.from(new Set(trailer.towerGroups.flatMap(grp => grp.postXs))).sort((a, b) => a - b);
  const postW  = Math.max(0.03, trailer.towerGroups[0]?.postWidthM ?? 0.08);

  return (
    <svg viewBox={`0 0 ${vbW} ${vbH}`} style={{ width: '100%', maxHeight: 340, display: 'block', margin: '0 auto' }}>
      {/* ground */}
      <line x1={0} y1={ey(g.realFloor)} x2={vbW} y2={ey(g.realFloor)} stroke={COL.ground} strokeWidth={0.04} />

      {/* centreline */}
      <line x1={ex(0)} y1={ey(g.topY) - 0.2} x2={ex(0)} y2={ey(g.realFloor)} stroke="#e2e8f0" strokeWidth={0.012} strokeDasharray="0.1 0.08" />

      {/* chassis beams */}
      {[-g.chHW, g.chHW].map((bx, i) => (
        <rect key={i} x={ex(bx) - trailer.beamWidthM / 2} y={ey(DECK_Y)} width={trailer.beamWidthM} height={0.14} fill={COL.beam} />
      ))}

      {/* wheels (front axle's track) */}
      {[-maxTrack / 2, maxTrack / 2].map((wx, i) => (
        <circle key={i} cx={ex(wx)} cy={ey(g.axleCentY)} r={g.maxWheelR} fill={COL.wheel} />
      ))}

      {/* tier rails (horizontal, spanning railWidthM) */}
      {g.tYs.map((y, t) => {
        const hw = trailer.tiers[t].railWidthM / 2;
        return (
          <g key={t}>
            <line x1={ex(-hw)} y1={ey(y)} x2={ex(hw)} y2={ey(y)} stroke={COL.tier} strokeWidth={stroke} />
            <text x={ex(hw) + 0.10} y={ey(y) + 0.05} fontSize={fs * 0.72} fill={COL.label}>
              {(trailer.tiers[t].railWidthM).toFixed(2)} m
            </text>
          </g>
        );
      })}

      {/* tower posts (vertical at each unique X) */}
      {postXs.map((px, i) => (
        <line key={i} x1={ex(px)} y1={ey(DECK_Y)} x2={ex(px)} y2={ey(g.topY)} stroke={COL.post} strokeWidth={postW} />
      ))}

      {/* width dimension */}
      <text x={ex(0)} y={ey(g.realFloor) + 0.30} textAnchor="middle" fontSize={fs} fill={COL.dim}>
        width {trailer.trailerWidthM.toFixed(2)} m · track {maxTrack.toFixed(2)} m
      </text>
    </svg>
  );
}

export default function TrailerEditor() {
  const { trailer, updateTrailer } = useStore();

  return (
    <div style={{ padding: 16, overflowY: 'auto', flex: 1 }}>
      <div style={{ ...card, background: '#eff6ff', border: '1px solid #bfdbfe', fontSize: 13, color: '#1d4ed8' }}>
        Visual trailer editor (Phase 1: live preview). Drag-to-adjust handles and per-part
        controls are being added next — for now the views below reflect the current model.
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
