import type { EdgeDef, NodeRect, PlexTheme } from '../types';

interface AnimateEdgesInput {
  ctx: CanvasRenderingContext2D;
  edges: EdgeDef[];
  nodeRects: Map<string, NodeRect>;
  theme: PlexTheme;
  edgeStyle: 'waterfall' | 'scurve' | 'straight';
  dpr: number;
  duration: number;
  onComplete?: () => void;
}

function getEdgePath(
  edge: EdgeDef,
  nodeRects: Map<string, NodeRect>,
  edgeStyle: 'waterfall' | 'scurve' | 'straight'
): { sx: number; sy: number; tx: number; ty: number; cp1x: number; cp1y: number; cp2x: number; cp2y: number; isCurve: boolean } | null {
  const sourceRect = nodeRects.get(edge.sourceId);
  const targetRect = nodeRects.get(edge.targetId);
  if (!sourceRect || !targetRect) return null;

  const sx = sourceRect.left + sourceRect.width / 2;
  const sy = sourceRect.top + sourceRect.height;
  const tx = targetRect.left + targetRect.width / 2;
  const ty = targetRect.top;

  if (edgeStyle === 'straight') {
    return { sx, sy, tx, ty, cp1x: sx, cp1y: sy, cp2x: tx, cp2y: ty, isCurve: false };
  } else if (edgeStyle === 'scurve') {
    const midY = (sy + ty) / 2;
    return { sx, sy, tx, ty, cp1x: sx, cp1y: midY, cp2x: tx, cp2y: midY, isCurve: true };
  } else {
    const dy = ty - sy;
    return {
      sx, sy, tx, ty,
      cp1x: sx, cp1y: sy + dy * 0.7,
      cp2x: tx, cp2y: ty - dy * 0.3,
      isCurve: true,
    };
  }
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function animateEdges(input: AnimateEdgesInput): () => void {
  const { ctx, edges, nodeRects, theme, edgeStyle, dpr, duration, onComplete } = input;
  let animId = 0;
  const startTime = performance.now();

  function draw(now: number) {
    const elapsed = now - startTime;
    const rawProgress = Math.min(elapsed / duration, 1);
    const progress = easeOutCubic(rawProgress);

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.save();
    ctx.scale(dpr, dpr);

    for (const edge of edges) {
      const path = getEdgePath(edge, nodeRects, edgeStyle);
      if (!path) continue;

      const color = edge.type === 'parent' ? theme.edgeParentColor : theme.edgeColor;

      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = theme.edgeWidth;
      ctx.lineCap = 'round';

      if (!path.isCurve) {
        // Straight line: interpolate endpoint
        const ex = path.sx + (path.tx - path.sx) * progress;
        const ey = path.sy + (path.ty - path.sy) * progress;
        ctx.moveTo(path.sx, path.sy);
        ctx.lineTo(ex, ey);
      } else {
        // Use setLineDash to reveal the curve progressively
        // First draw the full path to measure it
        ctx.moveTo(path.sx, path.sy);
        ctx.bezierCurveTo(path.cp1x, path.cp1y, path.cp2x, path.cp2y, path.tx, path.ty);

        // Approximate total path length
        const totalLen = approximateBezierLength(
          path.sx, path.sy, path.cp1x, path.cp1y,
          path.cp2x, path.cp2y, path.tx, path.ty
        );
        const visibleLen = totalLen * progress;
        ctx.setLineDash([visibleLen, totalLen - visibleLen]);
        ctx.lineDashOffset = 0;
      }

      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.restore();

    if (rawProgress < 1) {
      animId = requestAnimationFrame(draw);
    } else {
      onComplete?.();
    }
  }

  animId = requestAnimationFrame(draw);

  return () => cancelAnimationFrame(animId);
}

function approximateBezierLength(
  x0: number, y0: number,
  cp1x: number, cp1y: number,
  cp2x: number, cp2y: number,
  x1: number, y1: number,
  segments = 20
): number {
  let length = 0;
  let prevX = x0;
  let prevY = y0;

  for (let i = 1; i <= segments; i++) {
    const t = i / segments;
    const mt = 1 - t;
    const x = mt * mt * mt * x0 + 3 * mt * mt * t * cp1x + 3 * mt * t * t * cp2x + t * t * t * x1;
    const y = mt * mt * mt * y0 + 3 * mt * mt * t * cp1y + 3 * mt * t * t * cp2y + t * t * t * y1;
    length += Math.hypot(x - prevX, y - prevY);
    prevX = x;
    prevY = y;
  }

  return length;
}
