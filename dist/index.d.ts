import React$1 from 'react';

interface PlexNode {
    id: string;
    label: string;
    children?: string[];
    description?: string;
    status?: string;
    color?: string;
    icon?: string;
    data?: Record<string, unknown>;
}
interface PlexTheme {
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
interface NodePosition {
    id: string;
    x: number;
    y: number;
    role: 'active' | 'parent' | 'child';
}
interface NodeRect {
    id: string;
    top: number;
    left: number;
    width: number;
    height: number;
}
interface EdgeDef {
    sourceId: string;
    targetId: string;
    type: 'parent' | 'child';
}
interface PlexCanvasProps {
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
interface PlexNodeRenderProps {
    node: PlexNode;
    role: 'active' | 'parent' | 'child';
    isHovered: boolean;
    onClick: () => void;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
}

declare const PlexCanvas: React$1.FC<PlexCanvasProps>;

interface PlexNodePillProps {
    node: PlexNode;
    role: 'active' | 'parent' | 'child';
    x: number;
    y: number;
    theme: PlexTheme;
    isHovered: boolean;
    onClick: () => void;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
}
declare const PlexNodePill: React$1.FC<PlexNodePillProps>;

interface PlexBreadcrumbProps {
    trail: PlexNode[];
    onNavigate: (nodeId: string) => void;
    theme: PlexTheme;
}
declare const PlexBreadcrumb: React$1.FC<PlexBreadcrumbProps>;

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
declare function computeLayout(input: LayoutInput): LayoutResult;

interface DrawEdgesInput {
    ctx: CanvasRenderingContext2D;
    edges: EdgeDef[];
    nodeRects: Map<string, NodeRect>;
    theme: PlexTheme;
    edgeStyle: 'waterfall' | 'scurve' | 'straight';
    dpr: number;
}
declare function drawEdges(input: DrawEdgesInput): void;

interface PlexState {
    activeId: string;
    navigate: (nodeId: string) => void;
}
declare function usePlexState(initialActiveId: string): PlexState;

interface ContainerSize {
    width: number;
    height: number;
}
declare function useCanvasSize(containerRef: React.RefObject<HTMLElement | null>): ContainerSize;

declare function useNodeMeasures(containerRef: React.RefObject<HTMLElement | null>): {
    rects: Map<string, NodeRect>;
    remeasure: (nodeIds: string[]) => void;
};

declare const darkTheme: PlexTheme;
declare const lightTheme: PlexTheme;
declare function resolveTheme(theme?: 'dark' | 'light' | PlexTheme): PlexTheme;

export { type EdgeDef, type NodePosition, type NodeRect, PlexBreadcrumb, PlexCanvas, type PlexCanvasProps, type PlexNode, PlexNodePill, type PlexNodeRenderProps, type PlexTheme, computeLayout, darkTheme, drawEdges, lightTheme, resolveTheme, useCanvasSize, useNodeMeasures, usePlexState };
