import { useState } from 'react';
import { useStore } from '../store';
import { SHELL_DB, MANUFACTURERS } from '../shellDatabase';

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
  const [maker, setMaker] = useState<string>('any');
  const [includeOdd, setIncludeOdd] = useState(false);
  const [msg, setMsg] = useState('');

  const clubCount  = boats.filter(b => !b.guest).length;
  const guestCount = boats.filter(b => b.guest).length;

  function generate() {
    const n = Math.max(1, Math.min(100, Math.round(count)));
    const pool = SHELL_DB.filter(s =>
      s.lengthM && s.widthM
      && (includeOdd || s.category === 'racing')                                   // exclude touring/coastal/etc unless asked
      && (maker === 'any' || s.manufacturer === maker)                             // manufacturer filter
      && (cls === 'any' || s.boatClass.split('/').map(x => x.trim()).includes(cls)) // class filter
    );
    if (pool.length === 0) {
      setMsg('No boats match those filters — try Any class/manufacturer or include odd-size boats.');
      return;
    }
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    for (let i = 0; i < n; i++) {
      const s = shuffled[i % shuffled.length];
      addBoat({
        name: `${s.manufacturer} ${s.modelName}`,
        manufacturer: s.manufacturer,
        boatClass: cls === 'any' ? s.boatClass.split('/')[0] : cls,
        lengthM: s.lengthM,
        widthM: s.widthM ?? 0.32,
        weightKg: s.hullWeightKg ?? 50,
      });
    }
    setMsg(`Added ${n} boat${n === 1 ? '' : 's'}.`);
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
          <div style={{ flex: '1 1 220px' }}>
            <label style={label}>Manufacturer</label>
            <select style={input} value={maker} onChange={(e) => setMaker(e.target.value)}>
              <option value="any">Any manufacturer</option>
              {MANUFACTURERS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, fontSize: 14, color: '#475569', cursor: 'pointer' }}>
          <input type="checkbox" checked={includeOdd} onChange={(e) => setIncludeOdd(e.target.checked)} />
          Include odd-size boats (touring, coastal, recreational, adaptive)
        </label>

        <button onClick={generate}
          style={{
            width: '100%', padding: '11px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
            fontWeight: 700, fontSize: 15, background: '#1d4ed8', color: 'white',
          }}>
          Generate {Math.max(1, Math.min(100, Math.round(count) || 1))} {cls === 'any' ? '' : cls + ' '}boat{count === 1 ? '' : 's'}
        </button>
        {msg && (
          <div style={{ marginTop: 8, fontSize: 13, color: msg.startsWith('No') ? '#b91c1c' : '#16a34a' }}>{msg}</div>
        )}
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
