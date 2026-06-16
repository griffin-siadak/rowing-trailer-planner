import { useState } from 'react';
import { useStore } from '../store';

const S = {
  page: { padding: 16, overflowY: 'auto' as const, flex: 1 },
  card: { background: 'white', borderRadius: 12, padding: 16, marginBottom: 12, boxShadow: '0 1px 3px rgba(0,0,0,.1)' },
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 },
  input: {
    width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1',
    borderRadius: 8, fontSize: 15, outline: 'none', boxSizing: 'border-box' as const,
  },
  row: { display: 'flex', gap: 12, marginBottom: 12 },
  h2: { margin: '0 0 12px', fontSize: 16, fontWeight: 700, color: '#1e293b' },
  btn: {
    padding: '10px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
    fontWeight: 600, fontSize: 14, background: '#1d4ed8', color: 'white', width: '100%',
  },
};

export default function TrailerSetup() {
  const { trailer, updateTrailer, clearPlacements, addTowerGroup, removeTowerGroup, setTowersPerGroup, setGroupsXCenter } = useStore();
  const [tiers, setTiers] = useState(trailer.tiers);

  function apply() {
    updateTrailer({ tiers });
    clearPlacements();
  }

  const halfW = trailer.trailerWidthM / 2;
  const canRemove = trailer.towerGroups.length > 2;
  const towersPerGroup = trailer.towerGroups[0]?.count ?? 1;
  const twoTowers = towersPerGroup === 2;
  const sharedXCenter = trailer.towerGroups[0]?.xCenter ?? 0;

  return (
    <div style={S.page}>
      <div style={S.card}>
        <h2 style={S.h2}>Trailer Info</h2>
        <div style={{ marginBottom: 12 }}>
          <label style={S.label}>Trailer Name</label>
          <input
            style={S.input}
            value={trailer.name}
            onChange={(e) => updateTrailer({ name: e.target.value })}
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={S.label}>Bed length (m)</label>
          <input
            style={S.input}
            type="number" step="0.1" min={1}
            value={trailer.bedLengthM ?? 10.97}
            onChange={(e) => updateTrailer({ bedLengthM: Number(e.target.value) })}
          />
        </div>
        <div style={S.row}>
          <div style={{ flex: 1 }}>
            <label style={S.label}>Trailer width (m)</label>
            <input
              style={S.input}
              type="number" step="0.01" min={0.5} max={4.0}
              value={trailer.trailerWidthM ?? 2.44}
              onChange={(e) => updateTrailer({ trailerWidthM: Number(e.target.value) })}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={S.label}>Tongue length (m)</label>
            <input
              style={S.input}
              type="number" step="0.1" min={0.5} max={6}
              value={trailer.tongueLengthM ?? 2.0}
              onChange={(e) => updateTrailer({ tongueLengthM: Number(e.target.value) })}
            />
          </div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={S.label}>Tiers (rows)</label>
          <input
            style={S.input}
            type="number" min={1} max={6}
            value={tiers}
            onChange={(e) => setTiers(Number(e.target.value))}
          />
        </div>
        <button style={S.btn} onClick={apply}>
          Apply Structure (clears layout)
        </button>
      </div>

      <div style={S.card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <h2 style={{ ...S.h2, margin: 0 }}>Tower Groups</h2>
          <button
            onClick={addTowerGroup}
            style={{
              padding: '5px 12px', borderRadius: 7, border: 'none', cursor: 'pointer',
              fontWeight: 600, fontSize: 13, background: '#1d4ed8', color: 'white',
            }}
          >
            + Add Group
          </button>
        </div>

        {/* Global towers-per-group stepper */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, padding: '10px 12px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <label style={{ ...S.label, margin: 0, flex: 1 }}>Towers per group</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => setTowersPerGroup(1)}
              disabled={towersPerGroup === 1}
              style={{
                width: 30, height: 30, borderRadius: 6, border: '1px solid #cbd5e1',
                background: 'white', fontSize: 16, cursor: towersPerGroup === 1 ? 'not-allowed' : 'pointer',
                color: towersPerGroup === 1 ? '#cbd5e1' : '#1e293b', lineHeight: 1,
              }}
            >−</button>
            <span style={{ fontWeight: 700, fontSize: 16, minWidth: 16, textAlign: 'center' }}>
              {towersPerGroup}
            </span>
            <button
              onClick={() => setTowersPerGroup(2)}
              disabled={towersPerGroup === 2}
              style={{
                width: 30, height: 30, borderRadius: 6, border: '1px solid #cbd5e1',
                background: 'white', fontSize: 16, cursor: towersPerGroup === 2 ? 'not-allowed' : 'pointer',
                color: towersPerGroup === 2 ? '#cbd5e1' : '#1e293b', lineHeight: 1,
              }}
            >+</button>
          </div>
        </div>

        {/* Shared X-centre slider (single-tower mode) */}
        {!twoTowers && (
          <div style={{ marginBottom: 12, padding: '10px 12px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <label style={S.label}>
              X-centre offset (all groups): <strong>{sharedXCenter >= 0 ? '+' : ''}{sharedXCenter.toFixed(2)} m</strong>
            </label>
            <input
              type="range"
              min={-halfW + 0.1}
              max={halfW - 0.1}
              step={0.01}
              value={sharedXCenter}
              onChange={(e) => setGroupsXCenter(Number(e.target.value))}
              style={{ width: '100%' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94a3b8' }}>
              <span>Port {(-halfW + 0.1).toFixed(1)} m</span>
              <span>Centre</span>
              <span>Stbd +{(halfW - 0.1).toFixed(1)} m</span>
            </div>
          </div>
        )}

        {twoTowers && (
          <div style={{ marginBottom: 12, padding: '8px 12px', borderRadius: 8, background: '#f1f5f9', border: '1px solid #e2e8f0', fontSize: 13, color: '#64748b' }}>
            2-tower groups are auto-spaced at trailer thirds (±{(halfW / 3).toFixed(2)} m from centre)
          </div>
        )}

        {trailer.towerGroups.map((group, i) => (
          <div key={group.id} style={{
            border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 12px',
            marginBottom: 10, background: '#f8fafc',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }}>Group {i + 1}</span>
            <button
              onClick={() => removeTowerGroup(group.id)}
              disabled={!canRemove}
              style={{
                padding: '3px 9px', borderRadius: 6, border: '1px solid #cbd5e1',
                cursor: canRemove ? 'pointer' : 'not-allowed',
                fontSize: 13, background: canRemove ? '#fee2e2' : '#f1f5f9',
                color: canRemove ? '#b91c1c' : '#94a3b8', fontWeight: 600,
              }}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
