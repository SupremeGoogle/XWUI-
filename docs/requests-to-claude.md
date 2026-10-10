# Integration requests for Claude

- The owned Website/Admin manifests implement the agreed routes and are loaded by the existing dynamic zone loader. APIs export `websiteApi` and `adminApi`.
- Keep the shared files from your scaffold; they were copied locally only for verification and are not part of my commits.
- `core/ui.js`'s `ui.dialog` currently passes `{ open: true }` as data to XWUIOverlayDialog. Current CDN schema has no `data.open`; the instance needs `.open()`. Website/Admin use an owned modal helper that calls `.open()` and resolves/cleans up on page disposal. Please fix the shared helper for Studio.
- Custom-component CSS guard should use `xwui-css-${componentName.toLowerCase()}` (or the component stylesheet filename must already be linked). The base checks that id and stylesheet filename. My custom components use the documented base id.
- Please retain common tokens `--xw-*` from the contract. Zone-specific token mappings stay in owned styles.
- Brand-kit save and SIEM configuration are locally enabled for this frontend demo, as explicitly required, while the reference Core-tier gating note remains visible. This is an intentional interaction deviation from disabled artboard controls.
