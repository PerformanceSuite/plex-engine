import React from 'react';
import type { PlexNode, PlexTheme } from '../types';

interface PlexBreadcrumbProps {
  trail: PlexNode[];
  onNavigate: (nodeId: string) => void;
  theme: PlexTheme;
}

export const PlexBreadcrumb: React.FC<PlexBreadcrumbProps> = ({
  trail,
  onNavigate,
  theme,
}) => {
  if (trail.length <= 1) return null;

  return (
    <nav
      style={{
        position: 'absolute',
        top: 8,
        left: 12,
        zIndex: 20,
        display: 'flex',
        gap: 4,
        alignItems: 'center',
        fontFamily: theme.fontFamily,
        fontSize: '0.75rem',
        color: theme.nodePassiveText,
      }}
    >
      {trail.map((node, i) => (
        <React.Fragment key={node.id}>
          {i > 0 && <span style={{ opacity: 0.4 }}>/</span>}
          <button
            onClick={() => onNavigate(node.id)}
            style={{
              background: 'none',
              border: 'none',
              color: theme.nodePassiveText,
              cursor: 'pointer',
              padding: '2px 4px',
              borderRadius: 4,
              fontFamily: 'inherit',
              fontSize: 'inherit',
              opacity: i === trail.length - 1 ? 1 : 0.6,
            }}
          >
            {node.label}
          </button>
        </React.Fragment>
      ))}
    </nav>
  );
};
