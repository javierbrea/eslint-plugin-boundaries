<!-- cspell:disable -->
# Phase 1: foundation (tokens, fonts, Infima bridge, type scale)

Goal: after this phase every page already uses the new palette, faces and scale, with no structural change. The home keeps its current components (phase 2 replaces them) but must not look broken. Docs pages are the visible result of this phase.

Read first: `../website-redesign.md`, `00-shared.md`, `packages/website/AGENTS.md`. Nothing from the mockup markup is needed here; only its token values (already in `00-shared.md`).

## Deliverables

### 1. `src/css/tokens.css`

Exactly the block in `00-shared.md` section 3. First file in the `customCss` list.

### 2. Fonts, self-hosted

1. Copy the latin woff2 files from the Fontsource packages (dev dependencies, used only as a source of files): `pnpm --filter website add -D @fontsource/sora @fontsource/ibm-plex-sans @fontsource/ibm-plex-mono` (current 5.x). Files live at `node_modules/@fontsource/<family>/files/<family>-latin-<weight>-<style>.woff2`.
2. Add `packages/website/scripts/sync-fonts.mjs`: copies the nine files below into `packages/website/static/fonts/` and the three `LICENSE` files as `static/fonts/LICENSE-<family>.txt`. Add the script `"sync:fonts": "node scripts/sync-fonts.mjs"` to `packages/website/package.json`. Run it and commit the output (the woff2 files are committed so the build has no network dependency).

| Family | Files |
| --- | --- |
| Sora | `sora-latin-500-normal`, `sora-latin-600-normal`, `sora-latin-700-normal` |
| IBM Plex Sans | `ibm-plex-sans-latin-400-normal`, `ibm-plex-sans-latin-400-italic`, `ibm-plex-sans-latin-500-normal`, `ibm-plex-sans-latin-600-normal` |
| IBM Plex Mono | `ibm-plex-mono-latin-400-normal`, `ibm-plex-mono-latin-500-normal` |

3. `src/css/fonts.css`: one `@font-face` per file, `font-display: swap`, latin `unicode-range`, absolute `url("/fonts/<file>.woff2") format("woff2")` preceded by `/* webpackIgnore: true */` (see `00-shared.md` section 7: without it the bundler rewrites the URL to a hashed `/assets/fonts/` copy and the preloads of step 4 are wasted). Template:

```css
@font-face {
  font-family: "Sora";
  font-style: normal;
  font-weight: 600;
  font-display: swap;
  src: /* webpackIgnore: true */ url("/fonts/sora-latin-600-normal.woff2") format("woff2");
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
```

4. Preload the two faces that paint above the fold, in `docusaurus.config.ts` `headTags`: `sora-latin-600-normal.woff2` and `ibm-plex-sans-latin-400-normal.woff2`, each `{ tagName: "link", attributes: { rel: "preload", href: "/fonts/<file>", as: "font", type: "font/woff2", crossorigin: "anonymous" } }`.
5. `static/fonts/README.md` (three lines): where the files come from, the licence (SIL OFL 1.1), and that `pnpm --filter website sync:fonts` refreshes them.
6. cspell words: `Sora`, `fontsource`, `woff` (add what the checker flags).

### 3. `src/css/infima-bridge.css`

Maps Infima variables onto the tokens so Docusaurus-rendered pages restyle without swizzling. Infima and DocSearch load in `@layer docusaurus.*` cascade layers (`future.v4` in `docusaurus.config.ts`), so the unlayered bridge wins over them in both themes; without the layers Infima's `html[data-theme="dark"]` block would beat `[data-theme="dark"]` on specificity. Declare the mapping on `:root` and repeat it under `[data-theme="dark"]`; literal values that differ per theme (primary shades, emphasis scale) are listed for both.

