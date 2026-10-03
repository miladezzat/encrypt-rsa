# Contributing to the docs

The site uses [VitePress](https://vitepress.dev), an open-source static documentation framework. Markdown sources and theme configuration live in `documentation/`; generated output lives in `docs/` for the existing GitHub Pages deployment.

## Local preview

```bash
npm ci
npm run docs:serve
```

Open `http://localhost:3000`. Changes to Markdown and the theme update the preview automatically.

## Build and validate

```bash
npm run build
npm run docs
npm run smoke:docs
npx playwright install chromium
npm run smoke:docs:browser
npm run docs:preview
```

`docs` builds a static site, copies the custom domain and `.nojekyll` marker, and creates redirects for old Compodoc links. The static smoke check validates local pages, assets, anchors, and public API coverage. The browser check exercises navigation, local search, code copying, theme switching, mobile layout, and legacy redirects.

Commit source edits and regenerated `docs/` together. GitHub Pages publishes `master` → `/docs`, retaining `encrypt-rsa.js.org`. The test pipeline rebuilds and validates the site on Node 22 and 24 before merge. The npm package includes compiled library outputs only; documentation tooling remains a development dependency.

## Keep the API accurate

Update the [NodeRSA reference](./api/reference.md) and guides when behavior changes. The [types page](./api/types.md) includes the shared source contracts directly. Changelog and license pages include the root files rather than maintaining duplicate copies. Local search runs in the browser without an external search service.
