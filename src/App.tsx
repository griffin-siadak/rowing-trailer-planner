import { useState } from 'react';
import TrailerSetup from './pages/TrailerSetup';
import BoatRoster from './pages/BoatRoster';
import Layout from './pages/Layout';
import Visualizer3D from './pages/Visualizer3D';

type Tab = 'layout' | 'boats' | 'trailer' | '3d';

const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: 'layout', label: 'Layout', icon: '🚣' },
  { id: 'boats', label: 'Boats', icon: '⛵' },
  { id: '3d', label: '3D View', icon: '🧊' },
  { id: 'trailer', label: 'Trailer', icon: '🚛' },
];

export default function App() {
  const [tab, setTab] = useState<Tab>('layout');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f1f5f9' }}>
      <header style={{ background: '#1e40af', color: 'white', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 22 }}>🚣</span>
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600, letterSpacing: '-0.3px' }}>Trailer Planner</h1>
      </header>

      <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {tab === 'layout'  && <Layout />}
        {tab === 'boats'   && <BoatRoster />}
        {tab === '3d'      && <Visualizer3D />}
        {tab === 'trailer' && <TrailerSetup />}
      </main>

      <nav style={{ background: 'white', borderTop: '1px solid #e2e8f0', display: 'flex', flexShrink: 0 }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '8px 4px',
              fontSize: 12,
              gap: 2,
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              color: tab === t.id ? '#1d4ed8' : '#64748b',
              fontWeight: tab === t.id ? 600 : 400,
            }}
          >
            <span style={{ fontSize: 22, lineHeight: 1 }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
