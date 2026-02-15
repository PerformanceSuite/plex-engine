import type { PlexNode, NodePosition, EdgeDef } from '../types';

interface LayoutInput {
  nodes: PlexNode[];
  activeId: string;
  containerWidth: number;
  containerHeight: number;
}

interface LayoutResult {
  positions: NodePosition[];
  edges: EdgeDef[];
}

function findParent(nodes: PlexNode[], activeId: string): PlexNode | undefined {
  return nodes.find((n) => n.children?.includes(activeId));
}

function getNode(nodes: PlexNode[], id: string): PlexNode | undefined {
  return nodes.find((n) => n.id === id);
}

export function computeLayout(input: LayoutInput): LayoutResult {
  const { nodes, activeId, containerWidth, containerHeight } = input;
  const positions: NodePosition[] = [];
  const edges: EdgeDef[] = [];

  const active = getNode(nodes, activeId);
  if (!active) return { positions, edges };

  const centerX = containerWidth / 2;

  // Active node: centered, ~42% from top
  const activeY = containerHeight * 0.42;
  positions.push({ id: active.id, x: centerX, y: activeY, role: 'active' });

  // Parent node: centered above active, ~18% from top
  const parent = findParent(nodes, activeId);
  if (parent) {
    const parentY = containerHeight * 0.15;
    positions.push({ id: parent.id, x: centerX, y: parentY, role: 'parent' });
    edges.push({ sourceId: parent.id, targetId: active.id, type: 'parent' });
  }

  // Children: spread horizontally below active, ~72% from top
  const childIds = active.children ?? [];
  const childNodes = childIds
    .map((id) => getNode(nodes, id))
    .filter((n): n is PlexNode => n !== undefined);

  if (childNodes.length > 0) {
    const childY = containerHeight * 0.72;
    const maxSpread = containerWidth * 0.85;
    const totalSpread = Math.min(
      maxSpread,
      childNodes.length * 160
    );
    const startX = centerX - totalSpread / 2;
    const gap =
      childNodes.length === 1 ? 0 : totalSpread / (childNodes.length - 1);

    childNodes.forEach((child, i) => {
      const childX =
        childNodes.length === 1 ? centerX : startX + gap * i;
      positions.push({ id: child.id, x: childX, y: childY, role: 'child' });
      edges.push({ sourceId: active.id, targetId: child.id, type: 'child' });
    });
  }

  return { positions, edges };
}