```css
:root,
[data-theme="dark"] {
  /* type */
  --ifm-font-family-base: var(--jsb-font-body);
  --ifm-font-family-monospace: var(--jsb-font-mono);
  --ifm-heading-font-family: var(--jsb-font-display);
  --ifm-font-size-base: 93.75%; /* 15px at the browser default, so the reader's font-size setting still applies */
  --ifm-blockquote-font-size: 1rem; /* Infima derives it from the base percentage, which would compound */
  --ifm-line-height-base: 1.6;
  --ifm-heading-font-weight: 600;
  --ifm-heading-line-height: 1.2;
  --ifm-h1-font-size: 2.1rem;
  --ifm-h2-font-size: 1.55rem;
  --ifm-h3-font-size: 1.2rem;
  --ifm-h4-font-size: 1rem;
  --ifm-code-font-size: 88%;
  --ifm-global-radius: var(--jsb-radius);
  --ifm-button-border-radius: var(--jsb-radius);
  --ifm-transition-timing-default: var(--jsb-ease);

  /* surfaces and text */
  --ifm-background-color: var(--jsb-paper);
  --ifm-background-surface-color: var(--jsb-paper-2);
  --ifm-font-color-base: var(--jsb-ink);
  --ifm-font-color-secondary: var(--jsb-muted);
  --ifm-color-content: var(--jsb-ink);
  --ifm-color-content-secondary: var(--jsb-muted);
  --ifm-hr-background-color: var(--jsb-line);
  --ifm-toc-border-color: var(--jsb-line);
  --ifm-table-border-color: var(--jsb-line);
  --ifm-table-stripe-background: var(--jsb-paper-2); /* paper is the page background, so a paper stripe is invisible */
  --ifm-blockquote-color: var(--jsb-muted);
  --ifm-blockquote-border-color: var(--jsb-accent);

  /* brand and links */
  --ifm-color-primary: var(--jsb-accent);
  --ifm-link-color: var(--jsb-accent);
  --ifm-link-hover-color: var(--jsb-ink);
  --ifm-link-hover-decoration: underline;

  /* semantic */
  --ifm-color-success: var(--jsb-ok);
  --ifm-color-danger: var(--jsb-bad);
  --ifm-color-warning: var(--jsb-warn);
  --ifm-color-info: var(--jsb-accent);
  --ifm-color-success-contrast-background: color-mix(in srgb, var(--jsb-ok) 12%, transparent);
  --ifm-color-danger-contrast-background: color-mix(in srgb, var(--jsb-bad) 12%, transparent);
  --ifm-color-warning-contrast-background: color-mix(in srgb, var(--jsb-warn) 14%, transparent);
  --ifm-color-info-contrast-background: var(--jsb-accent-soft);
  --ifm-color-secondary-contrast-background: color-mix(in srgb, var(--jsb-muted) 10%, transparent);
  --ifm-color-success-contrast-foreground: var(--jsb-ink);
  --ifm-color-danger-contrast-foreground: var(--jsb-ink);
  --ifm-color-warning-contrast-foreground: var(--jsb-ink);
  --ifm-color-info-contrast-foreground: var(--jsb-ink);
  --ifm-color-secondary-contrast-foreground: var(--jsb-ink);
  --ifm-color-success-dark: var(--jsb-ok);
  --ifm-color-danger-dark: var(--jsb-bad);
  --ifm-color-warning-dark: var(--jsb-warn);
  --ifm-color-info-dark: var(--jsb-accent);
  --ifm-color-secondary-dark: var(--jsb-muted);

  /* code */
  --ifm-code-background: var(--jsb-accent-soft);
  --ifm-pre-background: var(--jsb-code);
  --ifm-pre-color: var(--jsb-code-fg);
  --docusaurus-highlighted-code-line-bg: var(--jsb-code-line);

  /* navbar, menu, footer */
  --ifm-navbar-height: 58px;
  --ifm-navbar-background-color: var(--jsb-paper);
  --ifm-navbar-link-color: var(--jsb-muted);
  --ifm-navbar-link-hover-color: var(--jsb-ink);
  --ifm-navbar-shadow: none;
  --ifm-menu-color: var(--jsb-muted);
  --ifm-menu-color-active: var(--jsb-accent);
  --ifm-menu-color-background-active: var(--jsb-accent-soft);
  --ifm-menu-color-background-hover: var(--jsb-accent-soft);
  --ifm-breadcrumb-item-background-active: var(--jsb-accent-soft);
  --ifm-footer-background-color: var(--jsb-paper-2);
  --ifm-footer-color: var(--jsb-muted);
  --ifm-footer-link-color: var(--jsb-muted);
  --ifm-footer-link-hover-color: var(--jsb-ink);
  --ifm-footer-title-color: var(--jsb-muted); /* faint measures 2.85:1 on the footer, below AA */

  /* DocSearch */
  --docsearch-primary-color: var(--jsb-accent);
  --docsearch-text-color: var(--jsb-ink);
  --docsearch-muted-color: var(--jsb-muted);
  --docsearch-searchbox-background: var(--jsb-card);
  --docsearch-searchbox-focus-background: var(--jsb-card);
  --docsearch-modal-background: var(--jsb-paper);
  --docsearch-hit-background: var(--jsb-card);
  --docsearch-footer-background: var(--jsb-paper-2);
}

:root {
  --ifm-color-primary-dark: #3b41c4;
  --ifm-color-primary-darker: #353bb9;
  --ifm-color-primary-darkest: #2c3198;
  --ifm-color-primary-light: #6469de;
  --ifm-color-primary-lighter: #7277e1;
  --ifm-color-primary-lightest: #9a9ded;
  --ifm-color-emphasis-100: #eef0f7;
  --ifm-color-emphasis-200: #e1e4f0;
  --ifm-color-emphasis-300: #cfd3e4;
  --ifm-color-emphasis-400: #b4b9d0;
  --ifm-color-emphasis-500: #9397b6;
  --ifm-color-emphasis-600: #6f7595;
  --ifm-color-emphasis-700: #5a6080;
  --ifm-color-emphasis-800: #3a3f5e;
  --ifm-color-emphasis-900: #161a33;
}

[data-theme="dark"] {
  --ifm-color-primary-dark: #7a80ff;
  --ifm-color-primary-darker: #6a71ff;
  --ifm-color-primary-darkest: #4f57f0;
  --ifm-color-primary-light: #a4a8ff;
  --ifm-color-primary-lighter: #b3b6ff;
  --ifm-color-primary-lightest: #d0d2ff;
  --ifm-color-emphasis-100: #1a1e3a;
  --ifm-color-emphasis-200: #22274a;
  --ifm-color-emphasis-300: #2e3358;
  --ifm-color-emphasis-400: #434a73;
  --ifm-color-emphasis-500: #6a6f93;
  --ifm-color-emphasis-600: #8a8fb0;
  --ifm-color-emphasis-700: #a4a9c9;
  --ifm-color-emphasis-800: #cfd3e8;
  --ifm-color-emphasis-900: #e9ebf7;
}

/* element rules that Infima variables cannot express */
h1, h2 { letter-spacing: -0.02em; text-wrap: balance; }
/* Infima sets the docs title and top-level h2/h3 sizes on the elements; inherit the :root values instead */
.markdown h1:first-child { --ifm-h1-font-size: inherit; }
.markdown > h2 { --ifm-h2-font-size: inherit; }
.markdown > h3 { --ifm-h3-font-size: inherit; }
/* Infima gives inline code inside admonitions a per-variant highlight colour */
.alert { --ifm-alert-background-color-highlight: color-mix(in srgb, var(--ifm-alert-foreground-color) 10%, transparent); }
.navbar { border-bottom: 1px solid var(--jsb-line); }
/* backdrop-filter makes the navbar the containing block of its fixed descendants and would clip the mobile sidebar, so the translucent blurred navbar is desktop-only */
@media (min-width: 997px) { .navbar { background-color: color-mix(in srgb, var(--jsb-paper) 88%, transparent); backdrop-filter: blur(10px); } }
.footer { border-top: 1px solid var(--jsb-line); }
```

