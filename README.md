# xwflow

A working frontend for **xwflow**, a workflow orchestration system: define a process, publish a
version of it, run the published version, and keep a receipt of every run. Built from the
"xwflow web: website, studio, admin" prototype with **XWUI basic components** loaded from the CDN.

Reference: [xwflow prototype](https://claude.ai/artifact/496BfNonSz4bQpwcZiDKCS#page-dcb81aee8d83).

## Run it

No build step or npm installation is needed. Use Python 3 or another static HTTP server:

```bash
python -m http.server 8080
```

Then open http://localhost:8080. Internet access is required for the XWUI basic CDN,
icons and fonts. Opening `index.html` as a `file://` URL is not supported.

Add `?mock=fast` to disable latency and random failures for review. Normal mode adds
asynchronous delays and occasional mutation failures; `?mock=flaky` increases failures.
To demonstrate isolated panel recovery, open `#/admin?failPanel=chart` in normal mode.

## Pages and interactions

- Website: landing sandbox, searchable integrations, pricing/contact form, self-host
  quickstart, and the 24-item notation gallery with five render modes.
- Studio: assistant drafts, saved chats, flow creation/filtering, graph editing,
  parameter/settings/notes inspector, published versions and restore, test/production
  runs, immutable receipts, retry, connection creation/test/reconnect, and six notation
  views (flowchart, swimlanes, BPMN, sequence, simulation and 3D).
- Admin/System: overview with independent panel recovery, saved branding and previews,
  audit filtering/CSV/SIEM configuration, health checks and operational actions,
  and the Quotas access-denied/request screen.

The website directory and Studio palette use one shared step registry. Switch routes
to two cases or its default output; AI condition records a configurable demo verdict
(`yes`, `no`, `unsure`), model and token count. Sub-flow runs a selected local flow's
published version or draft and records its nested result; recursive calls are rejected.
Reply-based Wait pauses execution until Approve or Reject is confirmed. Decisions
record the actor and time without changing earlier attempts; repeated decisions
are idempotent. Fixed-time waits remain simulated.

## Structure

```
index.html            XWUI import map + theme, app root
src/app.js            boot: API, zones, router
src/core/             router, dummy-API primitives, bus, toasts, XWUI mounting kit, formatting
src/api/              dummy API, one module per domain
src/data/             sample data behind the API
src/components/       custom XWF* components (extend XWUIComponent)
src/zones/            website, studio, admin: layouts + pages
src/styles/           tokens, prototype primitives, XWUI tuning
docs/CONTRACT.md      architecture rules
```

## Dummy API and persistence

`src/api/index.js` exposes local JavaScript APIs for Studio, Website and Admin.
They simulate asynchronous operations, clone responses and keep sample records in
browser `localStorage`. Pages obtain records, copy, options and asset IDs through
these APIs. The shared step registry is `src/data/node-catalog.data.js`; graphics
are resolved through `assets/manifest.json` (see `assets/README.md`).

Data survives reloads on the same origin. Different hosts or ports have separate
demo workspaces. To restore sample data, remove the app's `xwflow:*` keys from the
browser's site storage and reload. There is no live backend or authentication.

## Assumptions and incomplete items

- Artboards define the implemented pages. Eleven menu destinations without artboards
  show an explicit placeholder: Tenants, Credentials policy, Node registry, Adapters,
  Usage, AI governance, Schedules, Workers, All executions, Config and Backups.
- Studio Agents, Tables, Forms, Variables, MCP servers, Templates, Insights and Settings
  have no supplied page designs. Their controls explain this limitation. Assistant
  attachment and microphone controls are informational.
- Arabic translates navigation and mirrors the surrounding layout; body copy remains
  English. Canvas content remains left-to-right.
- AI drafting, connectors, HTTP, scripts, schedules, execution timing and infrastructure
  operations are local simulations. No external model, integration, email, payment,
  SIEM transfer, worker drain or deployment is performed. Connection secrets are not
  retained as readable values; this demo is not a production vault.
- Prototype `PRICE`, `UNIT`, `CONTACT` and unspecified self-host commands are preserved
  and identified as placeholders. Comparison/docs/security destinations without
  artboards use illustrative sections rather than invented product claims.
- Responsive layouts are checked in browser viewports; physical iOS/Android testing
  and a complete pixel-by-pixel comparison of unavailable reference artboards remain
  outside the verified scope.

## Validation and AI use

With Node.js installed, run the local regression suite:

```bash
node --test src/core/router.test.mjs src/api/studio.test.mjs src/api/website-admin.test.mjs
```

The regression suite has 26 passing tests. Browser checks cover navigation,
responsive pages, editor/publish/run/retry, connections, branding, audit, health,
errors and empty states: 468 route checks, plus hero checks at 17 widths from
320 to 3440 px. Scope and limits are documented in `docs/mobile-qa.md`.

Codex and Claude Code were used to investigate public documentation, implement and
review the frontend, and create assets. AI image generation was used for raster artwork.
No eXonware frontend skills or XWUI MCP were used; XWUI integration uses public CDN
documentation, schemas and source.
