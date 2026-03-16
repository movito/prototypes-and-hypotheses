# Prototypes and Hypotheses

Interactive concept map exploring the two traditions of prototyping in digital service design — the design-exploratory (building to discover) and the hypothesis-driven (building to test).

Built with Astro 5 + React 19, deployed to Vercel.

**Live**: https://prototypes-and-hypotheses.vercel.app

## Development

```bash
npm install          # Install dependencies (first time only)
npm run dev          # Start dev server at localhost:4321
npm run build        # Production build
npm run preview      # Preview production build locally
```

## Editing the Graph

All content lives in a single file: `src/data/graph.json`. No code changes needed.

The JSON has 5 sections:

| Section | Purpose |
|---------|---------|
| `meta` | Title, subtitle, interaction hint |
| `sources` | Bibliography — enables clickable citation links |
| `clusters` | Groupings with labels and colors |
| `nodes` | Concepts — position, cluster, description, size |
| `edges` | Connections between nodes — label, style |

See the [Graph Template Guide](https://github.com/movito/research-method-matrix/blob/main/docs/GRAPH-TEMPLATE-GUIDE.md) for the full field reference.

### Interaction

- **Pan**: Click-drag on empty canvas
- **Zoom**: Scroll wheel
- **Drag nodes**: Click-drag on a node to reposition
- **Hover**: Highlights node + connected edges
- **Click node**: Shows detail panel with description
- **Keyboard**: D = dump positions, S = export SVG, P = export PNG, Escape = deselect

## Regenerating the OG Image

After changing `graph.json`, regenerate the social sharing image:

```bash
npm run dev                      # Start dev server
node scripts/capture-og.mjs     # Captures 1200x630 screenshot → public/og-image.png
```

Requires Playwright (`npx playwright install chromium` if not already installed).

**Note**: If you regenerated the OG image in place, git may not detect a change (same filename, same path). Force-stage it:

```bash
git add -f public/og-image.png
```

## Deploying

Push to `main` — Vercel auto-deploys.

```bash
git add -A
git commit -m "description of changes"
git push origin main
```

## Stack

- **Astro 5** (static output)
- **React 19** via `@astrojs/react`
- **@astrojs/vercel** adapter
- **Vanilla CSS** with custom properties
- **IBM Plex Sans** (self-hosted woff2)
