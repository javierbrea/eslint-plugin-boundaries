# AGENTS Instructions — `website`

Package-scoped agent instructions for the `website` package (Nx project `website`), a Docusaurus site publishing `jsboundaries.dev`. See `.agents/rules/docs-authoring.md` for the working-vs-versioned docs split, which applies here.

## Versioning

The website's version and the release steps that change it are in step 2 of "Publishing" in `.github/CONTRIBUTING.md`, run by the `release` skill.

## Structure

- `docs/` is the current, unreleased documentation, organized by topic (`classification`, `guides`, `policies`, `rules`, `selectors`, `settings`, …); `sidebars.ts` defines its navigation.
- `versioned_docs/version-<X.Y.Z>/` + `versioned_sidebars/` + `versions.json` are per-release snapshots created by Docusaurus' own versioning command. The snapshot of the latest release (the first entry in `versions.json`) is the published documentation: a change to it (a fix, a clarification, a missing page) is made in that snapshot and its sidebar, and the same change is made in `docs/`, so both stay aligned and the next release keeps it. A change that only describes unreleased behavior goes in `docs/` alone. Snapshots of older releases are never edited.
- `algolia-config.json` is the configuration of the Algolia search index scraper.

## Source layering

`src/` is split into element types whose allowed imports are lint-enforced with the workspace `eslint-plugin-boundaries`; read `eslint.config.mjs` for the policy in force, and classify a new folder there before using it. Imports inside `src/` are relative; `@site/...` is reserved for MDX docs.

## Playground

The code of the playground lives in `packages/playground` only. The site loads two of its entries:

- `@boundaries/playground`, the component, loads only lazily on its page. `src/pages/playground.tsx` is its host: it renders the component in the browser only (`BrowserOnly` and `React.lazy`), creates its source and store inside the lazy chunk, and no file under `src/` imports a value from this entry statically (lint-enforced in `eslint.config.mjs`), so that no other page loads the chunk. MDX docs import docs components only, never the package.
- `@boundaries/playground/share` is the light entry that docs components import statically, such as `src/components/OpenInPlayground`, which computes its link while the page renders.

The docs of the playground, its guide and its "Open in playground" buttons, go in `docs/` and in the snapshot of the latest release alike, because the playground is deployed with the site and not released with a package.

## Playwright page objects

- The `website/playwright` entry (`src/playwright.ts`, `exports["./playwright"]` in `package.json`) exports the Playwright page objects of the site's own components and pages, for the browser specs. It runs in Node.js, inside the Playwright runner, and never in the site. `.agents/rules/playwright-testing.md` covers its files and its build.
- A test id that a page object reads is a constant in `X.constants.ts` beside the component, which the component and its page object import.
- No page object or constants file may become a route. Docusaurus makes a route of every file under `src/pages/` that the `pages.exclude` of `docusaurus.config.ts` misses, so a kind of file that is not a page is added to that list before it is created in `src/pages/`.
