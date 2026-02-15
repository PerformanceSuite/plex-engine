import React from 'react';
import type { PlexNode, PlexTheme } from '../types';

interface PlexNodePillProps {
  node: PlexNode;
  role: 'active' | 'parent' | 'child';
  x: number;
  y: number;
  theme: PlexTheme;
  isHovered: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export const PlexNodePill: React.FC<PlexNodePillProps> = ({
  node,
  role,
  x,
  y,
  theme,
  isHovered,
  onClick,
  onMouseEnter,
  onMouseLeave,
}) => {
  const isActive = role === 'active';
  const fontSize = isActive ? '1rem' : '0.85rem';

  const hoverScale = isHovered && !isActive ? 'translate(-50%, -50%) scale(1.05)' : 'translate(-50%, -50%)';
  const glowShadow = isActive
    ? `0 0 20px ${theme.nodeActiveBorder}, 0 0 40px ${theme.nodeActiveBorder.replace(/[\d.]+\)$/, '0.15)')}`
    : isHovered
      ? `0 0 12px ${theme.nodePassiveBorder}`
      : 'none';

  const style: React.CSSProperties = {
    position: 'absolute',
    left: x,
    top: y,
    transform: hoverScale,
    padding: isActive ? '10px 22px' : '7px 16px',
    borderRadius: '9999px',
    background: isActive ? theme.nodeActiveBg : theme.nodePassiveBg,
    color: isActive ? theme.nodeActiveText : theme.nodePassiveText,
    border: `1px solid ${isActive ? theme.nodeActiveBorder : theme.nodePassiveBorder}`,
    fontFamily: theme.fontFamily,
    fontSize,
    fontWeight: isActive ? 600 : 400,
    cursor: isActive ? 'default' : 'pointer',
    whiteSpace: 'nowrap',
    userSelect: 'none',
    transition: `all ${theme.transitionDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    boxShadow: glowShadow,
    zIndex: isActive ? 10 : 5,
  };

  return (
    <div
      data-plex-node={node.id}
      style={style}
      onClick={isActive ? undefined : onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      role={isActive ? undefined : 'button'}
      tabIndex={isActive ? undefined : 0}
      onKeyDown={
        isActive
          ? undefined
          : (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
      }
    >
      {node.color && (
        <span
          style={{
            display: 'inline-block',
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: node.color,
            marginRight: 8,
            verticalAlign: 'middle',
          }}
        />
      )}
      {node.label}
    </div>
  );
};
