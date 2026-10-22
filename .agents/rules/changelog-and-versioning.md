---
paths:
  - "**/CHANGELOG.md"
  - "**/package.json"
---

# Changelog and versioning

The SemVer meanings, the independent version of each package and the bump of dependent packages are in the "Versioning" section of `.github/CONTRIBUTING.md`.

Every change that affects a published package's behavior adds an entry to that package's `CHANGELOG.md`, in the format already used in the file: under the Unreleased section at the top (`## [Unreleased]` or `## [unreleased]`, as the file has it), or under the section of the new version when the change also bumps the package version. A change doesn't have to bump the version; when it does, follow the "Versioning" section of `.github/CONTRIBUTING.md`. Don't date a version section; the release process does it (the `release` skill).

`packages/website` follows a different versioning rule: see step 2 of "Publishing" in `.github/CONTRIBUTING.md`.
