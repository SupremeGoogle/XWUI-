# Validation scope

Reviewed on 12 October 2026. Browser viewport checks do not replace physical
iOS/Android device testing or a complete pixel comparison of unavailable artboards.

## Responsive pages

468 route checks passed across 36 destinations. Fast mode covered 360 × 780,
390 × 844, 768 × 1024, 1024 × 900, 1440 × 1000, 1920 × 1080,
2560 × 1440 and 2880 × 1647; normal asynchronous API mode covered the first five.
No failed page loads, broken image elements, document overflow or duplicate
route surfaces were observed. Wide tables and diagrams scroll inside their panels.

The routes include Website, Studio, six diagram views, Admin/System, all eleven
documented Admin placeholders, an unknown route and a malformed encoded flow ID.
After removing development-only material, another 74 route checks passed at
360 and 1440 px, including the removed developer route resolving to Not found.
The landing scene was additionally checked at 17 widths from 320 to 3440 px,
including intermediate widths. Its ring and nodes scale together; cards remain
above the ring. Phone panels and dialogs remain reachable; tablet Fit keeps the
graph within the space between panels.

## Interactions

- Sandbox run/reset/zoom; integration search, groups, empty state and Studio links.
- Create a flow; edit parameters/notes; connect AI yes/no/unsure outputs.
- Publish, restore a draft, run a published version and retry from a recorded step.
- Read receipt inputs, outputs, attempt history and AI verdict/model/token metadata.
- Collapse/expand the Studio rail across reloads; select inspector fields by labels.
- Validate branding/domain inputs, load sample logos and update the live preview.
- Validate and save a local quote request; filter and export audit events as CSV.
- Recover health checks; cancel an operational confirmation; request access.
- Navigate rapidly with delayed API responses; retry an independently failed panel.

## Automated checks

```bash
node --test src/core/router.test.mjs src/api/studio.test.mjs src/api/website-admin.test.mjs
```

19 tests cover immutable publication/receipts, retry payloads, catalog consistency,
branch routing, nested flows, persistence, validation, exports and stale navigation.
JavaScript syntax and asset manifest paths/IDs/SVG structure were also checked.
The delivery contains 123 JavaScript modules and 69 manifest assets; all local
module and stylesheet references resolve.

Known limitations and assumptions are listed in the root README. External services
are simulated by the local API; no live email, model or infrastructure action runs.
