import type { EdgeDef, NodeRect, PlexTheme } from '../types';

interface DrawEdgesInput {
  ctx: CanvasRenderingContext2D;
  edges: EdgeDef[];
  nodeRects: Map<string, NodeRect>;
  theme: PlexTheme;
  edgeStyle: 'waterfall' | 'scurve' | 'straight';
  dpr: number;
}

export function drawEdges(input: DrawEdgesInput): void {
  const { ctx, edges, nodeRects, theme, edgeStyle, dpr } = input;

  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.save();
  ctx.scale(dpr, dpr);

  for (const edge of edges) {
    const sourceRect = nodeRects.get(edge.sourceId);
    const targetRect = nodeRects.get(edge.targetId);
    if (!sourceRect || !targetRect) continue;

    // Source: bottom-center of the source pill
    const sx = sourceRect.left + sourceRect.width / 2;
    const sy = sourceRect.top + sourceRect.height;

    // Target: top-center of the target pill
    const tx = targetRect.left + targetRect.width / 2;
    const ty = targetRect.top;

    const color =
      edge.type === 'parent' ? theme.edgeParentColor : theme.edgeColor;

    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = theme.edgeWidth;
    ctx.lineCap = 'round';

    if (edgeStyle === 'straight') {
      ctx.moveTo(sx, sy);
      ctx.lineTo(tx, ty);
    } else if (edgeStyle === 'scurve') {
      const midY = (sy + ty) / 2;
      ctx.moveTo(sx, sy);
      ctx.bezierCurveTo(sx, midY, tx, midY, tx, ty);
    } else {
      // Waterfall: CP1 drops 70% straight down from source, CP2 30% above target
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

  ctx.restore();
}
