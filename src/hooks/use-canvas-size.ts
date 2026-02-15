import { useState, useEffect, useCallback } from 'react';

interface ContainerSize {
  width: number;
  height: number;
}

export function useCanvasSize(
  containerRef: React.RefObject<HTMLElement | null>
): ContainerSize {
  const [size, setSize] = useState<ContainerSize>({ width: 0, height: 0 });

  const measure = useCallback(() => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    setSize((prev) => {
      if (prev.width === clientWidth && prev.height === clientHeight)
        return prev;
      return { width: clientWidth, height: clientHeight };
    });
  }, [containerRef]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    measure();

    const observer = new ResizeObserver(() => {
      measure();
    });
    observer.observe(el);

    return () => observer.disconnect();
  }, [containerRef, measure]);

  return size;
}
