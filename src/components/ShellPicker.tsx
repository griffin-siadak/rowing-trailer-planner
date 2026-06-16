import { useState, useMemo } from 'react';
import { MANUFACTURERS, getModels, filterByCrewWeight } from '../shellDatabase';
import type { ShellRecord } from '../shellDatabase';

interface Props {
  onAdd: (shell: ShellRecord, name: string) => void;
  onClose: () => void;
}

const CAT_COLORS: Record<string, string> = {
  racing: '#1d4ed8',
  recreational: '#16a34a',
  coastal: '#0891b2',
  adaptive: '#7c3aed',
  touring: '#d97706',
};

const S = {
  overlay: {
    position: 'fixed' as const, inset: 0, background: 'rgba(0,0,0,0.5)',
    zIndex: 100, display: 'flex', alignItems: 'flex-end',
  },
  sheet: {
    background: 'white', width: '100%', borderRadius: '16px 16px 0 0',
    maxHeight: '90vh', display: 'flex', flexDirection: 'column' as const,
    overflow: 'hidden',
  },
  header: {
    padding: '16px 16px 12px', borderBottom: '1px solid #e2e8f0',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  title: { margin: 0, fontSize: 17, fontWeight: 700, color: '#1e293b' },
  closeBtn: {
    background: '#f1f5f9', border: 'none', borderRadius: 99,
    width: 30, height: 30, cursor: 'pointer', fontSize: 16,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  body: { flex: 1, overflowY: 'auto' as const, padding: 16 },
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 },
  select: {
    width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1',
    borderRadius: 8, fontSize: 15, outline: 'none', background: 'white',
    boxSizing: 'border-box' as const, marginBottom: 12,
  },
  input: {
    width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1',
    borderRadius: 8, fontSize: 15, outline: 'none',
    boxSizing: 'border-box' as const, marginBottom: 12,
  },
  resultCard: {
    border: '1px solid #e2e8f0', borderRadius: 10, padding: 12, marginBottom: 8,
    cursor: 'pointer', background: '#f8fafc', transition: 'background 0.1s',
  },
  addBtn: {
    padding: '7px 14px', background: '#1d4ed8', color: 'white',
    border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 13, cursor: 'pointer',
  },
  chip: (color: string) => ({
    display: 'inline-block', background: color, color: 'white',
    borderRadius: 99, padding: '2px 8px', fontSize: 10, fontWeight: 700, marginRight: 4,
  }),
  nameInput: {
    width: '100%', padding: '8px 12px', border: '1px solid #93c5fd',
    borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' as const,
    marginTop: 8, background: '#eff6ff',
  },
  confirmBtn: {
    width: '100%', marginTop: 8, padding: '10px', background: '#1d4ed8',
    color: 'white', border: 'none', borderRadius: 8, fontWeight: 700,
    fontSize: 14, cursor: 'pointer',
  },
};

export default function ShellPicker({ onAdd, onClose }: Props) {
  const [manufacturer, setManufacturer] = useState('');
  const [crewWeight, setCrewWeight]     = useState('');
  const [selected, setSelected]         = useState<ShellRecord | null>(null);
  const [boatName, setBoatName]         = useState('');

  const models = useMemo(
    () => manufacturer ? getModels(manufacturer) : [],
    [manufacturer]
  );

  const results = useMemo(() => {
    const w = parseFloat(crewWeight);
    if (!manufacturer) return [];
    if (!isNaN(w) && w > 0) return filterByCrewWeight(models, w);
    return models;
  }, [models, crewWeight, manufacturer]);

  // Group results by boat_class
  const grouped = useMemo(() => {
    const map = new Map<string, ShellRecord[]>();
    for (const r of results) {
      if (!map.has(r.boatClass)) map.set(r.boatClass, []);
      map.get(r.boatClass)!.push(r);
    }
    return map;
  }, [results]);

  function selectShell(shell: ShellRecord) {
    setSelected(shell);
    setBoatName(shell.modelName);
  }

  function confirm() {
    if (!selected || !boatName.trim()) return;
    onAdd(selected, boatName.trim());
    onClose();
  }

  return (
    <div style={S.overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={S.sheet}>
        <div style={S.header}>
          <h2 style={S.title}>Add from Database</h2>
          <button style={S.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div style={S.body}>
          {/* Step 1: Manufacturer */}
          <label style={S.label}>1 · Manufacturer</label>
          <select
            style={S.select}
            value={manufacturer}
            onChange={e => { setManufacturer(e.target.value); setSelected(null); }}
          >
            <option value="">— choose —</option>
            {MANUFACTURERS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>

          {/* Step 2: Crew weight filter */}
          {manufacturer && (
            <>
              <label style={S.label}>
                2 · Avg crew weight per seat (kg) — leave blank to show all models
              </label>
              <input
                style={S.input}
                type="number"
                placeholder="e.g. 80"
                value={crewWeight}
                onChange={e => { setCrewWeight(e.target.value); setSelected(null); }}
              />
            </>
          )}

          {/* Step 3: Results */}
          {manufacturer && results.length === 0 && (
            <p style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', marginTop: 16 }}>
              No matching models. Try adjusting the weight or leaving it blank.
            </p>
          )}

          {[...grouped.entries()].map(([cls, shells]) => (
            <div key={cls} style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {cls}
              </div>
              {shells.map(shell => (
                <div
                  key={shell.id}
                  style={{
                    ...S.resultCard,
                    border: selected?.id === shell.id ? '2px solid #1d4ed8' : '1px solid #e2e8f0',
                    background: selected?.id === shell.id ? '#eff6ff' : '#f8fafc',
                  }}
                  onClick={() => selectShell(shell)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#1e293b', marginBottom: 3 }}>
                        {shell.modelName}
                      </div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>
                        <span style={S.chip(CAT_COLORS[shell.category] ?? '#64748b')}>{shell.category}</span>
                        {shell.lengthM}m
                        {shell.widthM ? ` · ${(shell.widthM * 100).toFixed(1)}cm wide` : ''}
                        {shell.hullWeightKg ? ` · ${shell.hullWeightKg}kg hull` : ''}
                      </div>
                      {(shell.crewMinKg || shell.crewMaxKg) && (
                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                          Crew: {shell.crewMinKg ?? '?'}–{shell.crewMaxKg ?? '?'} kg/seat
                        </div>
                      )}
                      {shell.notes && (
                        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2, fontStyle: 'italic' }}>
                          {shell.notes}
                        </div>
                      )}
                    </div>
                    <button
                      style={S.addBtn}
                      onClick={e => { e.stopPropagation(); selectShell(shell); }}
                    >
                      Select
                    </button>
                  </div>

                  {/* Inline name + confirm when selected */}
                  {selected?.id === shell.id && (
                    <div onClick={e => e.stopPropagation()}>
                      <input
                        style={S.nameInput}
                        placeholder="Boat name (e.g. Blue Arrow)"
                        value={boatName}
                        onChange={e => setBoatName(e.target.value)}
                        autoFocus
                      />
                      <button style={S.confirmBtn} onClick={confirm}>
                        Add to Roster ✓
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}

          <div style={{ height: 24 }} />
        </div>
      </div>
    </div>
  );
}
