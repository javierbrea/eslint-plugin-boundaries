<!-- cspell:disable -->
# Phase 2: the home page

Goal: replace `src/pages/index.tsx` and its sections with the approved mockup, section by section, with live numbers, the navbar stars pill and the footer, plus the visual check script and the boundaries lint config for the website's own `src/`.

Read first: `../website-redesign.md`, `00-shared.md`, `packages/website/AGENTS.md`. Ground truth for layout, CSS values and copy: `mockups/mockup-b-blueprint.html` (open it in a browser too: the scratch script in section 10 wraps it in a doctype skeleton and renders it at both widths in both themes). Reference renders: `mockups/mockB-light.png`, `mockB-dark.png`; render the mobile views with the same script.

Phase 1 must be merged: this phase assumes `--jsb-*` tokens, the fonts and the Infima bridge exist.

## 1. File map

```
src/pages/index.tsx                         composes the sections; Layout + Head meta
src/components/home/Hero/Hero.tsx           + Hero.module.css
src/components/home/Hero/BlueprintSheet.tsx + BlueprintSheet.module.css   (the SVG, draw-in, tilt, captions)
src/components/home/Hero/InstallCommand.tsx                                (copy button)
src/components/home/Problem/Problem.tsx     + .module.css
src/components/home/Steps/Steps.tsx         + .module.css
src/components/home/Spec/Spec.tsx           + .module.css
src/components/home/Perspectives/Perspectives.tsx + .module.css
src/components/home/Numbers/Numbers.tsx     + .module.css
src/components/home/Quote/Quote.tsx         + .module.css
src/components/home/PlaygroundTeaser/PlaygroundTeaser.tsx + .module.css
src/components/home/FinalCta/FinalCta.tsx   + .module.css
src/components/ui/Button/Button.tsx         + .module.css
src/components/ui/Eyebrow/Eyebrow.tsx       + .module.css
src/components/ui/SectionHead/SectionHead.tsx + .module.css
src/components/ui/CodeSnippet/CodeSnippet.tsx + .module.css              (prism-react-renderer Highlight)
src/components/ui/TerminalOutput/TerminalOutput.tsx + .module.css
src/components/ui/Icons.tsx                                                (Arrow, Copy, Star: inline SVG components)
src/components/motion/Reveal.tsx + Reveal.module.css
src/components/motion/useReveal.ts
src/components/motion/useReducedMotion.ts
src/components/site/GithubStars/GithubStars.tsx + .module.css              (navbar pill; replaces components/GithubStarsButton)
src/components/site/Copyright/Copyright.tsx                                 (used by the Footer/Copyright swizzle)
src/data/stats/statsCache.ts
src/data/stats/fetchStats.ts
src/data/stats/useLiveStat.ts
src/data/stats/formatStat.ts
src/data/stats/fallbacks.ts
src/data/site/links.ts
src/data/site/product.ts
src/data/site/useCurrentYear.ts
src/prism/blueprintTheme.ts                                                 (PrismTheme object; phase 3 reuses it)
src/client/motion.ts                                                        (adds the jsb-js class; registered in clientModules)
src/theme/NavbarItem/ComponentTypes.ts                                      (points custom-githubStarsButton at site/GithubStars)
src/theme/Footer/Copyright/index.tsx                                        (swizzle, renders site/Copyright)
scripts/screenshots.mjs                                                     (Playwright visual check)
```

Delete: `src/components/HomepageFeatures`, `HomepageMultiLayer`, `HomePageQuote`, `HomeStats`, `HomeSponsors`, `GithubStarsButton`; `static/img/undraw_*.svg` (3 files), `static/img/chart-placeholder.svg`; the `react-github-btn` dependency; in `custom.css` the `.navbar-github-link` and `.navbar__items--right > span:first-of-type` rules. Keep `src/components/CodeDiff` (used by MDX docs).

## 2. Page skeleton (`src/pages/index.tsx`)

