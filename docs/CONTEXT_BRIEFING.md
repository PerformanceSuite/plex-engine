# Context Briefing for Building plex-engine

## Why This Exists
The Proactiva marketing site (~/Projects/Proactiva) has a mindmap component (`components/shared/wander-mindmap.tsx`) that's been broken for days. The edges loop weirdly, connection points are guessed with magic pixel offsets, and the fixed 260-340px canvas doesn't give edges room to breathe. Multiple attempts to fix the bezier math have failed because the architecture is fundamentally wrong.

Decision was made to build a proper plex engine from scratch as a standalone package, so it can also be used in CommandCentral V.0's VISLZR system and any future project.

## What We Learned from Reverse-Engineering TheBrain (app.thebrain.com)

We inspected the live TheBrain web app at https://app.thebrain.com/brain/42721db9-3661-4322-bff1-78e74bf76e35 and discovered:

1. **Framework**: Blazor/.NET (server-side rendered)
2. **Three canvas layers** inside a `.plex` container:
   - Canvas at z-index 0: background/wallpaper
   - Canvas `#plex-links` at z-index 5: edge/link lines drawn with Canvas 2D
   - Canvas `#plex-gates` at z-index 6: connection dots (gates) on nodes
3. **Thought nodes are DOM elements**: `div.thought-control-wrap` with `position: absolute`, `top`/`left` positioning, varying `font-size` by role (active is 125%, others smaller)
4. **Full viewport**: The plex container fills all available space (1393x549 observed)
5. **Layout zones**: Parent thoughts above center, active thought at center, children below, siblings to the sides
6. **Edge drawing**: Smooth curves on the `#plex-links` canvas, drawn from node connection points
7. **Node measurement**: A `#measurer` div exists in the plex container — likely used to pre-measure text before positioning

## What Failed in the Previous Approach (wander-mindmap.tsx)

1. **SVG bezier paths** — `<path d="M ... C ...">` with Framer Motion. The math kept producing loopy S-curves especially when children were far apart horizontally.
2. **Fixed canvas height** — 260-340px total, trying to fit parent + active + children + edges + text. No room for edges to curve naturally.
3. **Guessed connection points** — magic numbers like `parent.y + 16`, `active.y - 20`, `child.y - 18` instead of measuring actual pill dimensions.
4. **Symmetric bezier control points** — 50/50 split created balanced S-curves that looked like loops. Changed to 70/30 "waterfall" which helped but still wasn't right.
5. **Text overlap** — `demoProp` text positioned at `active.y + 24` overlapping edges. Back button (`< Proactiva`) overlapping child nodes.

## The Correct Approach

- Canvas 2D for edges (like TheBrain)
- DOM nodes measured with getBoundingClientRect() after render
- Edge start = bottom-center of measured source pill
- Edge end = top-center of measured target pill  
- Container fills parent element (responsive)
- Layout algorithm works in proportional coordinates
- Waterfall bezier: first control point drops 70% straight down from source X, second control point approaches from 30% above target at target X

## Proactiva Integration Target

After the engine is built and the demo works, it replaces:
- `~/Projects/Proactiva/components/shared/wander-mindmap.tsx` (the broken component)
- Used by `~/Projects/Proactiva/components/marketing/portal-mindmap-wander.tsx` (contains node data + demo script)

The Proactiva node data has extra fields (glowClass, benefits, href, demoProp) that the engine doesn't need to know about — those go in `PlexNode.data` and Proactiva's wrapper handles rendering the detail panel.

## Browser Testing Limitations

Claude Code does NOT have access to the Chrome browser extension ("Claude in Chrome"). That extension only works in the claude.ai web chat interface — it's a completely separate system from Claude Code's MCP servers.

Claude Code's MCP config is at `~/.config/claude-code/mcp-settings.json`. It has filesystem, github, desktop-commander, brave-search, and other MCP servers, but NO browser/Chrome MCP. The `playwright` and `chrome-devtools` MCP servers are present but DISABLED.

This means Claude Code CANNOT:
- Open a browser and take screenshots
- Inspect live pages
- Verify visual output in a browser

To test visually, Claude Code should:
1. Build the demo app and start the dev server (`npm run dev`)
2. visually inspect and iterate yourself.
