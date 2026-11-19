# AGENTS Instructions — `website`

Package-scoped agent instructions for the `website` package (Nx project `website`), a Docusaurus site publishing `jsboundaries.dev`. See `.agents/rules/docs-authoring.md` for the working-vs-versioned docs split, which applies here.

## Versioning

The website's version and the release steps that change it are in step 2 of "Publishing" in `.github/CONTRIBUTING.md`, run by the `release` skill.

## Structure

- `docs/` is the current, unreleased documentation, organized by topic (`classification`, `guides`, `policies`, `rules`, `selectors`, `settings`, …); `sidebars.ts` defines its navigation.
- `versioned_docs/version-<X.Y.Z>/` + `versioned_sidebars/` + `versions.json` are per-release snapshots created by Docusaurus' own versioning command. The snapshot of the latest release (the first entry in `versions.json`) is the published documentation: a change to it (a fix, a clarification, a missing page) is made in that snapshot and its sidebar, and the same change is made in `docs/`, so both stay aligned and the next release keeps it. A change that only describes unreleased behavior goes in `docs/` alone. Snapshots of older releases are never edited.
- `algolia-config.json` is the configuration of the Algolia search index scraper.
- The design tokens and the fonts come from `@boundaries/design-tokens` (`packages/design-tokens`), which `docusaurus.config.ts` loads in `customCss` and serves in `staticDirectories`; `src/css/` holds only the Infima mapping, the mapping of the `--cc-*` variables of vanilla-cookieconsent, and the site's own rules.

## Source layering

`src/` is split into element types whose allowed imports are lint-enforced with the workspace `eslint-plugin-boundaries`; read `eslint.config.mjs` for the policy in force, and classify a new folder there before using it. Imports inside `src/` are relative; `@site/...` is reserved for MDX docs.

## Playground

The code of the playground lives in `packages/playground` only. The site loads two of its entries:

- `@boundaries/playground`, the component, loads only lazily on its page. `src/pages/playground.tsx` is its host: it renders the component in the browser only (`BrowserOnly` and `React.lazy`), creates its source and store inside the lazy chunk, and no file under `src/` imports a value from this entry statically (lint-enforced in `eslint.config.mjs`), so that no other page loads the chunk. MDX docs import docs components only, never the package.
- `@boundaries/playground/share` is the light entry that docs components import statically, such as `src/components/OpenInPlayground`, which computes its link while the page renders.

The docs of the playground, its guide and its "Open in playground" buttons, go in `docs/` and in the snapshot of the latest release alike, because the playground is deployed with the site and not released with a package.

## Consent and analytics

- Neither analytics service is a Docusaurus plugin, and both load only where `location.hostname` is `PRODUCTION_HOSTNAME`, the gate of `src/client/analytics.ts`, so deploy previews, local builds and the test suite are never counted. Google Analytics sets cookies, so `src/client/consent.ts` is the only code that loads it, only while the `analytics` category of the consent library (vanilla-cookieconsent) is accepted. Cloudflare Web Analytics stores nothing in the browser, so the client module `src/client/web-analytics.ts` loads it on every page of every build, whatever the consent.
- A build has a mode of Google Analytics: `opt-in` (the default), `opt-out` or `disabled`. Only `docusaurus.config.ts` reads the `DISABLE_CONSENT_BANNER` and `DISABLE_GOOGLE_ANALYTICS` variables, through `resolveGoogleAnalyticsMode` of `src/data/site/googleAnalyticsMode.ts`, which holds their precedence, and stores the mode in `customFields.googleAnalyticsMode`. Both are `env` inputs of the `build` target in `project.json`, so a cached build of another mode is never reused. What each mode gives a visitor, and where the deployment sets the variables: "Google Analytics settings" in `README.md`.
- Client code reads the mode from that field with `readGoogleAnalyticsMode`, never from `process.env`: `consent.ts` through `@generated/docusaurus.config`, since a client module cannot call hooks, and components through `useDocusaurusContext`.
- Only `consent.ts` loads the consent library, with `import()`, and only the `customCss` of `docusaurus.config.ts` loads its CSS, so that `disabled`, which leaves `consent.ts` out of `clientModules`, the CSS of the library and `src/css/cookieconsent-bridge.css` out of `customCss`, and the Cookie settings button out of the footer, bundles none of it. No `.ts` or `.tsx` file under `src/` imports the library or one of its files statically, types aside (lint-enforced in `eslint.config.mjs`), and no MDX page or stylesheet imports it either.
- The options of the library that differ with the mode come from `getConsentModeOptions` of `src/client/consent-options.ts`, whose TSDoc says why each one has its value.
- `src/client/consent.constants.ts` is shared by `docusaurus.config.ts` (which builds `url` from `PRODUCTION_HOSTNAME`), the client modules and the Playwright page objects.
- The `hideFromBots` default of the library keeps it from running for bots and for Playwright (`navigator.webdriver`): it shows them no banner and accepts no category, so Google Analytics stays off for them in every mode. The e2e suite and the screenshots script rely on it.
- The comments of `src/client/consent.ts` say how it fits the library to Docusaurus: the footer button's own attribute with a delegated listener, and the `show--*` classes kept on `<html>`.
- When a purpose of the `analytics` category changes, add a `revision` to the config of `consent.ts`, or raise it. In `opt-in` it asks everyone for consent again, as `src/pages/privacy.md` promises; in `opt-out`, which has no banner, it voids every saved choice, so Google Analytics runs again for the visitors who had turned it off.
- `src/pages/privacy.md` is outside the versioned docs and changes whenever a purpose, a cookie, a storage key or a service that the pages send data to changes. It describes the mode the site was built with: the text that holds only in some modes goes in a block of `src/components/site/GoogleAnalyticsModeContent` (`modes={[...]}`), and every heading stays outside the blocks, so that the anchors of the page are the same in every mode.

## Playwright page objects

- The `website/playwright` entry (`src/playwright.ts`, `exports["./playwright"]` in `package.json`) exports the Playwright page objects of the site's own components and pages, for the browser specs. It runs in Node.js, inside the Playwright runner, and never in the site. `.agents/rules/playwright-testing.md` covers its files and its build.
- A test id that a page object reads is a constant in `X.constants.ts` beside the component, which the component and its page object import.
- No page object or constants file may become a route. Docusaurus makes a route of every file under `src/pages/` that the `pages.exclude` of `docusaurus.config.ts` misses, so a kind of file that is not a page is added to that list before it is created in `src/pages/`.
- No page object or constants file may replace a theme component. Under `src/theme/`, `<Component>.tsx` and `<Component>/index.tsx` replace the Docusaurus component of that name, so a folder that holds only page objects or constants has no `index` file.
