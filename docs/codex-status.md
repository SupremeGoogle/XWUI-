# Codex delivery status

Scope: Website, Admin, System health, and access denied. Branch: `codex/website-admin`.
Source reference: the supplied public artboards, downloaded outside this repository to `../xwflow-reference/`.

## Screen and interaction inventory

- Website layout: logo, seven navigation items, EN/AR direction and labels, sign in, start building, four footer link columns and wordmark. Landing anchors must work across routes.
- Landing: announcement; hero copy/actions; interactive isometric sandbox (reset, zoom, run); four statistics; scrolling step tags; prompt-to-flow and draft; receipt/state/keyboard/language/self-host bento; three-brand fan; 24 notations; ten migration dialects; final sandbox CTA; footer. Add data-driven destinations for comparison/templates/capabilities/docs/security anchors absent from the artboard.
- Integrations: title/statistics, search, category pills, connector cards, planned status, empty result, load more, connector detail/action.
- Pricing: Core/Commercial/White-label cards, comparison table, licensing note, FAQ, white-label CTA. Preserve placeholder prices from the reference; do not invent commercial prices. Billing controls only when present in the reference.
- Self-host: quickstart header, requirements, three install steps/code blocks, environment configuration, deployment checks, Core/Commercial note; copy commands with feedback.
- Admin layout: all Admin and System menu items, icons, active route, studio return. Shared layouts must survive navigation and clean up.
- Overview: four KPIs, hourly bars, isometric reachability, recent failed-run table and run links, storage warning, system health link.
- Branding: tenant name/domain, logo/favicon uploads and previews, four palette fields, font selection, switches, live preview, dirty status, WCAG contrast checks, persistent save.
- Audit: identity-audit notice, actor/class/action/object/date filters, search, events, pagination, filtered CSV download, persistent SIEM configuration dialog.
- Health: derived attention count, topology, 30-day uptime and logs, six checks, asynchronous check again, confirmation and persistent state for pause schedules/drain worker.
- Quotas denied: required/current/granting roles, next steps, idempotent persistent access request and sent state.
- Unspecified menu screens: one XWUI empty-state page with route-specific title.

## Architecture and coordination

- Runtime is plain browser ES modules and the XWUI **basic** CDN bundle only. No eXonware skills or MCP.
- Page content is supplied by domain APIs; data modules are never imported by UI modules.
- Use the shared core contract and existing component template. Custom visuals extend XWUIComponent with separate model/logic/view/CSS/documentation.
- The remote was empty at start. A read-only copy of Claude's uncommitted scaffold is used locally for integration checks, excluded from Codex commits. Rebase onto `origin/main` when published.
- Only files owned by Codex will be committed. Shared-core changes will be requested in `docs/requests-to-claude.md`.

## Progress

- Reference artboards and XWUI documentation downloaded; scaffold contract inspected.
- Implementation in progress.

## Assumptions and incomplete scope

- Arabic supports mirrored layout and translated navigation labels; marketing body remains English.
- Prototype placeholder values remain visibly identified as sample/catalog/licensing values.
- Comparison/templates/capability/docs/security content is illustrative because only footer links are provided in the reference.
- Tenants, Credentials policy, Node registry, Adapters, Usage, AI governance, Schedules, Workers, All executions, Config, and Backups have no artboards and use the agreed placeholder screen.

## Validation

Pending API checks and browser verification at 1440px and 1024px.
