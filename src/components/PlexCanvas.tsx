import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { PlexCanvasProps, PlexNode, NodePosition } from '../types';
import { resolveTheme } from '../themes';
import { computeLayout } from '../layout/plex-layout';
import { drawEdges } from '../canvas/edge-renderer';
import { animateEdges } from '../canvas/animation';
import { useCanvasSize } from '../hooks/use-canvas-size';
import { useNodeMeasures } from '../hooks/use-node-measures';
import { PlexNodePill } from './PlexNodePill';
import { PlexBreadcrumb } from './PlexBreadcrumb';

function buildTrail(nodes: PlexNode[], activeId: string): PlexNode[] {
  const trail: PlexNode[] = [];
  let currentId: string | undefined = activeId;

  while (currentId) {
    const node = nodes.find((n) => n.id === currentId);
    if (!node) break;
    trail.unshift(node);
    const parent = nodes.find((n) => n.children?.includes(currentId!));
    currentId = parent?.id;
  }

  return trail;
}

export const PlexCanvas: React.FC<PlexCanvasProps> = ({
  nodes,
  activeId,
  onNavigate,
  theme: themeProp,
  edgeStyle = 'waterfall',
  nodeRenderer: CustomNode,
  className,
  style,
  onNodeHover,
}) => {
  const theme = resolveTheme(themeProp);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cancelAnimRef = useRef<(() => void) | null>(null);
  const prevActiveRef = useRef<string>(activeId);
  const { width, height } = useCanvasSize(containerRef);
  const { rects, remeasure } = useNodeMeasures(containerRef);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Compute layout positions
  const layout = computeLayout({
    nodes,
    activeId,
    containerWidth: width,
    containerHeight: height,
  });

  // Build breadcrumb trail
  const trail = buildTrail(nodes, activeId);

  // Build a map of id -> position for quick lookup
  const positionMap = new Map<string, NodePosition>();
  for (const pos of layout.positions) {
    positionMap.set(pos.id, pos);
  }

  // Remeasure nodes after positions change
  const nodeIds = layout.positions.map((p) => p.id);
  useEffect(() => {
    if (width === 0 || height === 0) return;
    const timer = setTimeout(() => {
      remeasure(nodeIds);
    }, 50);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, width, height, nodeIds.join(',')]);

  // Also remeasure after transitions complete
  useEffect(() => {
    if (width === 0 || height === 0) return;
    const timer = setTimeout(() => {
      remeasure(nodeIds);
    }, theme.transitionDuration + 50);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, width, height]);

  // Draw edges on canvas — animate on navigation, static on resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || rects.size === 0) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Cancel any running animation
    cancelAnimRef.current?.();

    const didNavigate = prevActiveRef.current !== activeId;
    prevActiveRef.current = activeId;

    if (didNavigate) {
      // Animate edge reveal on navigation
      cancelAnimRef.current = animateEdges({
        ctx,
        edges: layout.edges,
        nodeRects: rects,
        theme,
        edgeStyle,
        dpr,
        duration: theme.transitionDuration,
      });
    } else {
      // Static draw (resize, initial render)
      drawEdges({
        ctx,
        edges: layout.edges,
        nodeRects: rects,
        theme,
        edgeStyle,
        dpr,
      });
    }

    return () => {
      cancelAnimRef.current?.();
    };
  }, [rects, layout.edges, theme, edgeStyle, width, height, activeId]);

  const handleHover = useCallback(
    (id: string | null) => {
      setHoveredId(id);
      onNodeHover?.(id);
    },
    [onNodeHover]
  );

  // Responsive: detect small container
  const isCompact = width > 0 && width < 480;

  if (width === 0 || height === 0) {
    return (
      <div
        ref={containerRef}
        className={className}
        style={{
          width: '100%',
          height: '100%',
          minHeight: 300,
          position: 'relative',
          ...style,
        }}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        width: '100%',
        height: '100%',
        minHeight: 300,
        position: 'relative',
        overflow: 'hidden',
        background: theme.background,
        fontSize: isCompact ? '0.85em' : undefined,
        ...style,
      }}
    >
      {/* Breadcrumb navigation */}
      <PlexBreadcrumb trail={trail} onNavigate={onNavigate} theme={theme} />

      {/* Canvas edge layer */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 1,
          pointerEvents: 'none',
        }}
      />

      {/* DOM node layer */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 2,
        }}
      >
        {layout.positions.map((pos) => {
          const node = nodes.find((n) => n.id === pos.id);
          if (!node) return null;

          if (CustomNode) {
            return (
              <div
                key={pos.id}
                data-plex-node={pos.id}
                style={{
                  position: 'absolute',
                  left: pos.x,
                  top: pos.y,
                  transform: 'translate(-50%, -50%)',
                  transition: `all ${theme.transitionDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
                }}
              >
                <CustomNode
                  node={node}
                  role={pos.role}
                  isHovered={hoveredId === pos.id}
                  onClick={() => onNavigate(pos.id)}
                  onMouseEnter={() => handleHover(pos.id)}
                  onMouseLeave={() => handleHover(null)}
                />
              </div>
            );
          }

          return (
            <PlexNodePill
              key={pos.id}
              node={node}
              role={pos.role}
              x={pos.x}
              y={pos.y}
              theme={theme}
              isHovered={hoveredId === pos.id}
              onClick={() => onNavigate(pos.id)}
              onMouseEnter={() => handleHover(pos.id)}
              onMouseLeave={() => handleHover(null)}
            />
          );
        })}
      </div>
    </div>
  );
};
