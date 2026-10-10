# xwflow Neon Depth assets

69 static assets for the website, Studio and Admin. The existing `assets/favicon.svg` is intentionally unchanged and is not part of this manifest.

## Connect assets by ID

`manifest.json` contains `{ version: 1, assets: [...] }`. Each entry provides `id`, project-relative `path`, `kind`, English `alt`, intrinsic `width` and `height`, and `tones` (palette token names; `currentColor` for the monochrome brand).

Store only an asset ID in a `src/data/*.data.js` record, for example `heroAssetId: 'illustration-hero-flow'`. The shared asset renderer resolves the ID in the manifest, uses the resolved path for `src`, and forwards the manifest dimensions and alt text. Do not write asset paths directly in page templates.

```js
const assetsById = new Map(manifest.assets.map(asset => [asset.id, asset]));
const asset = assetsById.get(pageData.heroAssetId);
if (!asset) throw new Error(`Unknown asset ID: ${pageData.heroAssetId}`);
// Shared renderer: <img src={asset.path} alt={asset.alt}
//                      width={asset.width} height={asset.height} />
```

For decorative images, the renderer may set `alt=""` deliberately. For the recolorable `brand-logo-mono`, render the SVG inline through the trusted local asset renderer; `currentColor` does not inherit into an external `<img>`. Raster images cannot be recolored with `currentColor`.

## Visual system

Transparent illustrations use dark translucent glass, isometric planes, soft static glow and a shared line style. Integration icons use 2-unit strokes in a 24-unit pictogram, 13-unit tile rounding, and neutral category symbols. Node tiles use the same pictograms at 64 × 64. Trigger lime, control orange, data violet, AI pink and app cyan are fixed group colors.

Only the requested palette is used in SVG color declarations. Gradient interpolation, opacity, glow and WebP compression naturally produce intermediate rendered colors. The linear brand gradient is 100 degrees, cyan → violet → pink → orange. The brand mark preserves the prototype's conic spectrum and dark inset. SVG text is represented by original geometric paths. All assets are static and have accessible titles; no scripts, embedded fonts, external references or SVG animation.

Repeat `pattern-dot-grid` at 24 × 24 and `pattern-line-grid` at 48 × 48 with CSS background repeat. For the floor, transform the containing background plane with perspective. Repeat `pattern-noise` at 128 × 128. Its opposite edges match so there is no seam. Animations, if added by the app, must respect `prefers-reduced-motion`.

The OG preview was generated with the built-in ImageGen tool and optimized as WebP at 1200 × 630. Prompt: polished Neon Depth glass workflow tiles connected by neon cables on #05050a, accurate lowercase “xwflow”, isometric depth, cyan/violet/pink/orange/lime only, no real logos or people. All other assets are original native vectors, apart from a deterministic transparent grain texture.

Studio-ready assets: `illustration-assistant-core`, `illustration-empty-flows`, `illustration-empty-runs`, and all `node-*` IDs. Website/Admin integration remains in their respective data files.

## Preview inventory

The preview thumbnails below have transparent backgrounds; view the collection on #05050a or a glass card for intended appearance.

