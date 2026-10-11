# xwflow

A working frontend for **xwflow**, a workflow orchestration system: define a process, publish a
version of it, run the published version, and keep a receipt of every run from start to finish.
Built from the "xwflow web: website, studio, admin" prototype with **XWUI basic components** loaded
from the CDN. No other UI library is used.

## Run it

No build step and no packages to install. Serve the folder with any static server:

```bash
python -m http.server 8080
```

Open http://localhost:8080. Internet access is needed for the XWUI CDN and Google Fonts.

| URL option | Effect |
|---|---|
| `?mock=fast` | no simulated latency or random failures (good for a quick review) |
| `?mock=flaky` | six times the usual failure rate, to see error and retry states |
| `?mock=reset` | wipe the demo's saved changes and start from the sample data |

Tests for the dummy API (Node 18+, no browser or network):

```bash
node --test src/api/studio.test.mjs src/api/website-admin.test.mjs
```

## What is in it

All 22 prototype artboards are implemented as routes:

| Zone | Routes |
|---|---|
| Website | `#/` landing, `#/integrations`, `#/pricing`, `#/self-host`, `#/notations` gallery |
| Studio | `#/studio` assistant, `#/studio/flows`, `#/studio/flows/:id` editor, `#/studio/flows/:id/view/:notation` (flowchart, swimlane, bpmn, sequence, sim, 3d), `#/studio/runs`, `#/studio/runs/:id` receipt, `#/studio/connections` |
| Admin | `#/admin` overview, `#/admin/branding`, `#/admin/audit`, `#/system/health`, `#/admin/quotas` (access denied) |

The interactions shown in the prototype work against the dummy API. A few examples: drafting
a flow from a prompt; editing the graph (drag, connect, zoom, minimap, rename, pin, delete, restore
an earlier version); running a flow and watching steps light up; publishing a version; retrying
runs; comparing two receipts; testing and reconnecting connections; branding with live
WCAG contrast checks; filtering and exporting the audit log to CSV; health re-checks. The notation views
also do real work: BPMN XML, PlantUML and Mermaid exports, a simulation with what-if inputs, a 3D view
with camera, layout switches and run replay, and lane grouping.

## Structure

```
index.html            XWUI import map, fonts, theme, app root
src/app.js            boot: dummy API, zones, router
src/core/             router, dummy-API primitives (mock.js), bus, toasts, XWUI mounting kit, formatting
src/api/              dummy API, one module per domain (studio, website, admin, assets) + tests
src/data/             sample data and copy behind the API (pages never import these)
src/components/       custom XWF* components (extend XWUIComponent)
src/zones/            website, studio, admin: layouts + pages
src/styles/           tokens, prototype primitives, XWUI tuning
assets/               69 SVG/WebP graphics, listed in assets/manifest.json
docs/CONTRACT.md      architecture rules every module follows
```

**Dummy API.** `src/core/mock.js` simulates async calls (latency, occasional failures,
`ApiError`) and keeps changes in memory mirrored to `localStorage`. Each `src/api/<domain>.api.js`
reads only its own `src/data/<domain>.data.js`. `studio.engine.js` plans runs step by step, so a
started run is revealed live.

**Custom components.** Each is a folder with `model` (definition and defaults), `logic`
(`XWUIComponentLogic` plus pure helpers), `view` (state to DOM, XWUI children), the component class
(`extends XWUIComponent`, registered as a custom element), `css` and `md`. They exist only where XWUI
basic has no equivalent:

- `XWFFlowCanvas`: the node-graph editor.
- `XWFFlowDiagram`: six notations generated from one graph and receipt.
- `XWFRunTimeline`: the receipt waterfall.
- `XWFBarSpark` and `XWFBarChart`: bar charts.
- `XWFIsoTiles`, `XWFHeroScene`, `XWFUptimeBar`, `XWFBrandPreview`, `XWFContrastCheck`: specialised visuals.
- `XWFStatus`: run and step status marker.
- `XWFIntegrationCard`, `XWFPricingTiers`, `XWFHealthCheck`: compositions of XWUI cards.

Controls inside them are XWUI basic components. `src/components/_template/` is the reference skeleton.

## Assumptions

- **Placeholders.** Values the prototype marks as placeholders stay placeholders: `PRICE`, `UNIT`,
  `CONTACT`, the connector count `N`, and the start command named "from the release notes".
- **Arabic.** Arabic mode mirrors the layout and translates navigation. Page copy, dates and
  numbers stay English, as nothing else was supplied in Arabic.
- **Notation gallery.** It lists 24 notations. Six have live views; the rest are concept cards
  previewed with the nearest live notation.
- **Admin and System menu.** Destinations with no artboard (Tenants, Credentials policy, Node
  registry, Adapters, Usage, AI governance, Schedules, Workers, All executions, Config, Backups)
  open a labelled placeholder.
- **Studio.** Entries the prototype shows but never designs explain that they are not part of the
  prototype instead of doing nothing: project tabs (Agents, Tables, Forms, Variables, MCP servers),
  rail items (Templates, Insights, Settings) and the matching Create menu items.
- **Commercial features.** Branding save and SIEM streaming work locally even though the
  prototype gates them to Commercial. The gating note stays visible.
- **No live side effects.** Quotes, access requests and operational actions are stored as local
  records only: no email, no live command.
- **Screen sizes.** The prototype is desktop (1440 px). The app also works at 1024 px and on phones:
  the Studio rail becomes an icon rail, and the editor panels stack under the canvas.

## Incomplete items

- Swimlane "Lane by: Environment" has no data to group by, so it explains that instead of regrouping.
- BPMN 1.x has no XML interchange format. Choosing it labels the view, and the export uses BPMN 2.0.2
  elements.
- There is no authentication: Sign in opens Studio directly. Docs, comparison, templates and security
  links lead to short data-driven sections on the landing page, since no artboards exist for them.

## How AI was used

The app was built with AI coding agents (Claude Code, with Codex on the Website/Admin zones and the
graphics) working against `docs/CONTRACT.md`. People reviewed the work and set its direction. Each
step was checked in a headless browser:

- side-by-side screenshots with every prototype artboard;
- route sweeps at 1440, 1024 and 390 px for console errors, horizontal overflow and dropdown placement;
- scripted click-throughs of the main flows.

`docs/codex-status.md` and `docs/requests-to-claude.md` record the hand-off between the two agents.
