export interface PlexNode {
  id: string;
  label: string;
  children?: string[];
  description?: string;
  status?: string;
  color?: string;
  icon?: string;
  data?: Record<string, unknown>;
}

export interface PlexTheme {
  background: string;
  edgeColor: string;
  edgeParentColor: string;
  edgeWidth: number;
  nodeActiveBg: string;
  nodeActiveText: string;
  nodeActiveBorder: string;
  nodePassiveBg: string;
  nodePassiveText: string;
  nodePassiveBorder: string;
  fontFamily: string;
  transitionDuration: number;
}

export interface NodePosition {
  id: string;
  x: number;
  y: number;
  role: 'active' | 'parent' | 'child';
}

export interface NodeRect {
  id: string;
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface EdgeDef {
  sourceId: string;
  targetId: string;
  type: 'parent' | 'child';
}

export interface PlexCanvasProps {
  nodes: PlexNode[];
  rootId: string;
  activeId: string;
  onNavigate: (nodeId: string) => void;
  theme?: 'dark' | 'light' | PlexTheme;
  edgeStyle?: 'waterfall' | 'scurve' | 'straight';
  nodeRenderer?: React.ComponentType<PlexNodeRenderProps>;
  className?: string;
  style?: React.CSSProperties;
  onNodeHover?: (nodeId: string | null) => void;
  onNodeContext?: (nodeId: string, e: React.MouseEvent) => void;
}

export interface PlexNodeRenderProps {
  node: PlexNode;
  role: 'active' | 'parent' | 'child';
  isHovered: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}
