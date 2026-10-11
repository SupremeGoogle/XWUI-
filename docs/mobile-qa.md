# Responsive QA

Verified on 11 October 2026 against `main`, using the browser at phone widths
360 × 780 and 390 × 844, and desktop widths 1024 × 1000 and 1440 × 1000.
These are browser viewport checks, not physical iOS/Android device tests.

## Route regression

All 23 routes below were opened at all four sizes in both `?mock=fast` and normal
API mode: **184 successful checks**. No page-load failures, broken image elements,
horizontal document overflow or new console errors were observed during the final pass.
Wide tables and notation drawings scroll inside their own surfaces.

| Screen | Route |
| --- | --- |
| Landing | `#/` |
| Integrations | `#/integrations` |
| Pricing | `#/pricing` |
| Self-host | `#/self-host` |
| Notations | `#/notations` |
| Assistant | `#/studio` |
| Saved chat | `#/studio?chat=c1` |
| Flows | `#/studio/flows` |
| Editor | `#/studio/flows/flow_order_alert` |
| Flowchart | `#/studio/flows/flow_order_alert/view/flowchart` |
| Swimlanes | `#/studio/flows/flow_order_alert/view/swimlane` |
| BPMN | `#/studio/flows/flow_order_alert/view/bpmn` |
| Sequence | `#/studio/flows/flow_order_alert/view/sequence` |
| Simulation | `#/studio/flows/flow_order_alert/view/sim` |
| 3D | `#/studio/flows/flow_order_alert/view/3d` |
| Runs | `#/studio/runs` |
| Receipt | `#/studio/runs/run_order_alert_001` |
| Connections | `#/studio/connections` |
| Overview | `#/admin` |
| Branding | `#/admin/branding` |
| Audit | `#/admin/audit` |
| Health | `#/system/health` |
| Access denied | `#/admin/quotas` |

## Visual and interaction review

- Reviewed full-page phone screenshots, including the top, middle and bottom of
  Website, Studio and Admin pages and all six notation renderers.
- Studio navigation uses the full phone width and a scrollable compact rail.
  Editor panels follow the canvas; controls, minimap and fitted graph share the
  layout's CSS safe-area settings. Existing desktop floating panels are retained.
- Phone dialogs use 16 px outer spacing; long bodies scroll while the action
  footer remains reachable. Help, Ask AI, Rename and Versions were exercised.
- Checked selection and inspector fields, palette layout, receipt timeline,
  Runs/Flows tables, gallery Code/List switching, pricing inputs and FAQ expansion.
- Checked filtered empty Flows/Runs with loaded manifest illustrations, the empty
  integrations state, and Arabic navigation with English content kept LTR.
- Increased button/tab touch areas, prevented sticky site navigation from taking
  up the phone viewport, stacked the three sample-brand cards and fitted the
  branding preview. 2D notation drawings retain readable scale with local scrolling;
  3D remains an overview with camera/orbit controls.

Desktop interaction review also covered moving a step, publishing version 4,
Ctrl Enter run, completed receipt, retry from a step and the new Runs record;
Ctrl K search, restoring a version, assistant add/explain, palette drag, pin
connection and Delete; bulk Retry/Delete and Add/Test/Reconnect connection.

## Additional checks

`node --test src/api/studio.test.mjs src/api/website-admin.test.mjs`: 12 passed.
All 128 source modules passed ES-module parsing. All 69 manifest entries passed
file, SVG title/viewBox, duplicate-ID and size-limit checks.

Review screenshots and the route metrics are kept outside the source repository
in `../xwflow-preview/`, including `final-route-checks.json`, `final-360-*.jpg`,
`final-390-*.jpg`, `mobile-dialog-360.jpg` and `final-editor-1024.jpg`.

## Coordination

Mobile changes are isolated in `src/styles/mobile.css`, its stylesheet link and
the canvas component's responsive safe-area support. Claude's active editor-page,
Studio layout and README work was not overwritten. Re-run this route matrix after
integrating subsequent changes from that branch.