- `Layout` with `title="Lint your architecture, not just your syntax"` and `description` = the lead paragraph. Keep the `<Head>` meta description and keywords from the current file.
- Order: `Hero`, then `<main>` with `Problem`, `Steps`, `Spec`, `Perspectives`, `Numbers`, `Quote`, `PlaygroundTeaser`, `FinalCta`. The footer is Docusaurus' own.
- Every section wraps its content in a `.wrap` container: `width: min(1140px, 100%); margin-inline: auto; padding-inline: max(16px, env(safe-area-inset-left, 0px)) max(16px, env(safe-area-inset-right, 0px))`. Put that class in `src/css/custom.css` as `.jsb-wrap` so all sections share it.
- The page itself must not rely on Infima `.container/.row/.col` classes.

## 3. Sections: markup, copy, CSS, behaviour

CSS for each section: port the mockup's selectors named below into the section's module, with token names mapped (`--paper`→`--jsb-paper`, `--line-strong`→`--jsb-line-strong`, and so on). Keep the numeric values (paddings, gaps, breakpoints at 900px/860px/760px/700px) as in the mockup unless stated.

### 3.1 Hero (`.hero`, `.hero-copy`, `.cta`, `.install`, `.used`, `.sheet`)

Left column:

- `Eyebrow`: `ESLint plugin · v{MAJOR_VERSION}` (`MAJOR_VERSION` from `src/data/site/product.ts`, value 7, with a comment to bump it on a major release).
- h1: `Lint your <u>architecture</u>, not just your syntax.` The `u` is not a text decoration but a 3px accent bar painted with `background-image: linear-gradient(var(--jsb-accent), var(--jsb-accent)); background-size: 100% 3px; background-repeat: no-repeat; background-position: 0 92%; text-decoration: none` (mockup `.hero h1 u`).
- Lead: `Classify your files, write policies for who may depend on whom, and get an ESLint error the moment a boundary is crossed. In your IDE, in CI, with nothing new to run.`
- CTA row: primary `Button` "Read the quick start" with arrow → `links.DOCS_QUICK_START`; `InstallCommand` showing `$ npm i -D eslint-plugin-boundaries` with a copy button (`aria-label="Copy install command"`), which writes the command (without `$`) to the clipboard, turns the icon `--jsb-ok` for 1.2s and announces "Copied" through a visually hidden `aria-live="polite"` span; clipboard failures are swallowed.
- Used line (mono, `--jsb-faint`, strong parts in `--jsb-ink` 500): `Linting <b>{DEPENDENT_REPOS}</b> repositories · <b>{downloads}</b> downloads a month · ESLint 9 · Oxlint · TypeScript`. `downloads` is the live npm number formatted compact (`7.4M`), `DEPENDENT_REPOS` the constant from `fallbacks.ts`.

Right column: `BlueprintSheet` (section 4).

Background (gradient decision): on the `header`:

```css
.hero {
  position: relative; overflow: hidden;
  background:
    radial-gradient(55% 65% at 78% 38%, var(--jsb-glow-a), transparent 70%),
    radial-gradient(45% 55% at 8% 95%, var(--jsb-glow-b), transparent 70%),
    linear-gradient(180deg, var(--jsb-paper-2), var(--jsb-paper));
}
.hero::before { /* film grain: the feTurbulence data URI from the mockup (.hero::before), opacity .6, mix-blend-mode soft-light, pointer-events none */ }
.hero::after  { /* fade to paper: linear-gradient(180deg, transparent 60%, var(--jsb-paper)) */ }
```

Grid: two equal columns, gap 3rem, `padding-block: 4.5rem 4rem`; below 900px one column, `padding-block: 3rem`, sheet max-width 520px centred.

### 3.2 Problem (`.problem`)

- Left: `Eyebrow` "Why"; h2 `Architecture decays one import at a time.` (size `clamp(1.7rem, 3.4vw, 2.6rem)`); lead `The diagram on the wiki says helpers never know about components. Then someone needs a quick fix, the import is three keystrokes away, and the review is busy. JS Boundaries makes the diagram executable.`
- Right: numbered list (counter `01`–`04` in mono accent, 2.4rem column, rows separated by `--jsb-line`, hover shifts 6px and darkens):
  1. **The lines are in your config** — Element and file descriptors map folders and files to the names you already use in design discussions.
  2. **The rules read both sides** — Each policy sees the element, file category and module origin of the importer and the imported, plus the import kind.
  3. **Feedback is immediate** — The editor underlines the import. CI fails the build. The message explains the architectural reason, not just the rule id.
  4. **Adoption is progressive** — Start with one layer and one policy on an existing project with the recommended config. Tighten with strict when ready.
