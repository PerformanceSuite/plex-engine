"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  PlexBreadcrumb: () => PlexBreadcrumb,
  PlexCanvas: () => PlexCanvas,
  PlexNodePill: () => PlexNodePill,
  computeLayout: () => computeLayout,
  darkTheme: () => darkTheme,
  drawEdges: () => drawEdges,
  lightTheme: () => lightTheme,
  resolveTheme: () => resolveTheme,
  useCanvasSize: () => useCanvasSize,
  useNodeMeasures: () => useNodeMeasures,
  usePlexState: () => usePlexState
});
module.exports = __toCommonJS(index_exports);

// src/components/PlexCanvas.tsx
var import_react3 = require("react");

// src/themes.ts
var darkTheme = {
  background: "transparent",
  edgeColor: "rgba(6, 182, 212, 0.25)",
  edgeParentColor: "rgba(148, 163, 184, 0.2)",
  edgeWidth: 1.5,
  nodeActiveBg: "rgba(6, 182, 212, 0.15)",
  nodeActiveText: "#e2e8f0",
  nodeActiveBorder: "rgba(6, 182, 212, 0.5)",
  nodePassiveBg: "rgba(30, 41, 59, 0.6)",
  nodePassiveText: "#94a3b8",
  nodePassiveBorder: "rgba(71, 85, 105, 0.4)",
  fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  transitionDuration: 400
};
var lightTheme = {
  background: "transparent",
  edgeColor: "rgba(6, 182, 212, 0.35)",
  edgeParentColor: "rgba(100, 116, 139, 0.25)",
  edgeWidth: 1.5,
  nodeActiveBg: "rgba(6, 182, 212, 0.1)",
  nodeActiveText: "#1e293b",
  nodeActiveBorder: "rgba(6, 182, 212, 0.6)",
  nodePassiveBg: "rgba(241, 245, 249, 0.8)",
  nodePassiveText: "#475569",
  nodePassiveBorder: "rgba(203, 213, 225, 0.6)",
  fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  transitionDuration: 400
};
function resolveTheme(theme) {
  if (!theme || theme === "dark") return darkTheme;
  if (theme === "light") return lightTheme;
  return theme;
}

// src/layout/plex-layout.ts
function findParent(nodes, activeId) {
  return nodes.find((n) => n.children?.includes(activeId));
}
function getNode(nodes, id) {
  return nodes.find((n) => n.id === id);
}
function computeLayout(input) {
  const { nodes, activeId, containerWidth, containerHeight } = input;
  const positions = [];
  const edges = [];
  const active = getNode(nodes, activeId);
  if (!active) return { positions, edges };
  const centerX = containerWidth / 2;
  const activeY = containerHeight * 0.42;
  positions.push({ id: active.id, x: centerX, y: activeY, role: "active" });
  const parent = findParent(nodes, activeId);
  if (parent) {
    const parentY = containerHeight * 0.15;
    positions.push({ id: parent.id, x: centerX, y: parentY, role: "parent" });
    edges.push({ sourceId: parent.id, targetId: active.id, type: "parent" });
  }
  const childIds = active.children ?? [];
  const childNodes = childIds.map((id) => getNode(nodes, id)).filter((n) => n !== void 0);
  if (childNodes.length > 0) {
    const childY = containerHeight * 0.72;
    const maxSpread = containerWidth * 0.85;
    const totalSpread = Math.min(
      maxSpread,
      childNodes.length * 160
    );
    const startX = centerX - totalSpread / 2;
    const gap = childNodes.length === 1 ? 0 : totalSpread / (childNodes.length - 1);
    childNodes.forEach((child, i) => {
      const childX = childNodes.length === 1 ? centerX : startX + gap * i;
      positions.push({ id: child.id, x: childX, y: childY, role: "child" });
      edges.push({ sourceId: active.id, targetId: child.id, type: "child" });
    });
  }
  return { positions, edges };
}

