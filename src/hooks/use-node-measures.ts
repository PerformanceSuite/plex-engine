import { useState, useCallback, useRef } from 'react';
import type { NodeRect } from '../types';
import { measureNodes } from '../layout/measure';

export function useNodeMeasures(
  containerRef: React.RefObject<HTMLElement | null>
) {
  const [rects, setRects] = useState<Map<string, NodeRect>>(new Map());
  const frameRef = useRef<number>(0);

  const remeasure = useCallback(
    (nodeIds: string[]) => {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = requestAnimationFrame(() => {
        if (!containerRef.current) return;
        const measured = measureNodes(containerRef.current, nodeIds);
        setRects(measured);
      });
    },
    [containerRef]
  );

  return { rects, remeasure };
}
