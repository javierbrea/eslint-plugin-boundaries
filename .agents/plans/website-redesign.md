<!-- cspell:disable -->
# Website redesign (`packages/website`)

Index of the plan. The plan is split so that an independent agent can implement one phase with no other context than the files named here plus the repository's own agent files.

Status (2026-10-24): design accepted (direction B, "blueprint"), all design decisions closed. The playground is no longer part of the redesign: it has its own RFC ([#538](https://github.com/javierbrea/eslint-plugin-boundaries/discussions/538)) and tracking issue (#539), and the home teaser links to that issue. Phase 1 is implemented and merged into the integration branch (PR #536); phase 2 is implemented (PR #537, under review); phase 5 is implemented (PR #542, merged last); phase 3 is implemented (PR #543, under review). The plan already reflects what the implemented phases learned.

This plan is committed on the integration branch `feat/website-redesign` (a `.gitignore` exception for `.agents/plans/website-redesign*`) so that sessions in other worktrees or in the cloud can read it. It is temporary: phase 5 removes it, the exception and the related clause in the root `AGENTS.md` before the branch merges into `release`. Phase sessions read the plan and keep it true: whenever a session deviates from its phase file, finds a fact here that is wrong, or leaves work for a later phase, it records that in the PR description and also proposes the matching plan edit to the maintainer. With the maintainer's permission it commits the edit on `feat/website-redesign` directly (a `chore(website)` commit, pushed, so every session sees it), never silently and never on the phase branch alone. The maintainer may also apply the edit themselves.

## Files

| File | Read it when |
| --- | --- |
| `website-redesign/00-shared.md` | Always. Environment, branching, design tokens, type scale, motion spec, UI vocabulary, conventions, quality gates, definition of done. |
| `website-redesign/01-foundation.md` | Phase 1: tokens, fonts, Infima bridge, type scale. Docs pages get the new look. |
| `website-redesign/02-home.md` | Phase 2: the new home page, live stats, navbar stars pill, footer, visual checks, boundaries dogfooding. |
| `website-redesign/03-docs-polish.md` | Phase 3: code theme, docs typography, admonitions, sidebar, search, navbar and footer details. |
| `website-redesign/05-cleanup.md` | Phase 5: remove this plan from the branch before merging into `release`. |
| `website-redesign/mockups/mockup-b-blueprint.html` | The approved mockup. Ground truth for layout, copy, CSS values and behaviors of the home. Open it in a browser (wrap it in a doctype skeleton or use the script in `02-home.md` section 10). |
| `website-redesign/mockups/mockB-light.png`, `mockB-dark.png` | Desktop renders of the mockup in both themes. Mobile renders come from the same script. |
| `website-redesign/mockups/mockup-a-signal.html` | Rejected direction, kept only for its canvas dependency graph; a copy lives on the orphan branch `rfc/538-playground-assets`, which belongs to the playground RFC and is not part of the redesign. |

## Phases

| Phase | Branch | Depends on | PR title |
| --- | --- | --- | --- |
| 1 Foundation | `feat/website-redesign-foundation` | — | `feat(website): design tokens, self-hosted fonts and Infima bridge` |
| 2 Home | `feat/website-redesign-home` | 1 merged | `feat(website): redesign the home page` |
| 3 Docs polish | `feat/website-redesign-docs` | 1 merged, 2 on its branch | `feat(website): restyle docs pages, code blocks and site chrome` |
| 5 Cleanup | `chore/website-redesign-cleanup` | 1–3 merged (PR open, merge last) | `chore(website): remove the redesign plan` |

Phases 2 and 3 can run in parallel by two agents once phase 1 is merged; they touch different files except `docusaurus.config.ts` and `src/css/custom.css` (small, mergeable hunks).

Every phase branch starts from `feat/website-redesign` and its PR targets `feat/website-redesign` (the integration branch), not `release`. Exception, phase 3: it starts from `feat/website-redesign-home` and its PR targets that branch while PR #537 is under review, because it reuses the home's Prism theme and both phases touch `docusaurus.config.ts` and `src/css/custom.css`; once #537 is merged the PR is retargeted to `feat/website-redesign`. Phase 5 (PR #542, also against the home branch) merges after phase 3. The integration branch tracks `release` (merge, never rebase: other sessions build on it); the 7.3.0 release shipped on 2026-10-23 and is merged here.

The redesign goes live by merging, not by a release. As soon as phases 1, 2, 3 and 5 are merged, the maintainer merges `feat/website-redesign` into `release` and `release` into `master` (maintainer-only, merge commit, as the branching model in `.github/CONTRIBUTING.md` says); Netlify deploys `master`. No package is published, so there is no website version bump and no GitHub release. The site is one Docusaurus build whose theme is shared by every docs version: the moment the styles are deployed every version changes at once, which is why the home must go out adapted in the same deploy and why any docs edit is made in both the current snapshot and `docs/` (decision 9).

## Decisions (closed)

1. Direction B ("blueprint"): cool paper, one indigo accent, teal = allowed, vermilion = violation.
2. Hero background: gradient glows + film grain. The mockup's `grid` and `both` variants and its background switch are not implemented.
3. Theme: respect the system preference (`colorMode.respectPrefersColorScheme: true` stays); both themes designed.
4. Type: Sora (display) / IBM Plex Sans (body) / IBM Plex Mono (code, labels), self-hosted under `static/fonts`.
5. Headline: "Lint your architecture, not just your syntax." with "architecture" underlined in the accent. Lead: "Classify your files, write policies for who may depend on whom, and get an ESLint error the moment a boundary is crossed. In your IDE, in CI, with nothing new to run."
6. Live numbers (stars, downloads) fetched client-side and cached in localStorage for 24h, the same approach javierbrea.com uses for its project stats; years and copyright computed from the current date.
7. Styling stack: Docusaurus 3 + Infima, design tokens + CSS Modules, no Tailwind, no CSS-in-JS on home or docs. MUI, if ever, only inside the client-only playground.
8. Code blocks use one always-dark palette in both themes (home and docs); the surface is `--jsb-code`, which darkens further in dark mode.
9. Docs markdown stays untouched except the acknowledgments page (phase 2). Any docs edit the redesign needs is applied identically to `docs/` (served at `/docs/next/`) and to `versioned_docs/version-7.3.0/` (the latest snapshot, served at `/docs/`), never to older snapshots. Details in `00-shared.md` section 2.

## Open

None. The playground (former phase 4) lives in RFC [#538](https://github.com/javierbrea/eslint-plugin-boundaries/discussions/538) and tracking issue #539; it does not block the redesign.
