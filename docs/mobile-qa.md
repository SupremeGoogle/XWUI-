# Validation scope

Reviewed on 12 October 2026. Browser viewport checks do not replace physical
iOS/Android device testing or a complete pixel comparison of unavailable artboards.

## Final pre-submission pass

Run against the delivered tree with cleared browser storage.

- 37 destinations (Website, Studio, six diagram views, the eight Studio management
  sections, Admin/System, the eleven Admin management sections and an unknown route)
  load without script errors or unhandled rejections in `?mock=fast` and in normal
  asynchronous mode.
- At 375 × 812 and 1440 × 900 no page scrolls horizontally. Wide tables and diagrams
  scroll inside their panels. The table fix is described under
  "Known XWUI CDN issues" in the root README.
- End-to-end: run a flow with a reply-based Wait, see the waiting step in the editor
  run panel and in the receipt, approve it with confirmation, and see the decision
  (actor, time) appended to the ledger and the run finish. Covered from both the
  editor and the receipt page.
- Management pages: create a record through the dialog, see the list, KPIs and
  row count update and persist across reloads.
- Error handling: `?mock=flaky` and `#/admin?failPanel=chart` show recoverable errors
  with "Try again"; other panels stay readable.

## Earlier responsive passes

Fast mode covered 360 × 780, 390 × 844, 768 × 1024, 1024 × 900, 1440 × 1000,
1920 × 1080, 2560 × 1440 and 2880 × 1647; normal asynchronous API mode covered the
first five. The landing scene was checked at 17 widths from 320 to 3440 px; its ring
and nodes scale together and cards remain above the ring. Phone panels and dialogs
remain reachable; tablet Fit keeps the graph within the space between panels.

## Interactions

- Sandbox run/reset/zoom; integration search, groups, empty state and Studio links.
- Create a flow; edit parameters/notes; connect AI yes/no/unsure outputs.
- Publish, restore a draft, run a published version and retry from a recorded step.
- Pause on a reply-based Wait; approve or reject from the editor or the receipt.
- Read receipt inputs, outputs, attempt history and AI verdict/model/token metadata.
- Collapse/expand the Studio rail across reloads; select inspector fields by labels.
- Create, edit, enable/disable, archive/restore and export management records.
- Validate branding/domain inputs, load sample logos and update the live preview.
- Validate and save a local quote request; filter and export audit events as CSV.
- Recover health checks; cancel an operational confirmation; request access.
- Navigate rapidly with delayed API responses; retry an independently failed panel.

## Automated checks

```bash
node --test src/core/router.test.mjs src/api/studio.test.mjs src/api/website-admin.test.mjs src/api/resources.test.mjs
```

38 tests cover immutable publication/receipts, retry payloads, waiting runs and
decisions, catalog consistency, branch routing, nested flows, persistence, validation,
exports, management resources and stale navigation. The delivery contains 158
JavaScript modules and 69 manifest assets; every module and stylesheet is referenced.

Known limitations and assumptions are listed in the root README. External services
are simulated by the local API; no live email, model or infrastructure action runs.
