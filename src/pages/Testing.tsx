import { useState } from 'react';
import { useStore, BOAT_CLASSES } from '../store';
import { SHELL_DB } from '../shellDatabase';

const CLASS_ORDER = ['8+', '4+', '4-', '4x', '2-', '2x', '1x'];

const card: React.CSSProperties = {
  background: 'white', borderRadius: 12, padding: 16, marginBottom: 12,
  boxShadow: '0 1px 3px rgba(0,0,0,.1)',
};
const label: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4,
};
const input: React.CSSProperties = {
  width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1',
  borderRadius: 8, fontSize: 15, outline: 'none', boxSizing: 'border-box',
};

export default function Testing() {
  const { boats, addBoat, clearAll } = useStore();
  const [count, setCount] = useState(10);
  const [cls, setCls] = useState<string>('any');
  const [guest, setGuest] = useState(false);

  const clubCount  = boats.filter(b => !b.guest).length;
  const guestCount = boats.filter(b => b.guest).length;

  function generate() {
    const n = Math.max(1, Math.min(100, Math.round(count)));
    const usable = SHELL_DB.filter(s => s.lengthM && s.widthM);
    const pool = cls === 'any'
      ? usable
      : usable.filter(s => s.boatClass.split('/').map(x => x.trim()).includes(cls));
    const shuffled = [...pool].sort(() => Math.random() - 0.5);

    for (let i = 0; i < n; i++) {
      const s = shuffled.length ? shuffled[i % shuffled.length] : null;
      if (s) {
        addBoat({
          name: `${s.manufacturer} ${s.modelName}`,
          manufacturer: s.manufacturer,
          boatClass: cls === 'any' ? s.boatClass.split('/')[0] : cls,
          lengthM: s.lengthM,
          widthM: s.widthM ?? 0.32,
          weightKg: s.hullWeightKg ?? 50,
          guest,
        });
      } else {
        // No matching shells for this class → fall back to preset dimensions.
        const preset = BOAT_CLASSES[cls] ?? BOAT_CLASSES['1x'];
        addBoat({
          name: `Test ${cls} #${i + 1}`, boatClass: cls,
          lengthM: preset.lengthM, widthM: preset.widthM, weightKg: preset.weightKg, guest,
        });
      }
    }
  }

  return (
    <div style={{ padding: 16, overflowY: 'auto', flex: 1 }}>
      <div style={{ ...card, background: '#fef3c7', border: '1px solid #fde68a', fontSize: 13, color: '#92400e' }}>
        🧪 Testing tools — quickly generate boats to exercise the layout and 3D views.
      </div>

      <div style={card}>
        <h2 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 700, color: '#1e293b' }}>Random boat generator</h2>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
          <div style={{ flex: '1 1 120px' }}>
            <label style={label}>Amount</label>
            <input style={input} type="number" min={1} max={100}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))} />
          </div>
          <div style={{ flex: '1 1 120px' }}>
            <label style={label}>Boat class</label>
            <select style={input} value={cls} onChange={(e) => setCls(e.target.value)}>
              <option value="any">Any class</option>
              {CLASS_ORDER.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ flex: '1 1 120px' }}>
            <label style={label}>Owner</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {([['Club', false], ['Guest', true]] as const).map(([lbl, val]) => (
                <button key={lbl} type="button" onClick={() => setGuest(val)}
                  style={{
                    flex: 1, padding: '8px 10px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14,
                    border: guest === val ? '2px solid #1d4ed8' : '1px solid #cbd5e1',
                    background: guest === val ? '#dbeafe' : 'white',
                    color: guest === val ? '#1d4ed8' : '#64748b',
                  }}>
                  {lbl}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button onClick={generate}
          style={{
            width: '100%', padding: '11px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
            fontWeight: 700, fontSize: 15, background: '#1d4ed8', color: 'white',
          }}>
          Generate {Math.max(1, Math.min(100, Math.round(count) || 1))} {cls === 'any' ? '' : cls + ' '}{guest ? 'guest' : 'club'} boat{count === 1 ? '' : 's'}
        </button>
      </div>

      <div style={card}>
        <h2 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 700, color: '#1e293b' }}>Fleet</h2>
        <div style={{ fontSize: 14, color: '#475569', marginBottom: 12 }}>
          {boats.length} boat{boats.length === 1 ? '' : 's'} total
          <span style={{ color: '#94a3b8' }}> · {clubCount} club · {guestCount} guest</span>
        </div>
        <button
          onClick={() => { if (window.confirm('Remove all boats and clear the layout?')) clearAll(); }}
          disabled={boats.length === 0}
          style={{
            padding: '9px 14px', borderRadius: 8, cursor: boats.length ? 'pointer' : 'not-allowed',
            fontWeight: 600, fontSize: 14, background: 'white',
            border: '1px solid #fca5a5', color: boats.length ? '#b91c1c' : '#fca5a5',
          }}>
          Clear all boats
        </button>
      </div>
    </div>
  );
}