Every `--ifm-*` and `--docsearch-*` name above was checked against the installed Infima 0.2.0-alpha.45 and `@docsearch/css` 4.3.2 (find them with `find node_modules/.pnpm -path '*infima/dist/css/default/default.css'` and `-path '*@docsearch/css/dist/style.css'`). After implementing, audit a docs page in both themes and add the variables for anything still carrying Infima's default green or grey.

### 4. `src/css/custom.css`

Keep it for site-specific rules only. Rewrite the existing content:

- Remove the old `--ifm-color-primary*` blocks (both themes) and `--ifm-code-font-size`.
- `.footer-contents` and `.footer-acknowledgement`: keep, replace literal colours with tokens.
- `.navbar-github-link::after`: the icon is a white-filled data URI, invisible on the light navbar once the navbar follows the theme. Replace with a mask so it takes the link colour: `mask: url("<same svg, fill='black'>") center / 24px no-repeat; background-color: currentColor; width: 24px; height: 24px; content: "";`. Phase 2 removes this item altogether; here it only has to be visible in both themes.
- `.navbar__items--right > span:first-of-type`: keep (phase 2 removes it with the component it supports).
- CodeDiff rules (`.diff-*`): keep as they are, and add `.diff-theme-light div pre { background-color: #f6f8fa; }` next to the existing `.diff-theme-dark div pre` rule: the CodeDiff `pre` has no background of its own and would inherit the now always-dark `--ifm-pre-background` while keeping the Prism `github` token colours, making the light-theme diff blocks illegible. Phase 3 deletes both rules with the CodeDiff rewrite.
- Announcement bar: keep the layout rules; add colour overrides with tokens. Docusaurus sets the colours inline from the config, so these two need `!important` (say so in a comment): `[class*="announcementBar_"][role="banner"] { background: var(--jsb-ink) !important; color: var(--jsb-paper) !important; }` and the close button `color: var(--jsb-paper) !important`. Set the config `backgroundColor`/`textColor` to the light-theme values (`#161a33` / `#f3f4f9`) so the no-CSS fallback matches.
- `.markdown a`: keep underline + weight 600; colour comes from `--ifm-link-color`.
- DocSearch button: delete the three `[data-theme='light'] .DocSearch-*` rules (the bridge variables cover them).

