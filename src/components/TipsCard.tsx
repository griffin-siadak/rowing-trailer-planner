import { useState } from 'react';

// Collapsible per-tab "how to use this" card. Open/closed state persists per
// tab id, and it starts expanded the first time a user ever sees it.
export default function TipsCard({ id, title = 'Tips', tips, floating = false }: {
  id: string;
  title?: string;
  tips: (string | React.ReactNode)[];
  floating?: boolean;
}) {
  const key = `rtp-tips-${id}`;
  const [open, setOpen] = useState(() => localStorage.getItem(key) !== 'closed');
  const toggle = () => {
    setOpen(o => {
      localStorage.setItem(key, o ? 'closed' : 'open');
      return !o;
    });
  };

  return (
    <div style={{
      background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10,
      marginBottom: floating ? 0 : 12, overflow: 'hidden', fontSize: 13,
      boxShadow: floating ? '0 2px 10px rgba(0,0,0,0.18)' : undefined,
    }}>
      <button
        onClick={toggle}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 12px', background: 'none', border: 'none',
          cursor: 'pointer', fontWeight: 700, fontSize: 13, color: '#92400e',
        }}
      >
        <span>💡</span> {title}
        <span style={{ marginLeft: 'auto', color: '#d97706', fontSize: 11 }}>{open ? '▲ hide' : '▼ show'}</span>
      </button>
      {open && (
        <ul style={{ margin: 0, padding: '0 14px 10px 28px', color: '#78350f', lineHeight: 1.55 }}>
          {tips.map((t, i) => <li key={i} style={{ marginBottom: 3 }}>{t}</li>)}
        </ul>
      )}
    </div>
  );
}
