# Codex delivery status

Scope: Website, Admin, System health, access denied, and graphic assets. Branch: `codex/website-admin`. Implementation is complete for this scope and ready for Claude's integration review. The checkout is `XWUI-codex`; Claude's original checkout was read only.

## Run and verify

Serve the repository with any static server, for example `python -m http.server 8082`, then open `http://127.0.0.1:8082/`. The runtime uses browser ES modules and the public XWUI basic CDN; no build or runtime package installation is required. Internet access is needed for the CDN and fonts.

- `?mock=fast` disables latency and random errors for deterministic review.
- Normal mode simulates asynchronous calls and approximately 5% mutation failures. `?mock=flaky` increases that rate.
- `#/admin?failPanel=chart` or `#/admin?failPanel=kpis` fails the chosen panel's first load. Its Try again button recovers it while the other panels remain usable. Do not combine this scenario with `?mock=fast`.
- `node --test src/api/website-admin.test.mjs` runs the seven domain API checks without a browser or network.

## Delivered screens and interactions

- Website layout: logo, seven navigation items, persisted EN/AR navigation and direction, sign in, start building, four footer columns and wordmark. Section links work across pages.
- Landing: announcement, hero and interactive isometric sandbox (reset/zoom/run), four statistics, scrolling step tags, editable prompt and suggestions, draft, receipt/state/keyboard/language/self-host bento, brand fan, 24 notations, ten migration dialects, CTA and resource destinations.
- Integrations: catalog-backed cards, featured step, search, keyboard search focus, category tabs, illustrated empty state with reset, pagination support and XWUI details dialog with a Studio link.
- Pricing: three tiers, comparison table, contact form with validation and persistent local request, and XWUI licensing FAQ. Reference `PRICE`, `UNIT` and `CONTACT` placeholders are preserved.
- Self-host: five rich quickstart steps, code blocks with working clipboard actions, defaults, secrets note, server illustration and placeholder-command notice.
- Admin layout: all Admin/System destinations, active menu state, icons, tenant/avatar header and Studio return.
- Overview: independently loaded KPIs, hourly bars, isometric reachability and failed-run table with links to existing Studio receipts. Panel-specific errors and retries are isolated.
- Branding: names, logo/favicon file selection, file validation, previews and removal, three fictional sample brands, four colors, font, remove-vendor switch, domain validation, live preview, computed WCAG ratios, dirty/saved state and persistent save. Button ink follows the stronger contrast when the primary color changes.
- Audit: actor/class/action/object/date filters, search, newest-first table, pagination, filtered CSV download with formula escaping and a persistent SIEM configuration dialog.
- Health: derived attention count, topology, 30-day uptime and logs, six checks, asynchronous recheck, cancel/confirm for schedule pause and worker drain, persistent and idempotent operational states.
- Quotas denied: role explanation, lock illustration and persistent idempotent access request with a disabled sent state.
- Other Admin menu destinations: route-specific headings and a documented empty-state placeholder.

## Architecture and graphics

Pages consume `websiteApi` / `adminApi`; UI modules never import data modules. Copy, records, options, paths and asset references reside in `src/data/*.data.js`. Owned controls use XWUI basic constructors, documented data/config, lifecycle cleanup and actual dialogs, tables, cards, status pills, inputs, tabs and feedback components.

Nine `XWF*` visual compositions extend `XWUIComponent`, expose the standard state/update/destroy API, register custom elements and separate model, logic, projection, styles and documentation. No third-party UI library is used.

The graphics set contains 69 entries in `assets/manifest.json`: 67 static SVGs and two optimized WebPs. The largest SVG is 7,976 bytes; the largest raster is 37,904 bytes. SVGs have title/viewBox and no scripts, external references, text elements, fonts or animation. The favicon inherited from main is unchanged. Each SVG was rendered on both the dark background and a glass card; OG and grain dimensions and sizes were verified during creation.

Asset IDs are declared in data records (`assetRefs` and catalog `assetId`). Domain APIs resolve IDs through `assets.api.js`. Page templates contain no asset file paths. Images used by XWUIFeedbackEmpty are actual image elements, since a URL passed as an illustration string is rendered as text. Website, self-host, pricing, catalog, denied, health and branding use the set. Studio-specific assets remain ready for Claude to connect. `assets/README.md` contains the preview inventory and ID usage instructions.

## Custom composition decisions

- Basic has no public chart tier, isometric topology, 3D workflow hero, uptime strip or tenant-brand preview. `XWFBarChart`, `XWFIsoTiles`, `XWFHeroScene`, `XWFUptimeBar` and `XWFBrandPreview` provide these visuals. Controls inside them remain XWUI basic; SVG/CSS supplies only the specialized scene.
- `XWFIntegrationCard`, `XWFPricingTiers` and `XWFHealthCheck` compose actual XWUICard and other basic primitives. They do not replace those primitives with imitation markup.
- `XWFContrastCheck` derives WCAG relative luminance and uses an actual XWUITable and statuses for its output.
- The quickstart is an ordered documentation list with independent rich cards/code blocks. It is not a wizard with a current/completed step; native ordered-list semantics preserve readable documentation. The numbered circles and connecting line are decorative.
- Current CDN `XWUIDisplayStatus` is an abstract base. Owned pages use `XWUIDisplayStatusPill` and explicitly link the shared status stylesheet, since the inferred Pill stylesheet path is absent.
- The current overlay schema requires calling `.open()`. An owned modal helper does so, resolves actions and destroys the overlay on page disposal; the shared helper fix is requested separately.

## Validation completed

- Seven API tests pass: catalog filtering/pagination/clones/manifest, brand validation and reimport persistence, filtered CSV and formula escaping, SIEM validation/persistence, health recovery and idempotence, access requests and quote validation, independent failures without mutation corruption.
- JavaScript syntax checks pass for all owned source files.
- Browser review covered Landing, Integrations, Pricing, Self-host, Overview, Branding, Audit, Health, Quotas denied and an Admin placeholder at 1440px and 1024px. No horizontal document overflow, broken images or browser errors were observed.
- Exercised sandbox run; category/search/empty reset and details dialog; quote validation/success; clipboard copying; branding edits, palette colors, font, real SVG file chooser, fictional samples, removal, save/reload; audit filters/pagination/CSV/SIEM; health recheck/cancel/confirm/pause/drain; access request; independent panel retry; persisted RTL navigation with the graph kept LTR; and an Admin receipt link into Studio.
- Review screenshots and metrics are stored outside the repository in `../xwflow-preview/`. Full asset contact sheets and structural checks are in `../xwflow-asset-review/`.

## Assumptions and intentionally incomplete areas

- Arabic mirrors layout and translates navigation; marketing body content remains English.
- Comparison, templates, capabilities, docs and security footer destinations have illustrative data-driven sections because their artboards are absent. FAQ is an added data-driven section requested in the task.
- Subpages reuse the complete website footer for consistent working navigation.
- Tenants, Credentials policy, Node registry, Adapters, Usage, AI governance, Schedules, Workers, All executions, Config and Backups have no supplied artboards and use the agreed placeholder.
- Branding/SIEM are locally enabled for this frontend demo while the reference commercial-tier note remains visible. Quotes, access requests and operational actions are local mock records; no email, live service command or SIEM transfer occurs.
- Missing Studio assistant/editor/notation destinations remain Claude's scope. Existing receipt IDs and flow IDs use the agreed contract. No shared core/theme/Studio files were edited by Codex.