- Both columns are `Reveal` blocks; the list has `delay={0.1}`.

### 3.3 Steps (`.steps`, `.step`, `.code`)

Background `--jsb-paper-2`, top/bottom `--jsb-line`. `SectionHead`: eyebrow "How it works", h2 `From folder tree to enforced architecture in three edits`. Three `.step` rows (text 0.9fr / code 1.1fr, dashed separators, big Sora 700 number in accent):

1. h3 `Classify files and elements` — `Element descriptors match folders. File descriptors match files on their own, so a file can be a <code>component</code> and a <code>test</code> at the same time. You only need one of the two to start.` Code (language `js`):

```js
settings: {
  "boundaries/elements": [
    { type: "helper",    pattern: "helpers/*" },
    { type: "component", pattern: "components/*/*" },
    { type: "module",    pattern: "modules/*" },
  ],
  "boundaries/files": [
    { pattern: "**/*.spec.js", category: "test" },
  ],
}
```

2. h3 `Write the policies` — `Pick a default, then allow or disallow by any combination of element type, file category, module origin and dependency kind. Captured path fragments let one policy cover a whole family of elements.` Code (language `js`):

```js
"boundaries/dependencies": [2, {
  default: "disallow",
  policies: [
    { from: { element: { type: "component" } },
      allow: { to: { element: { type: "helper" } } } },
    { from: { element: { type: "module" } },
      allow: { to: { element: { types: ["component", "helper"] } } } },
    { disallow: { to: { file: { categories: "test" } } },
      message: "Never import test files from ${from.element.type}s" },
  ],
}]
```

3. h3 `Read the error where you wrote the import` — `Violations are ordinary ESLint errors: editor squiggles, CI failures, templated messages with the element types on both sides. Three more rules catch files outside your architecture, unknown dependencies and ignored ones.` Rendered with `TerminalOutput`:

```
src/helpers/format/index.js
  1:22  error  No rule allowing this dependency was found.
         File is of type 'helper'. Dependency is of type 'component'
         boundaries/dependencies

✖ 1 problem (1 error, 0 warnings)
```

(path and rule id in `--jsb-code-comment`, `1:22` in `--jsb-code-number`, `error` and `✖ 1 problem` in `--jsb-code-error`, quoted types in `--jsb-code-string`.)

`CodeSnippet` renders with `Highlight` from `prism-react-renderer` and `blueprintTheme` (section 6); the block style is the mockup's `.code` (padding 1rem 1.1rem, radius 8px, `--jsb-code` background, 3px left accent rule, `--jsb-shadow`, `overflow-x: auto`, line-height 1.65, font 0.8rem).

### 3.4 Spec (`.spec`, `.row`)

`SectionHead`: eyebrow "Specification", h2 `What the plugin understands`. A `dl` in two columns (one below 900px), each row `dt` mono accent 150px (110px on mobile) + `dd` with a Sora bold title line and muted text; a 2px accent bar grows on the row's left edge on hover. Rows (stagger 0.05s):

| dt | title | text |
| --- | --- | --- |
| classification | Three independent layers | Element (the architectural unit), file (its own category) and module (where the import resolves). All three are computed for both sides of every dependency. |
| selectors | Match on anything described | Types, categories, origins, captured path fragments and array queries. Reference the `from` side's captures in the `to` side. |
| policies | Allow and disallow, with a default | Policies are evaluated in order. Messages are templates with access to the full description of the dependency. |
| rules | Four rules, one setting | `dependencies`, `no-unknown-files`, `no-unknown-dependencies`, `no-ignored-dependencies`. Deprecated rules keep working. |
| performance | 2.5× faster since 7.3 | Selectors are normalized once and message templates are cached, cutting lint time by 60% on real projects. |
| compatibility | ESLint 9, Oxlint, TypeScript, monorepos | Typed config helpers (`satisfies Config`), custom resolvers and path aliases, per-package element roots. |

