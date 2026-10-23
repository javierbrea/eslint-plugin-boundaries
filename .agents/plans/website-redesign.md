<!-- cspell:disable -->
# Website redesign (`packages/website`)

Index of the plan. The plan is split so that an independent agent can implement one phase with no other context than the files named here plus the repository's own agent files.

Status (2026-10-23): design accepted (direction B, "blueprint"), all design decisions closed except the playground stack. No implementation has started.

This plan is committed on the integration branch `feat/website-redesign` (a `.gitignore` exception for `.agents/plans/website-redesign*`) so that sessions in other worktrees or in the cloud can read it. It is temporary: phase 5 removes it, the exception and the related clause in the root `AGENTS.md` before the branch merges into `release`. Phase agents read the plan but do not edit it; deviations go in the PR description and the maintainer updates the plan on the integration branch.

## Files

| File | Read it when |
| --- | --- |
| `website-redesign/00-shared.md` | Always. Environment, branching, design tokens, type scale, motion spec, UI vocabulary, conventions, quality gates, definition of done. |
| `website-redesign/01-foundation.md` | Phase 1: tokens, fonts, Infima bridge, type scale. Docs pages get the new look. |
| `website-redesign/02-home.md` | Phase 2: the new home page, live stats, navbar stars pill, footer, visual checks, boundaries dogfooding. |
| `website-redesign/03-docs-polish.md` | Phase 3: code theme, docs typography, admonitions, sidebar, search, navbar and footer details. |
| `website-redesign/04-playground.md` | Phase 4: the in-site playground (separate milestone; research first). |
| `website-redesign/05-cleanup.md` | Phase 5: remove this plan from the branch before merging into `release`. |
| `website-redesign/mockups/mockup-b-blueprint.html` | The approved mockup. Ground truth for layout, copy, CSS values and behaviors of the home. Open it in a browser (wrap it in a doctype skeleton or use the script in `02-home.md` section 10). |
| `website-redesign/mockups/mockB-light.png`, `mockB-dark.png` | Desktop renders of the mockup in both themes. Mobile renders come from the same script. |
| `website-redesign/mockups/mockup-a-signal.html` | Rejected direction, kept only for its canvas dependency graph (candidate playground result view). |

## Phases

| Phase | Branch | Depends on | PR title |
| --- | --- | --- | --- |
| 1 Foundation | `feat/website-redesign-foundation` | — | `feat(website): design tokens, self-hosted fonts and Infima bridge` |
| 2 Home | `feat/website-redesign-home` | 1 merged | `feat(website): redesign the home page` |
| 3 Docs polish | `feat/website-redesign-docs` | 1 merged (2 preferred) | `feat(website): restyle docs pages, code blocks and site chrome` |
| 4 Playground | `feat/website-playground` | 2 merged, research done | `feat(website): playground` (its own milestone) |
| 5 Cleanup | `chore/website-redesign-cleanup` | 1–3 merged (4 may follow later) | `chore(website): remove the redesign plan` |

Phases 2 and 3 can run in parallel by two agents once phase 1 is merged; they touch different files except `docusaurus.config.ts` and `src/css/custom.css` (small, mergeable hunks).

Every phase branch starts from `feat/website-redesign` and its PR targets `feat/website-redesign` (the integration branch), not `release`. The integration branch tracks `release` (merge, never rebase: other sessions build on it); the 7.3.0 release shipped on 2026-10-23 and is merged here.

The redesign is released on its own, as a website release, as soon as phases 1, 2, 3 and 5 are merged. The site is one Docusaurus build whose theme is shared by every docs version, so the moment the styles go live every version changes at once and the home must go out adapted in the same deploy. It does not wait for a plugin release: the maintainer merges `feat/website-redesign` into `release` and sets the website version per step 2 of "Publishing" in `.github/CONTRIBUTING.md` (a documentation-only website release, `7.3.0-docs.N`, when no plugin release coincides).

## Decisions (closed)

1. Direction B ("blueprint"): cool paper, one indigo accent, teal = allowed, vermilion = violation.
2. Hero background: gradient glows + film grain. The mockup's `grid` and `both` variants and its background switch are not implemented.
3. Theme: respect the system preference (`colorMode.respectPrefersColorScheme: true` stays); both themes designed.
4. Type: Sora (display) / IBM Plex Sans (body) / IBM Plex Mono (code, labels), self-hosted under `static/fonts`.
5. Headline: "Lint your architecture, not just your syntax." with "architecture" underlined in the accent. Lead: "Classify your files, write policies for who may depend on whom, and get an ESLint error the moment a boundary is crossed. In your IDE, in CI, with nothing new to run."
6. Live numbers (stars, downloads) fetched client-side and cached in localStorage for 24h, the same approach javierbrea.com uses for its project stats; years and copyright computed from the current date.
7. Styling stack: Docusaurus 3 + Infima, design tokens + CSS Modules, no Tailwind, no CSS-in-JS on home or docs. MUI, if ever, only inside the client-only playground.
8. Code blocks use one always-dark palette in both themes (home and docs).
9. Docs markdown stays untouched except the acknowledgments page (phase 2). Any docs edit the redesign needs is applied identically to `docs/` (served at `/docs/next/`) and to `versioned_docs/version-7.3.0/` (the latest snapshot, served at `/docs/`), never to older snapshots. Details in `00-shared.md` section 2.

## Open

1. Playground stack and engine (see `04-playground.md`, research tasks). Does not block phases 1-3.
