import { useState } from 'react';
import { useStore, BOAT_CLASSES } from '../store';
import type { Boat } from '../types';
import ShellPicker from '../components/ShellPicker';
import type { ShellRecord } from '../shellDatabase';

const S = {
  page: { padding: 16, overflowY: 'auto' as const, flex: 1 },
  card: { background: 'white', borderRadius: 12, padding: 16, marginBottom: 12, boxShadow: '0 1px 3px rgba(0,0,0,.1)' },
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 },
  input: {
    width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1',
    borderRadius: 8, fontSize: 15, outline: 'none', boxSizing: 'border-box' as const,
  },
  row: { display: 'flex', gap: 10, marginBottom: 10 },
  h2: { margin: '0 0 12px', fontSize: 16, fontWeight: 700, color: '#1e293b' },
  btn: (color = '#1d4ed8') => ({
    padding: '10px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
    fontWeight: 600, fontSize: 14, background: color, color: 'white', flex: 1,
  }),
  boatItem: {
    background: '#f8fafc', borderRadius: 10, padding: 12, marginBottom: 8,
    border: '1px solid #e2e8f0',
  },
  boatName: { fontWeight: 700, fontSize: 15, color: '#1e293b' },
  boatMeta: { fontSize: 12, color: '#64748b', marginTop: 2 },
  chip: (color: string) => ({
    display: 'inline-block', background: color, color: 'white',
    borderRadius: 99, padding: '1px 8px', fontSize: 11, fontWeight: 700, marginLeft: 6,
  }),
};

const CLASSES = Object.keys(BOAT_CLASSES);

function emptyForm() {
  return { name: '', boatClass: '1x', lengthM: 8.2, widthM: 0.29, weightKg: 14 };
}

export default function BoatRoster() {
  const { boats, addBoat, updateBoat, removeBoat } = useStore();
  const [form, setForm] = useState(emptyForm());
  const [editId, setEditId] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);

  function addFromDB(shell: ShellRecord, name: string) {
    addBoat({
      name,
      manufacturer: shell.manufacturer,
      boatClass: shell.boatClass,
      lengthM:   shell.lengthM,
      widthM:    shell.widthM  ?? (BOAT_CLASSES[shell.boatClass]?.widthM  ?? 0.30),
      weightKg:  shell.hullWeightKg ?? (BOAT_CLASSES[shell.boatClass]?.weightKg ?? 20),
    });
  }

  function fillFromClass(cls: string) {
    const preset = BOAT_CLASSES[cls];
    if (preset) setForm((f) => ({ ...f, boatClass: cls, ...preset }));
  }

  function save() {
    if (!form.name.trim()) return;
    if (editId) {
      updateBoat(editId, form);
      setEditId(null);
    } else {
      addBoat(form);
    }
    setForm(emptyForm());
  }

  function startEdit(boat: Boat) {
    setEditId(boat.id);
    setForm({
      name: boat.name,
      boatClass: boat.boatClass,
      lengthM: boat.lengthM,
      widthM: boat.widthM,
      weightKg: boat.weightKg,
    });
  }

  function cancel() {
    setEditId(null);
    setForm(emptyForm());
  }

  return (
    <div style={S.page}>
      {showPicker && (
        <ShellPicker onAdd={addFromDB} onClose={() => setShowPicker(false)} />
      )}

      {/* Database shortcut */}
      <button
        onClick={() => setShowPicker(true)}
        style={{
          width: '100%', padding: '12px', marginBottom: 12,
          background: '#0f172a', color: 'white', border: 'none',
          borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
      >
        <span>🗄️</span> Add from Shell Database
      </button>

      <div style={S.card}>
        <h2 style={S.h2}>{editId ? 'Edit Boat' : 'Add Manually'}</h2>

        <div style={{ marginBottom: 10 }}>
          <label style={S.label}>Boat Name</label>
          <input
            style={S.input}
            placeholder="e.g. Blue Streak"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>

        <div style={{ marginBottom: 10 }}>
          <label style={S.label}>Class (preset dims)</label>
          <select
            style={S.input}
            value={form.boatClass}
            onChange={(e) => fillFromClass(e.target.value)}
          >
            {CLASSES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>

        <div style={S.row}>
          <div style={{ flex: 1 }}>
            <label style={S.label}>Length (m)</label>
            <input style={S.input} type="number" step="0.1"
              value={form.lengthM}
              onChange={(e) => setForm({ ...form, lengthM: Number(e.target.value) })} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={S.label}>Width (m)</label>
            <input style={S.input} type="number" step="0.01"
              value={form.widthM}
              onChange={(e) => setForm({ ...form, widthM: Number(e.target.value) })} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={S.label}>Weight (kg)</label>
            <input style={S.input} type="number"
              value={form.weightKg}
              onChange={(e) => setForm({ ...form, weightKg: Number(e.target.value) })} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button style={S.btn()} onClick={save}>
            {editId ? 'Save Changes' : 'Add Boat'}
          </button>
          {editId && (
            <button style={S.btn('#64748b')} onClick={cancel}>Cancel</button>
          )}
        </div>
      </div>

      <div>
        {boats.length === 0 && (
          <p style={{ textAlign: 'center', color: '#94a3b8', marginTop: 32 }}>
            No boats yet — add one above.
          </p>
        )}
        {boats.map((boat) => (
          <div key={boat.id} style={S.boatItem}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={S.boatName}>
                  {boat.name}
                  <span style={S.chip('#1d4ed8')}>{boat.boatClass}</span>
                </div>
                <div style={S.boatMeta}>
                  {boat.lengthM}m × {boat.widthM}m &nbsp;·&nbsp; {boat.weightKg} kg
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => startEdit(boat)}
                  style={{ background: 'none', border: '1px solid #cbd5e1', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 13 }}
                >
                  Edit
                </button>
                <button
                  onClick={() => removeBoat(boat.id)}
                  style={{ background: 'none', border: '1px solid #fca5a5', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 13, color: '#dc2626' }}
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