Note: the mockup says "Seven rules" and "Six more rules"; the copy above is the corrected version (four active rules, see `docs/rules/rules.md`). The "since 7.3" row is accurate: 7.3.0 shipped on 2026-10-23 and its docs are the latest versioned docs (`/docs/` serves 7.3.0; `/docs/next/` serves the working `docs/` folder).

### 3.5 Perspectives (`.persp`, `.pcard`, `.desc`)

Background `--jsb-paper-2`. Left: `SectionHead` eyebrow "New in v7", h2 `One file, described from every angle`, lead `Hover a layer to see the part of the runtime description it fills. Policies can read any of them, on both sides.`; then three cards (`element` / `file` / `module`) with the texts: `The architectural unit: component, service, module…`, `The file's own categories: test, index, style…`, `Where the dependency resolves: local, external, core.` Right: a `pre` with the description object exactly as in the mockup lines 399–412 (comment line `// components/Price/Price.spec.tsx  →  import "react"`), where each `element:`, `file:` and `module:` line is a `span` tagged with its layer.

Behaviour: state `active: "element" | "file" | "module"` (default `element`). Pointer enter or focus on a card sets it; the active card gets the accent border + `0 0 0 3px var(--jsb-accent-soft)` ring; the matching spans get `background: color-mix(in srgb, var(--jsb-accent) 35%, transparent)`. Cards are `button`s (`aria-pressed`), so keyboard and touch work.

### 3.6 Numbers (`.numbers`, `.num`)

Three columns (one below 700px), 2px `--jsb-ink` top rule, big Sora number, muted label:

1. `{downloads compact}` — `monthly downloads on npm`
2. `{stars with thousands separator}` — `GitHub stars, {DEPENDENT_REPOS} dependent repositories`
3. `{years} years` — `of releases since {FIRST_RELEASE_YEAR}, MIT licensed`

Numbers come from `useLiveStat` (section 5); the first render shows the fallbacks.

### 3.7 Quote (`.quote`)

Centred blockquote, Sora 500 `clamp(1.3rem, 2.6vw, 1.9rem)`, max-width 36ch: `"Software architecture is the art of <mark>drawing lines</mark> that I call boundaries. Those boundaries separate software elements from one another, and restrict those on one side from knowing about those on the other."` The `mark` has no background, accent colour, and a 2px underline that scales from 0 to 1 over 0.8s (delay 0.3s) when the block reveals. `cite` (mono 0.75rem muted): `Robert C. Martin · Clean Architecture`, linking the book title to `https://www.oreilly.com/library/view/clean-architecture-a/9780134494272/` (current `HomePageQuote` link).

### 3.8 Playground teaser (`.play`, `.table`)

Left: `SectionHead` eyebrow "Drafting table · coming next", h2 `Try a config against a sketched project`, lead `Paste settings, lay out a folder tree, and watch each file get classified and each import get its verdict. In the browser, nothing to install.`, outline `Button` "Follow the roadmap" with arrow → `links.GITHUB_BACKLOG`. Right: the static "table" card (`aria-label="Playground preview"`): a 16px drafting grid background (`--jsb-grid`), a tree column (`src/`, `components/`, `Button/`, `Price/`, `helpers/`, `format/`, `modules/`, `checkout/` with indentation classes) and result rows `element · component · captured { name: "Price" }`, `file · categories: [ "index" ]`, `module · origin: "local"`, and a `report` row in `--jsb-bad` reading `helpers/format → components/Price · disallowed`. No behaviour beyond hover tints.

### 3.9 Final CTA (`.final`, `.box`)

Dashed `--jsb-line-strong` box, radius 12px, two accent corner marks (`::before`/`::after`), centred: h2 `Draw one line today`, lead `Install the plugin, name one folder, write one policy. Add the rest when the team is ready.`, primary `Button` "Quick start" → `links.DOCS_QUICK_START`, outline `Button` "Sponsor the project" → `links.GITHUB_SPONSORS`. This replaces the `HomeSponsors` iframe.

