import React, { useState, useEffect, useRef } from 'react';
import type { PlexNode } from 'plex-engine';
import { PlexCanvas } from 'plex-engine';

const sampleNodes: PlexNode[] = [
  {
    id: 'proactiva',
    label: 'Proactiva',
    children: ['wander', 'atlas', 'sentinel', 'forge'],
    color: '#06b6d4',
  },
  {
    id: 'wander',
    label: 'Wander',
    children: ['wander-explore', 'wander-map', 'wander-journal'],
    color: '#8b5cf6',
    status: 'live',
  },
  {
    id: 'atlas',
    label: 'Atlas',
    children: ['atlas-search', 'atlas-index'],
    color: '#f59e0b',
    status: 'building',
  },
  {
    id: 'sentinel',
    label: 'Sentinel',
    children: ['sentinel-monitor', 'sentinel-alerts'],
    color: '#ef4444',
    status: 'coming-soon',
  },
  {
    id: 'forge',
    label: 'Forge',
    children: ['forge-build', 'forge-deploy'],
    color: '#10b981',
    status: 'coming-soon',
  },
  {
    id: 'wander-explore',
    label: 'Explore',
    color: '#8b5cf6',
  },
  {
    id: 'wander-map',
    label: 'Map View',
    color: '#8b5cf6',
  },
  {
    id: 'wander-journal',
    label: 'Journal',
    color: '#8b5cf6',
  },
  {
    id: 'atlas-search',
    label: 'Search',
    color: '#f59e0b',
  },
  {
    id: 'atlas-index',
    label: 'Index',
    color: '#f59e0b',
  },
  {
    id: 'sentinel-monitor',
    label: 'Monitor',
    color: '#ef4444',
  },
  {
    id: 'sentinel-alerts',
    label: 'Alerts',
    color: '#ef4444',
  },
  {
    id: 'forge-build',
    label: 'Build',
    color: '#10b981',
  },
  {
    id: 'forge-deploy',
    label: 'Deploy',
    color: '#10b981',
  },
];

const demoScript = [
  'proactiva',
  'wander',
  'wander-explore',
  'wander',
  'proactiva',
  'atlas',
  'atlas-search',
  'atlas',
  'proactiva',
  'sentinel',
  'proactiva',
  'forge',
  'forge-deploy',
  'forge',
  'proactiva',
];

export const App: React.FC = () => {
  const [activeId, setActiveId] = useState('proactiva');
  const [demoMode, setDemoMode] = useState(false);
  const demoIndex = useRef(0);

  useEffect(() => {
    if (!demoMode) return;
    demoIndex.current = 0;
    setActiveId(demoScript[0]);

    const interval = setInterval(() => {
      demoIndex.current = (demoIndex.current + 1) % demoScript.length;
      setActiveId(demoScript[demoIndex.current]);
    }, 1800);

    return () => clearInterval(interval);
  }, [demoMode]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <PlexCanvas
        nodes={sampleNodes}
        rootId="proactiva"
        activeId={activeId}
        onNavigate={(id) => {
          setDemoMode(false);
          setActiveId(id);
        }}
        theme="dark"
      />

      {/* Controls overlay */}
      <div
        style={{
          position: 'absolute',
          bottom: 16,
          right: 16,
          zIndex: 50,
          display: 'flex',
          gap: 8,
        }}
      >
        <button
          onClick={() => setDemoMode(!demoMode)}
          style={{
            padding: '6px 14px',
            borderRadius: 8,
            border: '1px solid rgba(6, 182, 212, 0.3)',
            background: demoMode
              ? 'rgba(6, 182, 212, 0.2)'
              : 'rgba(30, 41, 59, 0.8)',
            color: '#e2e8f0',
            cursor: 'pointer',
            fontSize: '0.8rem',
            fontFamily: "'Inter', system-ui, sans-serif",
            backdropFilter: 'blur(8px)',
          }}
        >
          {demoMode ? 'Stop Demo' : 'Auto Demo'}
        </button>
        <button
          onClick={() => {
            setDemoMode(false);
            setActiveId('proactiva');
          }}
          style={{
            padding: '6px 14px',
            borderRadius: 8,
            border: '1px solid rgba(71, 85, 105, 0.4)',
            background: 'rgba(30, 41, 59, 0.8)',
            color: '#94a3b8',
            cursor: 'pointer',
            fontSize: '0.8rem',
            fontFamily: "'Inter', system-ui, sans-serif",
            backdropFilter: 'blur(8px)',
          }}
        >
          Reset
        </button>
      </div>

      {/* Active node info */}
      <div
        style={{
          position: 'absolute',
          bottom: 16,
          left: 16,
          zIndex: 50,
          color: '#64748b',
          fontSize: '0.75rem',
          fontFamily: "'Inter', system-ui, sans-serif",
        }}
      >
        active: {activeId}
      </div>
    </div>
  );
};
