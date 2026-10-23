---
paths:
  - "**/CHANGELOG.md"
  - "**/package.json"
---

# Changelog and versioning

The SemVer meanings, the independent version of each package and the bump of dependent packages are in the "Versioning" section of `.github/CONTRIBUTING.md`.

Every change that affects a published package's behavior adds an entry to that package's `CHANGELOG.md`, in the format already used in the file: under the `## [Unreleased]` section at the top, or under the section of the new version when the change also bumps the package version. A change doesn't have to bump the version; when it does, follow the "Versioning" section of `.github/CONTRIBUTING.md`. Don't date a version section; the release process does it (the `release` skill).

`packages/website` follows a different versioning rule: see step 2 of "Publishing" in `.github/CONTRIBUTING.md`.

## Entry style

An entry is written for the users of the package, not for the reviewer of the change. Keep it to one or two sentences:

- Say what changes for the user. When the change may affect their project, say what to do, and link the upgrade notes or the issue for the details.
- Leave implementation details, reasoning and measurement methods to the pull request or the commit message. Include a number only when it changes what the reader expects, such as a speed-up.
- Don't repeat a fact across entries. A dependency upgrade is one `chore` entry; the entries of the changes it brings describe their effect, not the upgrade.
- Keep the `type(#issue):` prefix and the contributor credit at the end, `([@user](https://github.com/user))`, as the file already does.
