import { useRef, useCallback } from 'react';
import type { NodePosition, NodeRect, EdgeDef } from '../types';

/** Per-node animation snapshot: position + opacity */
export interface AnimatedNode {
  id: string;
  x: number;
  y: number;
  opacity: number;
  scale: number;
  role: 'active' | 'parent' | 'child';
}

interface NodeAnim {
  from: { x: number; y: number };
  to: { x: number; y: number };
  role: 'active' | 'parent' | 'child';
  kind: 'moving' | 'entering' | 'exiting';
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Unified animation loop hook.
 *
 * Returns `startAnimation` — call it when activeId changes. It drives a single
 * rAF loop that interpolates node positions, computes edge connection rects,
 * and calls back with both every frame so the consumer can paint them in sync.
 */
export function useAnimationLoop() {
  const animRef = useRef<number>(0);
  const animMapRef = useRef<Map<string, NodeAnim>>(new Map());
  const prevPositionsRef = useRef<Map<string, { x: number; y: number; role: 'active' | 'parent' | 'child' }>>(new Map());
  const dimCacheRef = useRef<Map<string, { width: number; height: number }>>(new Map());

  /** Cache a node's measured width/height (call once after mount/remeasure) */
  const cacheDimensions = useCallback((id: string, width: number, height: number) => {
    dimCacheRef.current.set(id, { width, height });
  }, []);

  /** Provide a fallback dimension for nodes we haven't measured yet */
  const getDim = (id: string) => dimCacheRef.current.get(id) ?? { width: 120, height: 36 };

  /**
   * Compute a NodeRect from an interpolated center position, using cached dims.
   * Nodes use transform translate(-50%,-50%) so left/top = center - dim/2.
   */
  const toRect = (id: string, cx: number, cy: number): NodeRect => {
    const dim = getDim(id);
    return {
      id,
      left: cx - dim.width / 2,
      top: cy - dim.height / 2,
      width: dim.width,
      height: dim.height,
    };
  };

  /**
   * Start (or restart) the animation loop.
   *
   * @param newPositions   – positions from computeLayout for the NEW activeId
   * @param duration       – transition ms
   * @param onFrame        – called every rAF frame with interpolated nodes & rects
   * @param onComplete     – called when animation finishes
   */
  const startAnimation = useCallback(
    (
      newPositions: NodePosition[],
      newEdges: EdgeDef[],
      duration: number,
      onFrame: (nodes: AnimatedNode[], rects: Map<string, NodeRect>, edges: EdgeDef[], progress: number) => void,
      onComplete: () => void
    ) => {
      // Cancel any running animation
      cancelAnimationFrame(animRef.current);

      const prev = prevPositionsRef.current;
      const anims = new Map<string, NodeAnim>();

      const newIds = new Set(newPositions.map((p) => p.id));

      // Classify nodes
      for (const pos of newPositions) {
        const old = prev.get(pos.id);
        if (old) {
          // Moving node — animate from old pos to new pos
          anims.set(pos.id, {
            from: { x: old.x, y: old.y },
            to: { x: pos.x, y: pos.y },
            role: pos.role,
            kind: 'moving',
          });
        } else {
          // Entering node — start at target pos with opacity 0
          anims.set(pos.id, {
            from: { x: pos.x, y: pos.y },
            to: { x: pos.x, y: pos.y },
            role: pos.role,
            kind: 'entering',
          });
        }
      }

      // Exiting nodes — old nodes not in new layout
      for (const [id, old] of prev) {
        if (!newIds.has(id)) {
          anims.set(id, {
            from: { x: old.x, y: old.y },
            to: { x: old.x, y: old.y },
            role: old.role,
            kind: 'exiting',
          });
        }
      }

      animMapRef.current = anims;

      const startTime = performance.now();

      function tick(now: number) {
        const elapsed = now - startTime;
        const rawProgress = Math.min(elapsed / duration, 1);
        const eased = easeOutCubic(rawProgress);

        const animatedNodes: AnimatedNode[] = [];
        const rects = new Map<string, NodeRect>();

        for (const [id, anim] of anims) {
          const x = anim.from.x + (anim.to.x - anim.from.x) * eased;
          const y = anim.from.y + (anim.to.y - anim.from.y) * eased;

          let opacity = 1;
          let scale = 1;

          if (anim.kind === 'entering') {
            opacity = eased;
            scale = 0.85 + 0.15 * eased; // 0.85 → 1
          } else if (anim.kind === 'exiting') {
            opacity = 1 - eased;
            scale = 1 - 0.1 * eased; // 1 → 0.9
          }

          animatedNodes.push({ id, x, y, opacity, scale, role: anim.role });
          rects.set(id, toRect(id, x, y));
        }

        onFrame(animatedNodes, rects, newEdges, eased);

        if (rawProgress < 1) {
          animRef.current = requestAnimationFrame(tick);
        } else {
          // Store final positions for next transition
          const final = new Map<string, { x: number; y: number; role: 'active' | 'parent' | 'child' }>();
          for (const pos of newPositions) {
            final.set(pos.id, { x: pos.x, y: pos.y, role: pos.role });
          }
          prevPositionsRef.current = final;
          onComplete();
        }
      }

      animRef.current = requestAnimationFrame(tick);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  /** Immediately snap to positions with no animation (initial render / resize). */
  const snapTo = useCallback(
    (
      positions: NodePosition[],
      onSnap: (rects: Map<string, NodeRect>) => void
    ) => {
      cancelAnimationFrame(animRef.current);

      const posMap = new Map<string, { x: number; y: number; role: 'active' | 'parent' | 'child' }>();
      const rects = new Map<string, NodeRect>();

      for (const pos of positions) {
        posMap.set(pos.id, { x: pos.x, y: pos.y, role: pos.role });
        rects.set(pos.id, toRect(pos.id, pos.x, pos.y));
      }

      prevPositionsRef.current = posMap;
      onSnap(rects);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const cancel = useCallback(() => {
    cancelAnimationFrame(animRef.current);
  }, []);

  /** Get current interpolated positions so a rapid-click can capture them as "from". */
  const captureCurrentPositions = useCallback(() => {
    return new Map(prevPositionsRef.current);
  }, []);

  return { startAnimation, snapTo, cancel, cacheDimensions, captureCurrentPositions };
}