## 4. BlueprintSheet (hero drawing)

Port the `<svg id="draw" viewBox="0 0 520 500">` from the mockup (lines 269–308) to JSX in `BlueprintSheet.tsx`:

- Attribute names to JSX (`strokeWidth`, `markerEnd`, `textAnchor`, `pathLength`, `className`); marker ids prefixed `jsb-` to avoid clashes with docs SVGs; colours through `var(--jsb-*)` in the module CSS, never attributes.
- Three slabs from a data array `[{ id: "modules", type: "module", pattern: "modules/*" }, { id: "components", type: "component", pattern: "components/*/*" }, { id: "helpers", type: "helper", pattern: "helpers/*" }]`, each a `<g>` with `tabIndex={0}`, `role="button"`, `aria-label="{id} layer: {descriptor}"`; hover/focus lifts it 6px and sets the caption `"{id} · { type: \"module\", pattern: \"modules/*\" }"` (descriptor in `code`). Default caption: `hover a layer · { type: "component", pattern: "components/*/*" }`.
- Draw-in: classes `.draw .l1…l5` with the keyframes from the mockup (`stroke-dasharray: 1; stroke-dashoffset: 1 → 0`, 1.6s, delays 0/.25/.5/.9/1.2s). The violation edge uses the `dash` loop. The dimension line text reads `3 element types · 1 rule`. Tags: two `allow →` in `--jsb-ok`, one filled `--jsb-bad` tag `✕ helper → component`.
- Tilt: on the wrapper (`perspective: 1200px`), `onPointerMove` computes `x, y` in [-0.5, 0.5] and sets `svg.style.transform = rotateX(${-y * 8}deg) rotateY(${x * 10}deg)` inside `requestAnimationFrame`; `onPointerLeave` clears it. Not attached when `useReducedMotion()` is true or `matchMedia("(hover: none)").matches`.
- `aria-label` on the svg: `Blueprint drawing of three architecture layers: modules depend on components, components on helpers; a helper importing a component is marked as disallowed`.

## 5. Live numbers (`src/data/stats`, `src/data/site`)

Same approach as the project stats on javierbrea.com (public GitHub and npm APIs are rate-limited per IP, so a successful value is cached for a day and failures are never cached), adapted to React:

- `statsCache.ts`: `readCachedStat(key): number | undefined` and `writeCachedStat(key, value): void`; entries `{ value, timestamp }` in `localStorage`, TTL `24 * 60 * 60 * 1000`, `typeof window` guard, every storage access in try/catch, only successful values are ever written.
- `fetchStats.ts`: `fetchGithubStars(repo)` → `https://api.github.com/repos/${repo}` (`Accept: application/vnd.github+json`) → `stargazers_count`; `fetchNpmMonthlyDownloads(pkg)` → `https://api.npmjs.org/downloads/point/last-month/${pkg}` → `downloads`. Both return `undefined` on any failure, read the cache first, write it on success, and memoize the in-flight promise per key at module level so the hero and the numbers section share one request.
- `formatStat.ts`: `formatCompact(n)` (`7412345 → "7.4M"`, `1250 → "1.3k"`, trailing `.0` removed) and `formatThousands(n)` (`en-US` grouping, `1001 → "1,001"`).
- `useLiveStat.ts`: `useLiveStat(fetcher: () => Promise<number | undefined>, fallback: number): { value: number; isLive: boolean }`. Starts at the fallback, fetches in `useEffect`, ignores results after unmount.
- `fallbacks.ts`: `GITHUB_STARS_FALLBACK`, `NPM_MONTHLY_DOWNLOADS_FALLBACK`, `DEPENDENT_REPOS = "4,000+"`, with a comment saying to refresh them whenever the file is touched. Set the two numbers from the live APIs when implementing: `curl -s https://api.github.com/repos/javierbrea/eslint-plugin-boundaries | jq .stargazers_count` and `curl -s https://api.npmjs.org/downloads/point/last-month/eslint-plugin-boundaries | jq .downloads`. The current home's "~4M" is stale (npm reported 7.4M on 2026-10-23).
- `src/data/site/product.ts`: `GITHUB_REPO = "javierbrea/eslint-plugin-boundaries"`, `NPM_PACKAGE = "eslint-plugin-boundaries"`, `FIRST_RELEASE_YEAR = 2020`, `MAJOR_VERSION = 7`.
- `src/data/site/links.ts`: `DOCS_QUICK_START = "/docs/quick-start/"`, `DOCS_OVERVIEW = "/docs/overview/"`, `GITHUB_REPO_URL`, `GITHUB_SPONSORS = "https://github.com/sponsors/javierbrea"`, `GITHUB_BACKLOG = "https://github.com/users/javierbrea/projects/7"`.
- `src/data/site/useCurrentYear.ts`: returns the build-time year on the first render and `new Date().getFullYear()` after mount. `years = currentYear - FIRST_RELEASE_YEAR`.

