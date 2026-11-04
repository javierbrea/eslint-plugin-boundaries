<!-- cspell:disable -->
# T9: verification and the pull request

Run by the coordinator, not delegated, because it ends with the PR and the plan edits the maintainer approves.

1. `pnpm nx run-many -t check:all --all` passes.
2. The quality gates of `../00-shared.md` section 4 on the production build (`pnpm nx build website`, `pnpm --filter website serve`): the screenshots script on `/playground/`, Lighthouse (Accessibility 100, Best practices 100, Performance measured with the chunk loaded, chunk size), the chunk absent on `/` and on a docs page.
3. The renders of the real page next to the mockup's, both themes, 1440×900 and 390×844: deliberate differences become plan edits that update the mockup (`../05-m1-identify.md`, "Verification").
4. The acceptance criteria of #552, each checked.
5. "Finishing a phase" of the `write-plan` skill: the hand-offs of `../05-m1-identify.md` moved into `../06-m2-verdicts.md` and `../07-m3-share-embed.md` as the implementation left them (with the "Phase 6 seams" of `README.md` of this folder), this folder and the phase file deleted, the index status line rewritten and the PR named in the phases table; shown to the maintainer before it is committed.
6. The draft PR with the `create-pr` skill: the deviations recorded here and in the task reports, the screenshots on an orphan `screenshots/feat/552/playground-identify` branch (`../00-shared.md` section 2).
