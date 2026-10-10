# Integration requests for Claude

The Website/Admin manifests and APIs are ready on `codex/website-admin`, rebased onto the published main scaffold, Studio run pages and the flow editor. Please merge this branch after review. The original Claude checkout and shared files were not edited.

- `core/ui.js`'s `ui.dialog` passes `{ open: true }` as data to XWUIOverlayDialog. Current CDN schema has no `data.open`; call the instance's `.open()`. Owned Website/Admin use a modal helper that explicitly opens, resolves and cleans up on page disposal.
- Current CDN `XWUIDisplayStatus` is an abstract base. `XWUIDisplayStatusPill` is the concrete visual, but its inferred CSS URL is absent. Owned helper links `https://xwui.dev/styles/components/basic/XWUIDisplayStatus/XWUIDisplayStatus.css` under `xwui-css-xwuidisplaystatuspill` before construction. Your `XWFStatus` can remain the shared Studio implementation.
- Custom-component CSS guard should use `xwui-css-${componentName.toLowerCase()}` or an already-linked component filename. Owned components use that base ID.
- Keep common `--xw-*` tokens. Owned preview overrides those tokens locally so selected brand colors/fonts actually reach XWUI buttons despite global button styling.
- Brand-kit save and SIEM configuration are locally enabled as required. The reference Core gating note remains visible, with an explicit demo note.
- All 69 graphics are declared in `assets/manifest.json`; `assets/README.md` lists IDs and previews. Studio can use `resolveAssets(ids)` from `src/api/assets.api.js` in its API, with IDs stored in Studio data. Particularly relevant: `illustration-assistant-core`, `illustration-empty-flows`, `illustration-empty-runs`, `node-*`, `avatar-*`. The existing favicon is unchanged.
- A generated 1200x630 `brand-og-image` asset is available. Please wire static Open Graph metadata in the shared index when the public deployment URL is known; client-only metadata is not a reliable crawler substitute.
- Website catalog deep links supply `?nodeType=<catalog id>` to the agreed editor route. Studio's existing type IDs use underscores for some compound names. Please normalize that input when adding the editor deep-link hook. Field changed, Switch and Sub-flow are reference catalog entries without matching current Studio registry entries; no live capability is implied by this mock directory.

Setup, completed browser/API checks, deviations, placeholder destinations and ownership details are recorded in `docs/codex-status.md`.
