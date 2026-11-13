# AGENTS Instructions — `design-tokens`

Package-scoped agent instructions for `@boundaries/design-tokens` (Nx project `design-tokens`, private): the `--jsb-*` design tokens and the self-hosted fonts that the website and the hosts of the playground share. How a host loads them is in `README.md`; how the hosts depend on the package, in the `repo-architecture` skill.

- A host reaches the package by its name only: it imports `tokens.css` and `fonts.css` through the `exports` of `package.json`, and serves `STATIC_DIR` of the entry at its root. The URLs of `fonts.css` stay root-relative (`/fonts/`), because the website preloads two of them by URL.
- The package has no build. The `assets` named input of `project.json` lists every file that a host reads, so a new file that a host reads goes in it.
- The files of `static/fonts/` are copies from the Fontsource packages of `devDependencies`, refreshed with `sync:fonts`; `lint` fails while they differ. `.agents/rules/social-card.md` says what else a change to a token or a font changes.

Primary checks: `lint`, `check:types`, `check:spell`.