## 6. Prism theme (`src/prism/blueprintTheme.ts`)

A `PrismTheme` (type from `prism-react-renderer`) with `plain: { color: "#e7e9f8", backgroundColor: "#1b1f3b" }` and styles: keyword/property/attr-name/tag → `#b3b8ff`; string/attr-value/inserted → `#8fe3cf`; comment/prolog/doctype/cdata → `#7a7fa3` italic; number/boolean/constant → `#ffd479`; deleted/important → `#ff8f7c`; function/class-name → `#e7e9f8`; punctuation/operator → `#aeb3d6`. Literal colours are allowed in this file (it is a JS object). Export it; phase 3 wires it into `docusaurus.config.ts` and `CodeDiff`. In this phase it is used only by `CodeSnippet`.

## 7. Navbar and footer

- `src/components/site/GithubStars/GithubStars.tsx`: `<a class="stars" href={GITHUB_REPO_URL} aria-label="Star the repository on GitHub">` star icon + `formatThousands(stars)` via `useLiveStat(fetchGithubStars...)`. Styles from the mockup `.stars`. `ComponentTypes.ts` keeps the key `custom-githubStarsButton` and points it to this component, so `docusaurus.config.ts` keeps its item. Remove the separate `navbar-github-link` item from the config (the pill is the link) and the two CSS rules named in section 1.
- Add a navbar item `{ to: "/docs/quick-start/", label: "Get started", position: "right", className: "jsb-navbar-cta" }` and style `.jsb-navbar-cta` in `custom.css` as the primary button (34px high in the navbar); hide it below 996px (Docusaurus' mobile menu shows it as a plain link, which is fine).
- Navbar `hideOnScroll: false` (the mockup's nav is always visible and translucent).
- Navbar logo: give `themeConfig.navbar.logo` explicit `width` and `height` (the rendered size, in px); Docusaurus passes them to the `<img>` of the navbar and of the docs sidebar, which Lighthouse otherwise reports as unsized images (`unsized-images`). The footer logo goes away with `footer.logo` below.
- Theme toggle: style Docusaurus' `.clean-btn.toggleButton_*` family through `[class*="toggleButton"]` to look like the mockup `.icon-btn` (34px, `--jsb-line` border, radius 6px, hover accent border).
- Footer: swizzle `Footer/Copyright` (`pnpm --filter website swizzle @docusaurus/theme-classic Footer/Copyright --eject --typescript`) and render `src/components/site/Copyright/Copyright.tsx`: `Copyright © {FIRST_RELEASE_YEAR}-{useCurrentYear()} <a href="https://www.javierbrea.com">Javier Brea</a>. MIT licensed.` plus the trademarks disclaimer line (text from the current config), mono 0.74rem `--jsb-faint`. Remove `footer.copyright` and `footer.logo` from the config. In `footer.links`, remove "Illustrations by unDraw" and keep the rest. Footer CSS: `--jsb-paper-2` background, top `--jsb-line`, column titles as mono eyebrow (0.68rem, uppercase, 0.12em, `--jsb-muted`: faint measures 2.85:1 on the footer surface and fails AA, as phase 1 found), links muted → ink on hover.
- Acknowledgments page: replace the unDraw bullet with `**[Sora](https://fonts.google.com/specimen/Sora), [IBM Plex Sans](https://fonts.google.com/specimen/IBM+Plex+Sans) and [IBM Plex Mono](https://fonts.google.com/specimen/IBM+Plex+Mono)** - Open source typefaces, used under the SIL Open Font License`. Apply the identical edit to both live copies, `docs/misc/acknowledgments.mdx` (`/docs/next/`) and `versioned_docs/version-7.3.0/misc/acknowledgments.mdx` (`/docs/`), as `00-shared.md` section 2 says; older snapshots keep their historical credit.

## 8. Reveal and client module

- `src/client/motion.ts`: `if (typeof document !== "undefined") document.documentElement.classList.add("jsb-js")`. Register in `docusaurus.config.ts` as `clientModules: ["./src/client/motion.ts"]`.
- `Reveal.module.css`: `.reveal { opacity: 1; transform: none }` then `:global(.jsb-js) .reveal:not(.in) { opacity: 0; transform: translateY(16px) }` and `.reveal { transition: opacity .7s var(--jsb-ease), transform .7s var(--jsb-ease); transition-delay: var(--d, 0s) }`, reduced-motion override.
- `useReveal(ref, { once: true })` creates one IntersectionObserver per element with the thresholds from `00-shared.md` section 5 and sets `in`; with no `IntersectionObserver` or reduced motion it sets `in` immediately.
- `Reveal` props: `as` (default `div`), `delay` (seconds, becomes `--d`), `className`, `children`.

## 9. Boundaries dogfooding (`packages/website/eslint.config.mjs`)

Add `eslint-plugin-boundaries` (published, latest 7.x) as a website dev dependency; the website is a consumer like any other and keeps no Nx dependency on `packages/eslint-plugin` (`.agents/skills/repo-architecture/SKILL.md`). Add a config object for `src/**/*.{ts,tsx}`:

```js
settings: {
  "boundaries/elements": [
    { type: "page", pattern: "src/pages/*", mode: "file" },
    { type: "theme", pattern: "src/theme/*" },
    { type: "client", pattern: "src/client/*", mode: "file" },
    { type: "home", pattern: "src/components/home/*" },
    { type: "site", pattern: "src/components/site/*" },
    { type: "ui", pattern: "src/components/ui/*" },
    { type: "motion", pattern: "src/components/motion" },
    { type: "docs-component", pattern: "src/components/CodeDiff" },
    { type: "data", pattern: "src/data/*" },
    { type: "prism", pattern: "src/prism" },
  ],
},
rules: {
  ...boundaries.configs.recommended.rules,
  "boundaries/dependencies": [2, {
    default: "disallow",
    policies: [
      { allow: { to: { module: { origin: ["external", "core"] } } } },
      { allow: { dependency: { relationship: { to: "internal" } } } },
      { from: { element: { type: "page" } }, allow: { to: { element: { type: ["home", "site", "ui", "motion", "data", "prism"] } } } },
      { from: { element: { type: "theme" } }, allow: { to: { element: { type: ["site", "ui", "data"] } } } },
      { from: { element: { type: "home" } }, allow: { to: { element: { type: ["ui", "motion", "data", "prism"] } } } },
      { from: { element: { type: "site" } }, allow: { to: { element: { type: ["ui", "motion", "data"] } } } },
      { from: { element: { type: "ui" } }, allow: { to: { element: { type: ["motion", "prism"] } } } },
      { from: { element: { type: "docs-component" } }, allow: { to: { element: { type: ["prism", "ui"] } } } },
    ],
  }],
}
```

`@theme/*` and `@docusaurus/*` imports resolve as external and pass the first policy. Verify with `pnpm nx lint website`; if a file is reported as unknown, fix the pattern (use `"boundaries/debug"` temporarily, never commit it enabled). `motion`, `data`, `prism`, `client` import nothing internal by design.

## 10. Screenshot script (`packages/website/scripts/screenshots.mjs`)

Model: the scratch script below, which rendered the mockups (run it from a folder outside the repo with `npm i playwright`; it takes a mockup file or a live URL). The committed script uses `playwright-core` (dev dependency; no browser download) with `chromium.launch({ channel: "chrome" })` (local Chrome); fall back to `chromium.launch()` after `pnpm dlx playwright install chromium` if there is no Chrome.

```js
// Usage: node shots.mjs <mockup.html | http://localhost:3000/path/> <name>
import { chromium } from "playwright";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const [, , src, name = "page"] = process.argv;
let target = src;
if (existsSync(src)) {
  const body = readFileSync(src, "utf8");
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style></head><body>${body}</body></html>`;
  writeFileSync(resolve(`${name}.html`), html);
  target = "file://" + resolve(`${name}.html`);
}
const browser = await chromium.launch();
for (const [mode, width, height] of [["desk", 1440, 900], ["mob", 390, 844]]) {
  for (const colorScheme of ["light", "dark"]) {
    const context = await browser.newContext({ viewport: { width, height }, colorScheme });
    // Docusaurus reads its stored choice; set it so the toggle matches the emulated scheme
    await context.addInitScript((theme) => { try { localStorage.setItem("theme", theme); } catch {} }, colorScheme);
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
    await page.goto(target, { waitUntil: "networkidle" });
    await page.mouse.move(width * 0.7, 420);
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `${name}-${mode}-${colorScheme}-top.png` });
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 500) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(900);
    await page.screenshot({ path: `${name}-${mode}-${colorScheme}-full.png`, fullPage: true });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    console.log(name, mode, colorScheme, "overflow:", overflow, "errors:", errors.length ? errors : "none");
    await context.close();
  }
}
await browser.close();
``` Usage: `pnpm --filter website screenshots [baseUrl=http://localhost:3000] [paths...]` with default paths `/`, `/docs/overview/`, `/docs/quick-start/`. For each path × {1440×900, 390×844} × {light, dark} (set the theme through `localStorage.theme` before load, which Docusaurus reads): wait for `networkidle`, scroll through the page to trigger reveals, screenshot top and full page into `packages/website/screenshots/` (git-ignored; add to `.gitignore`), assert `scrollWidth <= clientWidth`, collect `pageerror` and console errors, exit 1 on any. Add `"screenshots": "node scripts/screenshots.mjs"` to `package.json` and a row to the README "Useful Commands" table.

## 11. Social image (optional in this phase)

`static/img/og-image.png` shows the old design. If time allows, capture a 1200×630 crop of the new hero (light theme) with the screenshot script and replace it; otherwise open a follow-up issue.

## Acceptance

- Everything in `00-shared.md` section 8 for `/`.
- Side-by-side with `mockups/mockB-light.png` and `mockB-dark.png`: same section order, same copy (with the corrections in 3.4 and 3.3), same palette, visibly the same hero drawing; deviations only where this file says so (footer layout, no `Playground` navbar link).
- Live numbers: with network, the stars pill, the hero line and the numbers section show the API values and `localStorage` holds `github-stars:…` and `npm-downloads:…` entries; with the network blocked (DevTools offline) they show the fallbacks and nothing is cached.
- Keyboard: tab reaches the CTA, the copy button, the three slabs, the three perspective cards and the two final buttons, with a visible ring; slabs and cards react to focus.
- `pnpm nx lint website` passes with the boundaries policy active; a deliberate `import` from `src/data/stats/fetchStats.ts` into a `home` component is reported (test it, then revert).
- No `react-github-btn` in `package.json` or the lockfile; no `undraw` file or reference left outside older docs snapshots (`grep -ril undraw packages/website/src packages/website/static packages/website/docs packages/website/docusaurus.config.ts packages/website/versioned_docs/version-7.3.0` is empty).
- Changelog entry, e.g. `feat: New home page: blueprint hero with a live-drawn architecture sheet, the three-step walkthrough, feature specification, live GitHub and npm numbers, and a playground preview.`
