import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { PlexCanvasProps, PlexNode, NodeRect, EdgeDef } from '../types';
import { resolveTheme } from '../themes';
import { computeLayout } from '../layout/plex-layout';
import { drawEdges } from '../canvas/edge-renderer';
import { useCanvasSize } from '../hooks/use-canvas-size';
import { useAnimationLoop } from '../animation/use-animation-loop';
import type { AnimatedNode } from '../animation/use-animation-loop';
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

/**
 * Draw edges with per-edge alpha support for enter/exit fading.
 * Edges touching exiting nodes fade out; edges touching entering nodes fade in.
 */
function drawEdgesWithAlpha(
  ctx: CanvasRenderingContext2D,
  edges: EdgeDef[],
  nodeRects: Map<string, NodeRect>,
  theme: ReturnType<typeof resolveTheme>,
  edgeStyle: 'waterfall' | 'scurve' | 'straight',
  dpr: number,
  nodeAlphas: Map<string, number>
) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.save();
  ctx.scale(dpr, dpr);

  for (const edge of edges) {
    const sourceRect = nodeRects.get(edge.sourceId);
    const targetRect = nodeRects.get(edge.targetId);
    if (!sourceRect || !targetRect) continue;

    // Edge alpha = minimum of the two connected nodes' alpha
    const srcAlpha = nodeAlphas.get(edge.sourceId) ?? 1;
    const tgtAlpha = nodeAlphas.get(edge.targetId) ?? 1;
    const edgeAlpha = Math.min(srcAlpha, tgtAlpha);
    if (edgeAlpha <= 0.01) continue;

    const sx = sourceRect.left + sourceRect.width / 2;
    const sy = sourceRect.top + sourceRect.height;
    const tx = targetRect.left + targetRect.width / 2;
    const ty = targetRect.top;

    const color =
      edge.type === 'parent' ? theme.edgeParentColor : theme.edgeColor;

    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = theme.edgeWidth;
    ctx.lineCap = 'round';
    ctx.globalAlpha = edgeAlpha;

    if (edgeStyle === 'straight') {
      ctx.moveTo(sx, sy);
      ctx.lineTo(tx, ty);
    } else if (edgeStyle === 'scurve') {
      const midY = (sy + ty) / 2;
      ctx.moveTo(sx, sy);
      ctx.bezierCurveTo(sx, midY, tx, midY, tx, ty);
    } else {
      const dy = ty - sy;
      const cp1x = sx;
      const cp1y = sy + dy * 0.7;
      const cp2x = tx;
      const cp2y = ty - dy * 0.3;
      ctx.moveTo(sx, sy);
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, tx, ty);
    }

    ctx.stroke();
  }

  ctx.globalAlpha = 1;
  ctx.restore();
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
  const nodeRefsMap = useRef<Map<string, HTMLDivElement>>(new Map());
  const prevActiveRef = useRef<string>(activeId);
  const isFirstRender = useRef(true);
  const { width, height } = useCanvasSize(containerRef);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Visible nodes: current layout + exiting nodes during animation
  const [visibleNodes, setVisibleNodes] = useState<AnimatedNode[]>([]);
  const isAnimating = useRef(false);

  const { startAnimation, snapTo, cancel, cacheDimensions } = useAnimationLoop();

  // Compute layout positions
  const layout = computeLayout({
    nodes,
    activeId,
    containerWidth: width,
    containerHeight: height,
  });

  // Build breadcrumb trail
  const trail = buildTrail(nodes, activeId);

  // Measure all visible node DOM elements and cache their dimensions
  const measureAndCache = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const containerRect = container.getBoundingClientRect();

    for (const [id, el] of nodeRefsMap.current) {
      const rect = el.getBoundingClientRect();
      cacheDimensions(id, rect.width, rect.height);
    }
  }, [cacheDimensions]);

  // Ref callback to capture node DOM elements
  const setNodeRef = useCallback((id: string, el: HTMLDivElement | null) => {
    if (el) {
      nodeRefsMap.current.set(id, el);
    } else {
      nodeRefsMap.current.delete(id);
    }
  }, []);

  // Helper: set canvas size and return context
  const prepareCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext('2d');
    return ctx ? { ctx, dpr } : null;
  }, [width, height]);

  // Initial render: snap to positions immediately (no animation)
  useEffect(() => {
    if (width === 0 || height === 0) return;

    if (isFirstRender.current) {
      isFirstRender.current = false;

      // Set initial visible nodes from layout
      const initial: AnimatedNode[] = layout.positions.map((p) => ({
        id: p.id,
        x: p.x,
        y: p.y,
        opacity: 1,
        scale: 1,
        role: p.role,
      }));
      setVisibleNodes(initial);

      // Measure after DOM paints, then snap + draw edges
      requestAnimationFrame(() => {
        measureAndCache();

        snapTo(layout.positions, (rects) => {
          const canvasCtx = prepareCanvas();
          if (canvasCtx) {
            drawEdges({
              ctx: canvasCtx.ctx,
              edges: layout.edges,
              nodeRects: rects,
              theme,
              edgeStyle,
              dpr: canvasCtx.dpr,
            });
          }
        });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height]);

  // On activeId change: run unified animation
  useEffect(() => {
    if (width === 0 || height === 0) return;
    if (isFirstRender.current) return; // handled above

    const didNavigate = prevActiveRef.current !== activeId;
    prevActiveRef.current = activeId;

    if (!didNavigate) {
      // Resize / data change — no animation, just snap
      const snapped: AnimatedNode[] = layout.positions.map((p) => ({
        id: p.id,
        x: p.x,
        y: p.y,
        opacity: 1,
        scale: 1,
        role: p.role,
      }));
      setVisibleNodes(snapped);

      requestAnimationFrame(() => {
        measureAndCache();
        snapTo(layout.positions, (rects) => {
          const canvasCtx = prepareCanvas();
          if (canvasCtx) {
            drawEdges({
              ctx: canvasCtx.ctx,
              edges: layout.edges,
              nodeRects: rects,
              theme,
              edgeStyle,
              dpr: canvasCtx.dpr,
            });
          }
        });
      });
      return;
    }

    // Navigation: animate!
    isAnimating.current = true;

    // We need the entering nodes in the DOM before we can animate.
    // Set visible nodes to include all current layout positions (entering nodes start invisible).
    const allAnimNodes: AnimatedNode[] = layout.positions.map((p) => ({
      id: p.id,
      x: p.x,
      y: p.y,
      opacity: 0, // will be set by animation frame callbacks
      scale: 0.85,
      role: p.role,
    }));
    setVisibleNodes(allAnimNodes);

    // Wait one frame for new nodes to mount in DOM, then measure and start animation
    requestAnimationFrame(() => {
      measureAndCache();

      const canvasCtx = prepareCanvas();
      if (!canvasCtx) return;

      // Collect all edges: include both new layout edges and any edges
      // for exiting nodes (so they fade out)
      const allEdges = layout.edges;

      startAnimation(
        layout.positions,
        allEdges,
        theme.transitionDuration,
        // onFrame
        (animNodes, rects, edges, _progress) => {
          // Update node positions and opacity directly via DOM refs (no setState)
          for (const an of animNodes) {
            const el = nodeRefsMap.current.get(an.id);
            if (!el) continue;
            el.style.left = `${an.x}px`;
            el.style.top = `${an.y}px`;
            el.style.opacity = String(an.opacity);
            // Preserve hover scale if needed, otherwise apply animation scale
            if (an.scale !== 1) {
              el.style.transform = `translate(-50%, -50%) scale(${an.scale})`;
            }
          }

          // Draw edges in sync
          const nodeAlphas = new Map<string, number>();
          for (const an of animNodes) {
            nodeAlphas.set(an.id, an.opacity);
          }
          drawEdgesWithAlpha(
            canvasCtx.ctx,
            edges,
            rects,
            theme,
            edgeStyle,
            canvasCtx.dpr,
            nodeAlphas
          );
        },
        // onComplete
        () => {
          isAnimating.current = false;

          // Set final visible nodes (only current layout, no exiting nodes)
          const finalNodes: AnimatedNode[] = layout.positions.map((p) => ({
            id: p.id,
            x: p.x,
            y: p.y,
            opacity: 1,
            scale: 1,
            role: p.role,
          }));
          setVisibleNodes(finalNodes);

          // Restore opacity and transform on DOM elements
          for (const p of layout.positions) {
            const el = nodeRefsMap.current.get(p.id);
            if (!el) continue;
            el.style.opacity = '1';
            el.style.transform = 'translate(-50%, -50%)';
          }

          // Final edge draw with real measurements
          measureAndCache();
          snapTo(layout.positions, (rects) => {
            const finalCtx = prepareCanvas();
            if (finalCtx) {
              drawEdges({
                ctx: finalCtx.ctx,
                edges: layout.edges,
                nodeRects: rects,
                theme,
                edgeStyle,
                dpr: finalCtx.dpr,
              });
            }
          });
        }
      );
    });

    return () => {
      cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, width, height]);

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

  // Determine which nodes to render: use visibleNodes if available, else layout positions
  const renderNodes =
    visibleNodes.length > 0
      ? visibleNodes
      : layout.positions.map((p) => ({
          id: p.id,
          x: p.x,
          y: p.y,
          opacity: 1,
          scale: 1,
          role: p.role,
        }));

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
        {renderNodes.map((pos) => {
          const node = nodes.find((n) => n.id === pos.id);
          if (!node) return null;

          if (CustomNode) {
            return (
              <div
                key={pos.id}
                ref={(el) => setNodeRef(pos.id, el)}
                data-plex-node={pos.id}
                style={{
                  position: 'absolute',
                  left: pos.x,
                  top: pos.y,
                  transform: 'translate(-50%, -50%)',
                  opacity: pos.opacity,
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
              ref={(el) => setNodeRef(pos.id, el)}
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
