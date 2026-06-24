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
  stepBtn: {
    width: 30, height: 30, borderRadius: 6, border: '1px solid #cbd5e1',
    background: 'white', fontSize: 16, cursor: 'pointer', color: '#1e293b', lineHeight: 1,
  },
  addBtn: {
    padding: '5px 12px', borderRadius: 7, border: 'none', cursor: 'pointer',
    fontWeight: 600, fontSize: 13, background: '#1d4ed8', color: 'white',
  },
};

export default function TrailerSetup() {
  const {
    trailer, updateTrailer, clearPlacements,
    addTier, removeTier, addTowerGroup, removeTowerGroup,
  } = useStore();

  const tierCount = trailer.tiers.length;

  return (
    <div style={S.page}>
      <div style={{
        ...S.card, background: '#eff6ff', border: '1px solid #bfdbfe',
        fontSize: 13, color: '#1d4ed8',
      }}>
        A visual end-view + side-view editor is coming here. For now, set the basics below —
        per-tier heights, tower spacing, and wheel placement become drag-adjustable next.
      </div>

      <div style={S.card}>
        <h2 style={S.h2}>Trailer Info</h2>
        <div style={{ marginBottom: 12 }}>
          <label style={S.label}>Trailer Name</label>
          <input style={S.input} value={trailer.name}
            onChange={(e) => updateTrailer({ name: e.target.value })} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={S.label}>Bed length (m)</label>
          <input style={S.input} type="number" step="0.1" min={1}
            value={trailer.bedLengthM}
            onChange={(e) => updateTrailer({ bedLengthM: Number(e.target.value) })} />
        </div>
        <div style={S.row}>
          <div style={{ flex: 1 }}>
            <label style={S.label}>Trailer width (m)</label>
            <input style={S.input} type="number" step="0.01" min={0.5} max={4.0}
              value={trailer.trailerWidthM}
              onChange={(e) => updateTrailer({ trailerWidthM: Number(e.target.value) })} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={S.label}>Tongue length (m)</label>
            <input style={S.input} type="number" step="0.1" min={0.5} max={6}
              value={trailer.tongueLengthM}
              onChange={(e) => updateTrailer({ tongueLengthM: Number(e.target.value) })} />
          </div>
        </div>
      </div>

      <div style={S.card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ ...S.h2, margin: 0 }}>Tiers</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button style={S.stepBtn} onClick={() => { removeTier(trailer.tiers[tierCount - 1]?.id); clearPlacements(); }}
              disabled={tierCount <= 1}>−</button>
            <span style={{ fontWeight: 700, fontSize: 16, minWidth: 16, textAlign: 'center' }}>{tierCount}</span>
            <button style={S.stepBtn} onClick={addTier}>+</button>
          </div>
        </div>
      </div>

      <div style={S.card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <h2 style={{ ...S.h2, margin: 0 }}>Tower Groups</h2>
          <button style={S.addBtn} onClick={addTowerGroup}>+ Add Group</button>
        </div>
        {trailer.towerGroups.map((group, i) => (
          <div key={group.id} style={{
            border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 12px',
            marginBottom: 10, background: '#f8fafc',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 13, color: '#1e293b' }}>
              <strong>Group {i + 1}</strong>
              <span style={{ color: '#64748b', marginLeft: 8 }}>
                z {group.zPosM.toFixed(2)} m · {group.postXs.length} post{group.postXs.length > 1 ? 's' : ''}
              </span>
            </span>
            <button
              onClick={() => removeTowerGroup(group.id)}
              disabled={trailer.towerGroups.length <= 2}
              style={{
                padding: '3px 9px', borderRadius: 6, border: '1px solid #cbd5e1',
                cursor: trailer.towerGroups.length <= 2 ? 'not-allowed' : 'pointer',
                fontSize: 13, background: trailer.towerGroups.length <= 2 ? '#f1f5f9' : '#fee2e2',
                color: trailer.towerGroups.length <= 2 ? '#94a3b8' : '#b91c1c', fontWeight: 600,
              }}
            >Remove</button>
          </div>
        ))}
      </div>
    </div>
  );
}
