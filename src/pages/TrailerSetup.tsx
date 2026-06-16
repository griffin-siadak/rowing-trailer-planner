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
  const { trailer, updateTrailer, clearPlacements } = useStore();
  const [tiers, setTiers] = useState(trailer.tiers);

  function apply() {
    updateTrailer({ tiers });
    clearPlacements();
  }

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
        <div style={S.row}>
          <div style={{ flex: 1 }}>
            <label style={S.label}>Number of towers</label>
            <input
              style={S.input}
              type="number" min={2} max={8} step={1}
              value={trailer.towerCount ?? 3}
              onChange={(e) => updateTrailer({ towerCount: Number(e.target.value) })}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={S.label}>Tiers (rows)</label>
            <input
              style={S.input}
              type="number" min={1} max={6}
              value={tiers}
              onChange={(e) => setTiers(Number(e.target.value))}
            />
          </div>
        </div>
        <button style={S.btn} onClick={apply}>
          Apply Structure (clears layout)
        </button>
      </div>
    </div>
  );
}
