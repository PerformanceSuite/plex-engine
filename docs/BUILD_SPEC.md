# plex-engine

## What This Is
A standalone React component library that implements TheBrain-style "plex" visualization — the interactive mindmap where clicking a node makes it the active center, its parent moves above, its children fan out below, and smooth animated edges connect everything.

This is a **reusable package** consumed by:
- **Proactiva** (Next.js marketing site at ~/Projects/Proactiva) — drop-in replacement for `components/shared/wander-mindmap.tsx`
- **CommandCentral V.0** (~/Projects/commandcentralV.0) — replaces the ReactFlow-based `MindmapRenderer.tsx` in VISLZR
- Any React app that needs a plex/mindmap visualization

## Architecture (Learned from TheBrain reverse-engineering)

TheBrain's web app (app.thebrain.com) uses:
- **DOM elements for thought nodes** — absolutely positioned divs with `top`/`left`, clickable and accessible
- **Canvas 2D for edges** — three canvas layers: background (z:0), links/edges (z:5), connection gates (z:6)
- **Full viewport container** — the plex fills all available space (1393x549 on a typical screen)
- **Deterministic layout** — NOT physics/force-directed. Parent above center, active at center, children below, siblings to the side. Positions calculated algorithmically.
- **Blazor/.NET** framework (we use React instead)

### Our Architecture
```
┌─────────────────────────────────────────────┐
│  PlexCanvas (container, fills parent)        │
│                                              │
│  ┌─────────────────────────────────────────┐ │
│  │  <canvas> — Edge Layer (z-index: 1)     │ │
│  │  Draws bezier curves between nodes      │ │
│  │  Canvas 2D API, not SVG                 │ │
│  └─────────────────────────────────────────┘ │
│                                              │
│  ┌─────────────────────────────────────────┐ │
│  │  DOM Layer (z-index: 2)                 │ │
│  │  Absolutely positioned node pills       │ │
│  │  Measured with getBoundingClientRect()   │ │
│  │  CSS transitions for movement           │ │
│  └─────────────────────────────────────────┘ │
│                                              │
│  ┌─────────────────────────────────────────┐ │
│  │  <canvas> — Gate Layer (z-index: 3)     │ │
│  │  Connection dots on node edges          │ │
│  │  (optional, phase 2)                    │ │
│  └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

## Core Layout Algorithm

The plex layout is **deterministic** with these zones:

```
          ┌──────────┐
          │  Parent   │  ← top zone, ~20% from top
          └──────────┘
               │
          ┌──────────┐
          │  Active   │  ← center zone, ~45% from top  
          └──────────┘
          /    |    \
   ┌─────┐ ┌─────┐ ┌─────┐
   │Child│ │Child│ │Child│  ← bottom zone, ~75% from top
   └─────┘ └─────┘ └─────┘
   
   Siblings ← left zone        Siblings → right zone
   (jump thoughts, phase 2)
```

### Position Calculation
1. **Container measures itself** (ResizeObserver)
2. **Active node** → centered horizontally, 40-45% from top
3. **Parent node** → centered horizontally, positioned above active with enough gap for a visible edge (min 80px between pill edges)
4. **Children** → spread horizontally below active, evenly distributed
5. **Edge connection points** → computed from **actual measured node dimensions** (getBoundingClientRect after render), NOT guessed pixel offsets
6. **Edges drawn** → on canvas, from bottom-center of source pill to top-center of target pill

### Edge Drawing (Canvas 2D)
- Use cubic bezier curves: `ctx.bezierCurveTo()`
- Start point: bottom-center of source node pill (measured)
- End point: top-center of target node pill (measured)  
- Control points: "waterfall" pattern — first CP drops 70% straight down from source, second CP is 30% above target at target's X position
- This produces smooth curves that drop down then sweep into the target, avoiding the "loopy S-curve" problem
- Edge color: subtle, translucent (e.g., `rgba(6, 182, 212, 0.25)` for children, `rgba(148, 163, 184, 0.2)` for parent)
- Stroke width: 1.5-2px
- Animate edge drawing on navigation (path reveal animation)

### Responsiveness Strategy
- Container fills its parent (`width: 100%, height: 100%`)
- Layout algorithm works in **proportional coordinates** (percentages of container)  
- Minimum container height: 300px
- On very small screens (<480px), optionally switch to vertical list mode
- Node font sizes scale with container using clamp()

## Public API

```tsx
import { PlexCanvas } from 'plex-engine';

// Minimal usage
<PlexCanvas
  nodes={nodes}
  rootId="root"
  activeId={activeId}
  onNavigate={(nodeId) => setActiveId(nodeId)}
/>

// Full usage
<PlexCanvas
  nodes={nodes}
  rootId="root"
  activeId={activeId} 
  onNavigate={(nodeId) => setActiveId(nodeId)}
  
  // Customization
  theme="dark"                    // "dark" | "light" | custom theme object
  edgeStyle="waterfall"           // "waterfall" | "scurve" | "straight"
  nodeRenderer={CustomNode}       // Override default pill renderer
  className="my-plex"             // Container className
  style={{ height: 500 }}         // Container style
  
  // Demo/animation
  demo={{ script: [...], loop: true }}
  
  // Events
  onNodeHover={(nodeId) => {}}
  onNodeContext={(nodeId, e) => {}}
