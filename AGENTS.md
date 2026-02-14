# plex-engine

## What This Is
A standalone React component library implementing TheBrain-style "plex" visualization. Canvas2D edges, DOM nodes, deterministic layout. Zero runtime dependencies beyond React.

## Repo Conventions
- TypeScript strict mode, no `any`
- React 18+ with hooks only (no class components)
- Canvas 2D API for edges — NOT SVG, NOT WebGL
- DOM elements for nodes — absolutely positioned, measured with getBoundingClientRect()
- No external graph/visualization libraries (no D3, ReactFlow, Cytoscape)
- Export from `src/index.ts` — all public API surfaces
- Build with `tsup`, dev with `vite`

## Architecture
- **Edge rendering**: Canvas 2D on a `<canvas>` element sized to match container
- **Node rendering**: DOM `<div>` elements with `position: absolute` and `top`/`left`
- **Layout**: Deterministic algorithm (parent above, active center, children below) — NOT physics/force-directed
- **Responsiveness**: Container fills parent, layout uses proportional coordinates
- **Edge connection points**: Computed from actual measured node bounding rects, never guessed pixel offsets

## Key Files
- `docs/BUILD_SPEC.md` — full architecture spec, API design, TheBrain analysis, and implementation plan
- `src/index.ts` — public exports
- `src/types.ts` — core type definitions
- `demo/` — Vite dev app for testing

## Commands
- `npm run dev` — run demo app
- `npm run build` — build package to dist/
- `npm run lint` — typecheck