// src/canvas/edge-renderer.ts
function drawEdges(input) {
  const { ctx, edges, nodeRects, theme, edgeStyle, dpr } = input;
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.save();
  ctx.scale(dpr, dpr);
  for (const edge of edges) {
    const sourceRect = nodeRects.get(edge.sourceId);
    const targetRect = nodeRects.get(edge.targetId);
    if (!sourceRect || !targetRect) continue;
    const sx = sourceRect.left + sourceRect.width / 2;
    const sy = sourceRect.top + sourceRect.height;
    const tx = targetRect.left + targetRect.width / 2;
    const ty = targetRect.top;
    const color = edge.type === "parent" ? theme.edgeParentColor : theme.edgeColor;
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = theme.edgeWidth;
    ctx.lineCap = "round";
    if (edgeStyle === "straight") {
      ctx.moveTo(sx, sy);
      ctx.lineTo(tx, ty);
    } else if (edgeStyle === "scurve") {
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
  ctx.restore();
}

// src/hooks/use-canvas-size.ts
var import_react = require("react");
function useCanvasSize(containerRef) {
  const [size, setSize] = (0, import_react.useState)({ width: 0, height: 0 });
  const measure = (0, import_react.useCallback)(() => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    setSize((prev) => {
      if (prev.width === clientWidth && prev.height === clientHeight)
        return prev;
      return { width: clientWidth, height: clientHeight };
    });
  }, [containerRef]);
  (0, import_react.useEffect)(() => {
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

// src/hooks/use-node-measures.ts
var import_react2 = require("react");

// src/layout/measure.ts
function measureNodes(containerEl, nodeIds) {
  const rects = /* @__PURE__ */ new Map();
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
      height: rect.height
    });
  }
  return rects;
}

// src/hooks/use-node-measures.ts
function useNodeMeasures(containerRef) {
  const [rects, setRects] = (0, import_react2.useState)(/* @__PURE__ */ new Map());
  const frameRef = (0, import_react2.useRef)(0);
  const remeasure = (0, import_react2.useCallback)(
    (nodeIds) => {
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

// src/components/PlexNodePill.tsx
var import_jsx_runtime = require("react/jsx-runtime");
var PlexNodePill = ({
  node,
  role,
  x,
  y,
  theme,
  isHovered,
  onClick,
  onMouseEnter,
  onMouseLeave
}) => {
  const isActive = role === "active";
  const fontSize = isActive ? "1rem" : "0.85rem";
  const style = {
    position: "absolute",
    left: x,
    top: y,
    transform: "translate(-50%, -50%)",
    padding: isActive ? "10px 22px" : "7px 16px",
    borderRadius: "9999px",
    background: isActive ? theme.nodeActiveBg : theme.nodePassiveBg,
    color: isActive ? theme.nodeActiveText : theme.nodePassiveText,
    border: `1px solid ${isActive ? theme.nodeActiveBorder : theme.nodePassiveBorder}`,
    fontFamily: theme.fontFamily,
    fontSize,
    fontWeight: isActive ? 600 : 400,
    cursor: isActive ? "default" : "pointer",
    whiteSpace: "nowrap",
    userSelect: "none",
    transition: `all ${theme.transitionDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
    opacity: isHovered && !isActive ? 0.9 : 1,
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    zIndex: isActive ? 10 : 5
  };
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
    "div",
    {
      "data-plex-node": node.id,
      style,
      onClick: isActive ? void 0 : onClick,
      onMouseEnter,
      onMouseLeave,
      role: isActive ? void 0 : "button",
      tabIndex: isActive ? void 0 : 0,
      onKeyDown: isActive ? void 0 : (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      },
      children: [
        node.color && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "span",
          {
            style: {
              display: "inline-block",
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: node.color,
              marginRight: 8,
              verticalAlign: "middle"
            }
          }
        ),
        node.label
      ]
    }
  );
};

// src/components/PlexCanvas.tsx
var import_jsx_runtime2 = require("react/jsx-runtime");
var PlexCanvas = ({
  nodes,
  activeId,
  onNavigate,
  theme: themeProp,
  edgeStyle = "waterfall",
  nodeRenderer: CustomNode,
  className,
  style,
  onNodeHover
}) => {
  const theme = resolveTheme(themeProp);
  const containerRef = (0, import_react3.useRef)(null);
  const canvasRef = (0, import_react3.useRef)(null);
  const { width, height } = useCanvasSize(containerRef);
  const { rects, remeasure } = useNodeMeasures(containerRef);
  const [hoveredId, setHoveredId] = (0, import_react3.useState)(null);
  const layout = computeLayout({
    nodes,
    activeId,
    containerWidth: width,
    containerHeight: height
  });
  const positionMap = /* @__PURE__ */ new Map();
  for (const pos of layout.positions) {
    positionMap.set(pos.id, pos);
  }
  const nodeIds = layout.positions.map((p) => p.id);
  (0, import_react3.useEffect)(() => {
    if (width === 0 || height === 0) return;
    const timer = setTimeout(() => {
      remeasure(nodeIds);
    }, 50);
    return () => clearTimeout(timer);
  }, [activeId, width, height, nodeIds.join(",")]);
  (0, import_react3.useEffect)(() => {
    if (width === 0 || height === 0) return;
    const timer = setTimeout(() => {
      remeasure(nodeIds);
    }, theme.transitionDuration + 50);
    return () => clearTimeout(timer);
  }, [activeId, width, height]);
  (0, import_react3.useEffect)(() => {
    const canvas = canvasRef.current;
    if (!canvas || rects.size === 0) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawEdges({
      ctx,
      edges: layout.edges,
      nodeRects: rects,
      theme,
      edgeStyle,
      dpr
    });
  }, [rects, layout.edges, theme, edgeStyle, width, height]);
  const handleHover = (0, import_react3.useCallback)(
    (id) => {
      setHoveredId(id);
      onNodeHover?.(id);
    },
    [onNodeHover]
  );
  if (width === 0 || height === 0) {
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
      "div",
      {
        ref: containerRef,
        className,
        style: {
          width: "100%",
          height: "100%",
          minHeight: 300,
          position: "relative",
          ...style
        }
      }
    );
  }
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
    "div",
    {
      ref: containerRef,
      className,
      style: {
        width: "100%",
        height: "100%",
        minHeight: 300,
        position: "relative",
        overflow: "hidden",
        background: theme.background,
        ...style
      },
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          "canvas",
          {
            ref: canvasRef,
            style: {
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              zIndex: 1,
              pointerEvents: "none"
            }
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          "div",
          {
            style: {
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              zIndex: 2
            },
            children: layout.positions.map((pos) => {
              const node = nodes.find((n) => n.id === pos.id);
              if (!node) return null;
              if (CustomNode) {
                return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                  "div",
                  {
                    "data-plex-node": pos.id,
                    style: {
                      position: "absolute",
                      left: pos.x,
                      top: pos.y,
                      transform: "translate(-50%, -50%)",
                      transition: `all ${theme.transitionDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`
                    },
                    children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                      CustomNode,
                      {
                        node,
                        role: pos.role,
                        isHovered: hoveredId === pos.id,
                        onClick: () => onNavigate(pos.id),
                        onMouseEnter: () => handleHover(pos.id),
                        onMouseLeave: () => handleHover(null)
                      }
                    )
                  },
                  pos.id
                );
              }
              return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                PlexNodePill,
                {
                  node,
                  role: pos.role,
                  x: pos.x,
                  y: pos.y,
                  theme,
                  isHovered: hoveredId === pos.id,
                  onClick: () => onNavigate(pos.id),
                  onMouseEnter: () => handleHover(pos.id),
                  onMouseLeave: () => handleHover(null)
                },
                pos.id
              );
            })
          }
        )
      ]
    }
  );
};

// src/components/PlexBreadcrumb.tsx
var import_react4 = __toESM(require("react"));
var import_jsx_runtime3 = require("react/jsx-runtime");
var PlexBreadcrumb = ({
  trail,
  onNavigate,
  theme
}) => {
  if (trail.length <= 1) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
    "nav",
    {
      style: {
        position: "absolute",
        top: 8,
        left: 12,
        zIndex: 20,
        display: "flex",
        gap: 4,
        alignItems: "center",
        fontFamily: theme.fontFamily,
        fontSize: "0.75rem",
        color: theme.nodePassiveText
      },
      children: trail.map((node, i) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_react4.default.Fragment, { children: [
        i > 0 && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { style: { opacity: 0.4 }, children: "/" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
          "button",
          {
            onClick: () => onNavigate(node.id),
            style: {
              background: "none",
              border: "none",
              color: theme.nodePassiveText,
              cursor: "pointer",
              padding: "2px 4px",
              borderRadius: 4,
              fontFamily: "inherit",
              fontSize: "inherit",
              opacity: i === trail.length - 1 ? 1 : 0.6
            },
            children: node.label
          }
        )
      ] }, node.id))
    }
  );
};

// src/hooks/use-plex-state.ts
var import_react5 = require("react");
function usePlexState(initialActiveId) {
  const [activeId, setActiveId] = (0, import_react5.useState)(initialActiveId);
  const navigate = (0, import_react5.useCallback)((nodeId) => {
    setActiveId(nodeId);
  }, []);
  return { activeId, navigate };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PlexBreadcrumb,
  PlexCanvas,
  PlexNodePill,
  computeLayout,
  darkTheme,
  drawEdges,
  lightTheme,
  resolveTheme,
  useCanvasSize,
  useNodeMeasures,
  usePlexState
});