### 5. `docusaurus.config.ts`

- `presets[0][1].theme.customCss`: `["./src/css/tokens.css", "./src/css/fonts.css", "./src/css/infima-bridge.css", "./src/css/custom.css"]` in that order.
- `headTags`: add the two font preloads (section 2.4).
- `themeConfig.navbar`: remove `style: "dark"` (the navbar follows the theme through the bridge). Keep `hideOnScroll: true` in this phase. Give the `navbar-github-link` item `"aria-label": "GitHub repository"`: it is an icon-only link and fails the Lighthouse `link-name` audit on every page (phase 2 removes the item).
- `themeConfig.footer`: remove `style: "dark"`.
- `themeConfig.announcementBar`: `backgroundColor: "#161a33"`, `textColor: "#f3f4f9"`.
- `themeConfig.prism`: unchanged (phase 3 replaces the themes).
- Everything else unchanged.

### 6. Home page minimum

`src/pages/index.module.css` `.heroBanner` uses `--ifm-color-primary` and `--ifm-color-primary-lighter`, which now resolve to indigo shades: check it reads (white title on indigo). If the `Get Started` button loses contrast, set its colour with tokens. Do not restructure the page.

## Acceptance

- `pnpm nx check:all website` passes.
- Screenshots (both themes, 1440 and 390) of `/`, `/docs/overview/`, `/docs/quick-start/`, `/docs/rules/dependencies/`, `/docs/classification/elements/` show: Sora headings, Plex body, indigo links and active sidebar item, paper backgrounds, navbar and footer following the theme, no Infima green anywhere (inline code inside admonitions included), no overflow, no console errors. At 390px, open the mobile menu: the sidebar fills the viewport height with an opaque background.
- Network tab on `/docs/overview/`: only `/fonts/*.woff2` font requests, no `fonts.googleapis.com`/`gstatic`.
- Lighthouse on `/docs/overview/`: Performance ≥ 95, Best practices ≥ 95, Accessibility 96 with `color-contrast` on the Prism `github` tokens as the only failing audit (`00-shared.md` section 8).
- The CodeDiff blocks in `/docs/quick-start/` still show +/- rows legibly in both themes.
- Changelog entry, e.g. `feat: New visual foundation for the site: colour palette, self-hosted Sora and IBM Plex typefaces, smaller base type.`
