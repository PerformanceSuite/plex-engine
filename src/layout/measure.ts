import type { NodeRect } from '../types';

export function measureNodes(
  containerEl: HTMLElement,
  nodeIds: string[]
): Map<string, NodeRect> {
  const rects = new Map<string, NodeRect>();
  const containerRect = containerEl.getBoundingClientRect();

  for (const id of nodeIds) {
    const el = containerEl.querySelector(`[data-plex-node="${id}"]`);
    if (!el) continue;

    const rect = el.getBoundingClientRect();
    rects.set(id, {
      id,
      top: rect.top - containerRect.top,
      left: rect.left - containerRect.left,
      width: rect.width,
      height: rect.height,
    });
  }

  return rects;
}
