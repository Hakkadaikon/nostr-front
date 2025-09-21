import { ReactNode, useState } from 'react';

export function Tabs({ tabs }: { tabs: { key: string; title: string; content: ReactNode }[] }) {
  const [active, setActive] = useState(tabs[0]?.key);
  const current = tabs.find(t => t.key === active) || tabs[0];
  return (
    <div>
      <div className="mb-2 flex gap-2 border-b">
        {tabs.map(t => (
          <button key={t.key} className={`px-2 py-1 ${t.key === active ? 'border-b-2 border-blue-600' : ''}`} onClick={() => setActive(t.key)}>
            {t.title}
          </button>
        ))}
      </div>
      <div>{current?.content}</div>
    </div>
  );
}
