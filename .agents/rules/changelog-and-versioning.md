---
paths:
  - "**/CHANGELOG.md"
  - "**/package.json"
---

# Changelog and versioning

The SemVer meanings, the independent version of each package and the bump of dependent packages are in the "Versioning" section of `.github/CONTRIBUTING.md`.

Every change that affects a published package's behavior adds an entry to that package's `CHANGELOG.md`, under the Unreleased section at the top of the file (`## [Unreleased]` or `## [unreleased]`, as the file has it), in the format already used in the file. Don't create a dated version section; the release process does it (the `release` skill).

`packages/website` follows a different versioning rule: see step 2 of "Publishing" in `.github/CONTRIBUTING.md`.
