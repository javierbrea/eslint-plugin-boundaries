# Website E2E Tests

This private project is the sanity suite of the website and the playground: it opens the production build of `packages/website` in Chromium, at a desktop and a narrow viewport, and checks that its pages work. It checks the site as a whole; the detailed behavior of the playground stays in its jsdom specs, and the browser builds of the packages are checked by `test/browser-e2e`.

## How it works

1. **Build**: `test:e2e` first builds the production site (`website`, which builds the playground it bundles) and the Playwright page objects of `@boundaries/playground/playwright` and `website/playwright` (`build:playwright`). Nx caches all of them.
2. **Server**: `playwright.config.ts` starts `docusaurus serve` on port 4310 for the `build` folder of the website. It is not port 3000, where `pnpm nx start website` serves the dev site, so a site that is already running never answers the suite.
3. **Projects**: `desktop` runs at 1440×900 and `narrow` at 390×844, both as Desktop Chrome. A spec tagged `@desktop` runs only in `desktop`, and one tagged `@narrow` only in `narrow`.
4. **Specs**: they reach the page through page objects, which live beside their components, and use the fixtures of `test/fixtures.ts`.

## What it covers

| Spec | Project | What it checks |
|---|---|---|
| `test/website.spec.ts` | `desktop` | The navbar leads from the home to the docs, and the docs sidebar to the Quick start. Below 997 px both move into a menu, which the page objects do not describe. |
| `test/website.spec.ts` | both | `/this-page-does-not-exist/` answers 404 with the 404 page of the site, whose link leads back to the docs; `/` and `/docs/quick-start/` hydrate without an error; none of these pages starts a web worker. |
| `test/playground.spec.ts` | `desktop` | `/playground/` without a hash opens the Quick start example, whose tree, status and problems agree; a file opened from the tree is the one the node pane and the inspector describe; the example picker opens another example and writes it to the hash; Help opens, links to the playground guide and closes; Reset brings the Quick start back; a reload keeps the project. |
| `test/open-in-playground.spec.ts` | `desktop` | The Open in playground button of the Quick start opens its project, after a client-side navigation and when its link is pasted into the address bar of the open playground, and not the example that the page showed before. |
| `test/share.spec.ts` | `desktop` | Share reads `Copied`, and the copied link opens the same project and config in a browser context with empty storage. |
| `test/playground-chunk.spec.ts` | `narrow` | `/playground/` shows the desktop-only note, renders no playground, starts no web worker and never requests the chunk of the playground. |
| `test/playground-chunk.spec.ts` | `desktop` | The control of the test above: on a wide screen the same detection finds the chunk, and the page starts one web worker. |

The playground keeps the last project in memory, per page document, never in the storage of the browser. So a spec that needs a project the page remembers picks another example on the same page and then navigates without loading a document, which `documentLoads` checks. It waits for the project to reach the hash before it leaves.

Every test also fails on a console error or a page error. The errors of requests to `api.github.com` and `api.npmjs.org` (the live stats of the site fall back to static values when they fail) and the 404 status of the document of `/this-page-does-not-exist/`, which the specs visit to see the 404 page, are the only ones left out.

## Run tests

```bash
pnpm nx test:e2e website-e2e
```

The first run downloads Chromium. On Linux, install its system dependencies once with `pnpm exec playwright install --with-deps chromium`.

To run one spec or one project, build the dependencies once and run Playwright from this folder:

```bash
pnpm nx run-many -t build:playwright -p playground website
pnpm nx build website
cd test/website-e2e
pnpm exec playwright test test/playground-chunk.spec.ts --project=narrow
```

`pnpm exec playwright test --ui` opens the Playwright UI, and `--debug` runs a test step by step. Run `pnpm nx build website` again after a change in the site or in the playground, since the suite serves the build.

## Reading a failure

- A failure names the project (`[desktop]` or `[narrow]`), the spec and the test, and shows the line of the assertion that failed.
- `The pages logged errors to the console or threw them` is the `pageErrors` fixture: the list below it holds each error with the URL of the resource it points at. Fix the page; never add an exception for it in a spec.
- A page object that cannot find its element fails with the assertion of its waiting method, which names what it waited for. A change in the DOM of a component updates the page object beside it, never the spec.
- Each failed test leaves `test-results/<test>/` with an `error-context.md` that holds a snapshot of the page. In CI, a test that fails is retried once with a trace, which `pnpm exec playwright show-trace <trace.zip>` opens. A test that passes only on the retry is a defect to fix.

## Adding a spec

1. Add `test/<name>.spec.ts`. Import `test` and `expect` from `./fixtures`, and reach the page through the page objects the fixtures give, such as `playgroundPage`, `navbar` or `docItem`. Open another tab or a fresh browser context with `openPlaygroundTab` or `openPlaygroundInFreshContext`, which return the page object of the page they open. Steps that several specs share, made of page object calls, go in `test/support/`, such as `test/support/playground.ts`. No file of `test/` holds a locator, selector or fixed wait, no spec imports `@playwright/test`, and no file imports the playground or the site other than through their `./playwright` entries: `eslint.config.js` fails them.
2. Name the test after what the user sees. Tag it `{ tag: "@desktop" }` when it needs the panes of the playground, or `{ tag: "@narrow" }` when it needs the narrow page.
3. A page that a spec visits is reached with `page.goto("/path/")`. Wait for what settles through a waiting method of a page object or `expect.poll` over a value getter of one.

## Adding a page object

A page object never goes in this project. Add `X.pom.playwright.ts` beside the component it describes, in `packages/playground` (a component of the playground, mirrored from its jsdom sibling `X.pom.ts`) or in `packages/website` (a component or page of the site, with no jsdom sibling), and export it from the `src/playwright.ts` of that package. `.agents/rules/playwright-testing.md` has the details. To give specs a root page object, add a fixture for it in `test/fixtures.ts`.
