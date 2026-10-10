# xwflow

A working frontend for **xwflow**, a workflow orchestration system: define a process, publish a
version of it, run the published version, and keep a receipt of every run. Built from the
"xwflow web: website, studio, admin" prototype with **XWUI basic components** loaded from the CDN.

> Work in progress. Setup, assumptions and incomplete items are completed at hand-in.

## Run it

No build step and no dependencies. Serve the folder with any static server:

```bash
python -m http.server 8080
```

Then open http://localhost:8080. Add `?mock=fast` to skip simulated latency.

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
