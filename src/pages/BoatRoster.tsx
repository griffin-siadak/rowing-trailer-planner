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
const CLASS_ORDER = ['8+', '4+', '4-', '4x', '2-', '2x', '1x'];

function emptyForm() {
  return { name: '', boatClass: '1x', lengthM: 8.2, widthM: 0.29, weightKg: 14, guest: false };
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
      guest:     form.guest,
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
      guest: !!boat.guest,
    });
  }

  function cancel() {
    setEditId(null);
    setForm(emptyForm());
  }

  // Group a boat list by class, ordered like the Layout tab boathouse
  function groupByClass(list: Boat[]) {
    const groups: Record<string, Boat[]> = {};
    for (const boat of list) {
      const cls = boat.boatClass ?? 'Other';
      (groups[cls] ??= []).push(boat);
    }
    const keys = [
      ...CLASS_ORDER.filter(c => groups[c]),
      ...Object.keys(groups).filter(c => !CLASS_ORDER.includes(c)),
    ];
    return { groups, keys };
  }

  const homeBoats  = boats.filter(b => !b.guest);
  const guestBoats = boats.filter(b => b.guest);

  function renderSection(title: string, list: Boat[], accent: string) {
    if (list.length === 0) return null;
    const { groups, keys } = groupByClass(list);
    return (
      <div style={{ marginBottom: 20 }}>
        <div style={{
          display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10,
          paddingBottom: 6, borderBottom: `2px solid ${accent}`,
        }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: '#1e293b' }}>{title}</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8' }}>{list.length} boats</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, paddingBottom: 8, alignItems: 'flex-start' }}>
          {keys.map(cls => (
            <div key={cls} style={{ flex: '1 1 260px', minWidth: 260 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#1e293b' }}>{cls}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8' }}>{groups[cls].length}</span>
              </div>
              {groups[cls].map(boat => (
                <div key={boat.id} style={S.boatItem}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ ...S.boatName, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {boat.name}
                      </div>
                      <div style={S.boatMeta}>
                        {boat.lengthM}m × {boat.widthM}m &nbsp;·&nbsp; {boat.weightKg} kg
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0, marginLeft: 8 }}>
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
          ))}
        </div>
      </div>
    );
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

        <div style={{ marginBottom: 10 }}>
          <label style={S.label}>Owner</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {([['Club', false], ['Guest', true]] as const).map(([lbl, val]) => (
              <button
                key={lbl}
                type="button"
                onClick={() => setForm({ ...form, guest: val })}
                style={{
                  flex: 1, padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
                  fontWeight: 600, fontSize: 14,
                  border: form.guest === val ? '2px solid #1d4ed8' : '1px solid #cbd5e1',
                  background: form.guest === val ? '#dbeafe' : 'white',
                  color: form.guest === val ? '#1d4ed8' : '#64748b',
                }}
              >
                {lbl}
              </button>
            ))}
          </div>
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

      {boats.length === 0 && (
        <p style={{ textAlign: 'center', color: '#94a3b8', marginTop: 32 }}>
          No boats yet — add one above.
        </p>
      )}

      {renderSection('🏠 Club Boats', homeBoats, '#1d4ed8')}
      {renderSection('👤 Guest Boats', guestBoats, '#d97706')}
    </div>
  );
}