/>
```

### PlexNode Type
```typescript
interface PlexNode {
  id: string;
  label: string;
  children?: string[];           // IDs of child nodes
  description?: string;          // For detail panels (consumer handles display)
  status?: string;               // "live" | "building" | "coming-soon" | custom
  color?: string;                // Dot/accent color
  icon?: string;                 // Optional icon
  data?: Record<string, any>;    // Arbitrary consumer data
}
```

### Theme Type
```typescript
interface PlexTheme {
  background: string;            // Canvas/container background
  edgeColor: string;             // Default edge color
  edgeParentColor: string;       // Parent→active edge color
  edgeWidth: number;             // Edge stroke width
  nodeActiveBg: string;          // Active node background
  nodeActiveText: string;        // Active node text color
  nodeActiveBorder: string;      // Active node border
  nodePassiveBg: string;         // Parent/child background
  nodePassiveText: string;       // Parent/child text color  
  nodePassiveBorder: string;     // Parent/child border
  fontFamily: string;            // Font family for labels
  transitionDuration: number;    // Animation duration in ms
}
```

## File Structure
```
plex-engine/
├── package.json
├── tsconfig.json
├── tsup.config.ts              
├── CLAUDE.md                    ← this file
├── src/
│   ├── index.ts                 ← public exports
│   ├── types.ts                 ← PlexNode, PlexTheme, etc.
│   ├── themes.ts                ← Dark/light default themes
│   ├── components/
│   │   ├── PlexCanvas.tsx       ← Main container component
│   │   ├── PlexNodePill.tsx     ← Default node renderer (DOM)
│   │   └── PlexBreadcrumb.tsx   ← Breadcrumb navigation
│   ├── layout/
│   │   ├── plex-layout.ts       ← Deterministic position calculator
│   │   └── measure.ts           ← Node measurement utilities
│   ├── canvas/
│   │   ├── edge-renderer.ts     ← Canvas 2D edge drawing
│   │   └── animation.ts         ← Edge animation (path reveal)
│   └── hooks/
│       ├── use-plex-state.ts    ← Navigation state management
│       ├── use-canvas-size.ts   ← ResizeObserver hook
│       └── use-node-measures.ts ← Measure DOM nodes after render
├── demo/
│   ├── index.html
│   ├── main.tsx                 ← Demo app entry
│   ├── App.tsx                  ← Demo with sample data
│   └── vite.config.ts
└── dist/                        ← Built output
```

## Implementation Order

### Phase 1: Core (get it working)
1. Types + themes
2. Layout algorithm (plex-layout.ts)  
3. PlexNodePill component (DOM nodes)
4. Canvas edge renderer
5. PlexCanvas container (wires it all together)
6. Node measurement hook
7. Navigation state hook
8. Demo app with Proactiva's data

### Phase 2: Polish
9. Edge animation (path reveal on navigate)
10. Node transition animations (CSS transitions on position change)
11. Demo playback (auto-navigation script)
12. Breadcrumb component
13. Responsive breakpoints

### Phase 3: Proactiva Integration  
14. Replace `wander-mindmap.tsx` with PlexCanvas
15. Wire into `portal-mindmap-wander.tsx` 
16. Verify on localhost:3000
17. Push to Vercel

## Acceptance Criteria

The engine is DONE when:
1. ✅ Edges connect from **actual bottom of source pill** to **actual top of target pill** — no guessed offsets
2. ✅ Edges are smooth curves that **never loop or overshoot** — waterfall pattern
3. ✅ Parent→Active edge is clearly visible with proportional spacing
4. ✅ Children fan out evenly below active with clean edge separation
5. ✅ Clicking a child makes it active, its parent moves up, its children appear below — smooth transition
6. ✅ Works at any container size from 400x300 to fullscreen
7. ✅ No text overlap between demoProp/breadcrumbs and nodes
8. ✅ Canvas auto-resizes on window resize
9. ✅ Demo mode auto-navigates through a script
10. ✅ Zero runtime dependencies beyond React

## Important Notes

- Do NOT use SVG for edges. Use Canvas 2D. SVG bezier paths are what caused the original problems.
- Do NOT use ReactFlow, D3, Cytoscape, or any graph library. This is a focused, minimal implementation.
- Do NOT use force-directed/physics layout. The layout is deterministic.
- Do NOT hard-code pixel offsets for edge connection points. Measure actual DOM nodes.
- The engine must work with NO backend. It's purely a frontend visualization component.
- TheBrain uses `position: absolute` with `top`/`left` for nodes. We do the same.
- Edge redraw should happen on: navigation, resize, and after node measurement.

## Proactiva Integration Notes

The existing Proactiva mindmap data lives in:
- `~/Projects/Proactiva/components/marketing/portal-mindmap-wander.tsx` — contains the node data and demo script
- `~/Projects/Proactiva/components/shared/wander-mindmap.tsx` — the current (broken) implementation to replace

The node data structure in Proactiva has these extra fields: `glowClass`, `benefits`, `href`, `external`, `renderContent`, `demoProp`. These map to `PlexNode.data` — the consumer (Proactiva) handles rendering the detail panel, the engine just handles the plex visualization.