| Preview | ID | Kind | Dimensions | Tones |
| --- | --- | --- | --- | --- |
| <img src="avatars/avatar-1.svg" alt="Abstract geometric avatar 1" width="72" height="44" /> | `avatar-1` | avatar | 64 × 64 | cyan, blue, text, bg |
| <img src="avatars/avatar-2.svg" alt="Abstract geometric avatar 2" width="72" height="44" /> | `avatar-2` | avatar | 64 × 64 | violet, pink, text, bg |
| <img src="avatars/avatar-3.svg" alt="Abstract geometric avatar 3" width="72" height="44" /> | `avatar-3` | avatar | 64 × 64 | pink, orange, text, bg |
| <img src="avatars/avatar-4.svg" alt="Abstract geometric avatar 4" width="72" height="44" /> | `avatar-4` | avatar | 64 × 64 | lime, green, text, bg |
| <img src="avatars/avatar-5.svg" alt="Abstract geometric avatar 5" width="72" height="44" /> | `avatar-5` | avatar | 64 × 64 | blue, violet, text, bg |
| <img src="avatars/avatar-6.svg" alt="Abstract geometric avatar 6" width="72" height="44" /> | `avatar-6` | avatar | 64 × 64 | green, cyan, text, bg |
| <img src="avatars/avatar-7.svg" alt="Abstract geometric avatar 7" width="72" height="44" /> | `avatar-7` | avatar | 64 × 64 | cyan, blue, text, bg |
| <img src="avatars/avatar-8.svg" alt="Abstract geometric avatar 8" width="72" height="44" /> | `avatar-8` | avatar | 64 × 64 | violet, pink, text, bg |
| <img src="brand/logo-full.svg" alt="xwflow" width="72" height="44" /> | `brand-logo-full` | brand | 340 × 64 | cyan, violet, pink, orange, lime, bg, text |
| <img src="brand/logo-mark.svg" alt="xwflow neon spectrum mark" width="72" height="44" /> | `brand-logo-mark` | brand | 64 × 64 | cyan, violet, pink, orange, lime, bg, text |
| <img src="brand/logo-mono.svg" alt="xwflow monochrome mark and word" width="72" height="44" /> | `brand-logo-mono` | brand | 340 × 64 | currentColor |
| <img src="brand/og-image.webp" alt="xwflow with luminous connected glass workflow nodes" width="72" height="44" /> | `brand-og-image` | brand | 1200 × 630 | cyan, violet, pink, orange, lime, bg, bg2, bg3, text |
| <img src="illustrations/assistant-core.svg" alt="Luminous assistant sphere with three orbital rings" width="72" height="44" /> | `illustration-assistant-core` | illustration | 480 × 320 | cyan, violet, pink, text, bg3 |
| <img src="illustrations/denied-lock.svg" alt="Glass access lock with protective neon orbits" width="72" height="44" /> | `illustration-denied-lock` | illustration | 480 × 320 | cyan, violet, pink, text, bg2, bg3 |
| <img src="illustrations/empty-flows.svg" alt="Three unconnected workflow tiles ready for a new flow" width="72" height="44" /> | `illustration-empty-flows` | illustration | 480 × 320 | cyan, violet, pink, bg2, bg3 |
| <img src="illustrations/empty-generic.svg" alt="Empty glass container surrounded by a neon orbit" width="72" height="44" /> | `illustration-empty-generic` | illustration | 480 × 320 | cyan, violet, pink, bg2, bg3 |
| <img src="illustrations/empty-runs.svg" alt="Glass play button waiting for the first workflow run" width="72" height="44" /> | `illustration-empty-runs` | illustration | 480 × 320 | cyan, violet, lime, bg2, bg3 |
| <img src="illustrations/empty-search.svg" alt="Floating magnifying glass with no search results" width="72" height="44" /> | `illustration-empty-search` | illustration | 480 × 320 | cyan, violet, muted, bg2, bg3 |
| <img src="illustrations/health-alert.svg" alt="Alerting red heartbeat on a floating glass health panel" width="72" height="44" /> | `illustration-health-alert` | illustration | 480 × 320 | red, muted, bg2, bg3 |
| <img src="illustrations/health-ok.svg" alt="Healthy green heartbeat on a floating glass health panel" width="72" height="44" /> | `illustration-health-ok` | illustration | 480 × 320 | green, muted, bg2, bg3 |
| <img src="illustrations/hero-flow.svg" alt="Floating glass workflow nodes linked by neon cables" width="72" height="44" /> | `illustration-hero-flow` | illustration | 720 × 400 | lime, cyan, violet, pink, orange, bg2, bg3 |
| <img src="illustrations/not-found.svg" alt="Lost workflow node with a broken neon connection" width="72" height="44" /> | `illustration-not-found` | illustration | 480 × 320 | cyan, violet, pink, amber, muted, bg2, bg3 |
| <img src="illustrations/pricing-cube.svg" alt="Customizable neon glass cube for white-label plans" width="72" height="44" /> | `illustration-pricing-cube` | illustration | 480 × 320 | cyan, violet, pink, orange, bg3 |
| <img src="illustrations/self-host-servers.svg" alt="Stack of three illuminated isometric server plates" width="72" height="44" /> | `illustration-self-host-servers` | illustration | 480 × 320 | cyan, violet, lime, bg2, bg3 |
| <img src="integrations/accounting.svg" alt="Accounting integration category" width="72" height="44" /> | `integration-accounting` | integration | 48 × 48 | green, cyan, text, bg3 |
| <img src="integrations/ai-model.svg" alt="Ai Model integration category" width="72" height="44" /> | `integration-ai-model` | integration | 48 × 48 | lime, green, text, bg3 |
| <img src="integrations/analytics.svg" alt="Analytics integration category" width="72" height="44" /> | `integration-analytics` | integration | 48 × 48 | violet, pink, text, bg3 |
| <img src="integrations/auth.svg" alt="Auth integration category" width="72" height="44" /> | `integration-auth` | integration | 48 × 48 | lime, green, text, bg3 |
| <img src="integrations/calendar.svg" alt="Calendar integration category" width="72" height="44" /> | `integration-calendar` | integration | 48 × 48 | violet, pink, text, bg3 |
| <img src="integrations/chat.svg" alt="Chat integration category" width="72" height="44" /> | `integration-chat` | integration | 48 × 48 | cyan, blue, text, bg3 |
| <img src="integrations/crm.svg" alt="Crm integration category" width="72" height="44" /> | `integration-crm` | integration | 48 × 48 | pink, orange, text, bg3 |
| <img src="integrations/database.svg" alt="Database integration category" width="72" height="44" /> | `integration-database` | integration | 48 × 48 | blue, violet, text, bg3 |
| <img src="integrations/email.svg" alt="Email integration category" width="72" height="44" /> | `integration-email` | integration | 48 × 48 | violet, pink, text, bg3 |
| <img src="integrations/files.svg" alt="Files integration category" width="72" height="44" /> | `integration-files` | integration | 48 × 48 | cyan, blue, text, bg3 |
| <img src="integrations/forms.svg" alt="Forms integration category" width="72" height="44" /> | `integration-forms` | integration | 48 × 48 | pink, orange, text, bg3 |
| <img src="integrations/git.svg" alt="Git integration category" width="72" height="44" /> | `integration-git` | integration | 48 × 48 | cyan, blue, text, bg3 |
| <img src="integrations/hr.svg" alt="Hr integration category" width="72" height="44" /> | `integration-hr` | integration | 48 × 48 | blue, violet, text, bg3 |
| <img src="integrations/http.svg" alt="Http integration category" width="72" height="44" /> | `integration-http` | integration | 48 × 48 | blue, violet, text, bg3 |
| <img src="integrations/maps.svg" alt="Maps integration category" width="72" height="44" /> | `integration-maps` | integration | 48 × 48 | violet, pink, text, bg3 |
| <img src="integrations/marketing.svg" alt="Marketing integration category" width="72" height="44" /> | `integration-marketing` | integration | 48 × 48 | lime, green, text, bg3 |
| <img src="integrations/monitoring.svg" alt="Monitoring integration category" width="72" height="44" /> | `integration-monitoring` | integration | 48 × 48 | green, cyan, text, bg3 |
| <img src="integrations/payments.svg" alt="Payments integration category" width="72" height="44" /> | `integration-payments` | integration | 48 × 48 | cyan, blue, text, bg3 |
| <img src="integrations/queue.svg" alt="Queue integration category" width="72" height="44" /> | `integration-queue` | integration | 48 × 48 | blue, violet, text, bg3 |
| <img src="integrations/sheets.svg" alt="Sheets integration category" width="72" height="44" /> | `integration-sheets` | integration | 48 × 48 | lime, green, text, bg3 |
| <img src="integrations/sms.svg" alt="Sms integration category" width="72" height="44" /> | `integration-sms` | integration | 48 × 48 | pink, orange, text, bg3 |
| <img src="integrations/storage.svg" alt="Storage integration category" width="72" height="44" /> | `integration-storage` | integration | 48 × 48 | green, cyan, text, bg3 |
| <img src="integrations/support.svg" alt="Support integration category" width="72" height="44" /> | `integration-support` | integration | 48 × 48 | pink, orange, text, bg3 |
| <img src="integrations/webhook.svg" alt="Webhook integration category" width="72" height="44" /> | `integration-webhook` | integration | 48 × 48 | green, cyan, text, bg3 |
| <img src="nodes/ai-condition.svg" alt="Ai Condition workflow step" width="72" height="44" /> | `node-ai-condition` | node | 64 × 64 | pink, bg2, bg3 |
| <img src="nodes/append-row.svg" alt="Append Row workflow step" width="72" height="44" /> | `node-append-row` | node | 64 × 64 | cyan, bg2, bg3 |
| <img src="nodes/code.svg" alt="Code workflow step" width="72" height="44" /> | `node-code` | node | 64 × 64 | violet, bg2, bg3 |
| <img src="nodes/condition.svg" alt="Condition workflow step" width="72" height="44" /> | `node-condition` | node | 64 × 64 | orange, bg2, bg3 |
| <img src="nodes/http-request.svg" alt="Http Request workflow step" width="72" height="44" /> | `node-http-request` | node | 64 × 64 | cyan, bg2, bg3 |
| <img src="nodes/merge.svg" alt="Merge workflow step" width="72" height="44" /> | `node-merge` | node | 64 × 64 | orange, bg2, bg3 |
| <img src="nodes/post-message.svg" alt="Post Message workflow step" width="72" height="44" /> | `node-post-message` | node | 64 × 64 | cyan, bg2, bg3 |
| <img src="nodes/schedule.svg" alt="Schedule workflow step" width="72" height="44" /> | `node-schedule` | node | 64 × 64 | lime, bg2, bg3 |
| <img src="nodes/send-email.svg" alt="Send Email workflow step" width="72" height="44" /> | `node-send-email` | node | 64 × 64 | cyan, bg2, bg3 |
| <img src="nodes/set-fields.svg" alt="Set Fields workflow step" width="72" height="44" /> | `node-set-fields` | node | 64 × 64 | violet, bg2, bg3 |
| <img src="nodes/wait.svg" alt="Wait workflow step" width="72" height="44" /> | `node-wait` | node | 64 × 64 | orange, bg2, bg3 |
| <img src="nodes/webhook.svg" alt="Webhook workflow step" width="72" height="44" /> | `node-webhook` | node | 64 × 64 | lime, bg2, bg3 |
| <img src="patterns/dot-grid.svg" alt="Seamless subtle violet dot grid" width="72" height="44" /> | `pattern-dot-grid` | pattern | 24 × 24 | violet |
| <img src="patterns/line-grid.svg" alt="Seamless subtle cyan floor line grid" width="72" height="44" /> | `pattern-line-grid` | pattern | 48 × 48 | cyan |
| <img src="patterns/noise.webp" alt="Seamless transparent fine monochrome grain texture" width="72" height="44" /> | `pattern-noise` | pattern | 128 × 128 | text |
| <img src="branding-samples/sample-favicon-1.svg" alt="Prism Works fictional favicon" width="72" height="44" /> | `sample-favicon-1` | sample | 48 × 48 | cyan, violet, bg3 |
| <img src="branding-samples/sample-favicon-2.svg" alt="Orbit Labs fictional favicon" width="72" height="44" /> | `sample-favicon-2` | sample | 48 × 48 | orange, pink, bg3 |
| <img src="branding-samples/sample-favicon-3.svg" alt="Evergrid fictional favicon" width="72" height="44" /> | `sample-favicon-3` | sample | 48 × 48 | lime, green, bg3 |
| <img src="branding-samples/sample-logo-1.svg" alt="Prism Works fictional geometric logo" width="72" height="44" /> | `sample-logo-1` | sample | 176 × 40 | cyan, violet, text |
| <img src="branding-samples/sample-logo-2.svg" alt="Orbit Labs fictional geometric logo" width="72" height="44" /> | `sample-logo-2` | sample | 176 × 40 | orange, pink, text |
| <img src="branding-samples/sample-logo-3.svg" alt="Evergrid fictional geometric logo" width="72" height="44" /> | `sample-logo-3` | sample | 176 × 40 | lime, green, text |
