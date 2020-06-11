# Contributing

First off, thanks for taking the time to contribute!

The following is a set of guidelines for contributing to this project. These are mostly guidelines, not rules. Use your best judgment, and feel free to propose changes to this document in a pull request.

#### Table Of Contents

* [Code of Conduct](#code-of-conduct)
* [Project governance](#project-governance)
  * [Rules](#rules)
  * [Releases](#releases)
  * [Changes to this arrangement](#changes-to-this-arrangement)
* [Pull Requests](#pull-requests)
* [Styleguides](#styleguides)
  * [Git Commit Messages](#git-commit-messages)
  * [JavaScript Styleguide](#javascript-styleguide)
  * [Tests Styleguide](#tests-styleguide)
* [Developer's certificate of origin](#developers-certificate-of-origin)

## Code of Conduct

This project and everyone participating in it is governed by the [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## Project Governance

Individuals making significant and valuable contributions are given commit-access to the project to contribute as they see fit.

### Rules

There are a few basic ground-rules for contributors:

1. **No `--force` pushes** or modifying the Git history in any way.
2. **All modifications** should be subject to a **pull request** to solicit feedback from other contributors. The base branch of the pull request should correspond with the assigned "release milestone" of the related issue. When an issue is created, it will be prioritized and a "release milestone" will be assigned to it, at the criteria of contributors. A branch will be created from master for that release milestone, and all related issues should be merged into it, until is ready to declare a formal release.
3. **All changes** to this project will be documented in the GHANGELOG.md file.

### Releases

Declaring formal releases remains the prerogative of the project maintainer. 

### Changes to this arrangement

This document may also be subject to pull-requests or changes by contributors where you believe you have something valuable to add or change.

## Pull Requests

* Fill in [the required template](PULL_REQUEST_TEMPLATE.md).
* Do not include issue numbers in the PR title.
* Follow the [JavaScript styleguide](#javascript-styleguide).
* Follow the [Tests styleguide](#tests-styleguide).
* All enhancements and bug fixes must be accompanied with all needed new related regression test.
* Coverage of unit tests must remain 100%.
* Run tests often. Tests are ran automatically with Travis when you push, but you still need to run them locally before pushing.
* Document new features, or update documentation if changes affect to it.
* End all files with a newline.
* Place requires in the following order:
    * Built in Node Modules (such as `path`)
    * NPM Modules (such as `lodash`)
    * Local Modules (using relative paths)

## Styleguides

### Git Commit Messages

* Use the present tense ("Add feature" not "Added feature")
* Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
* Limit the first line to 72 characters or less
* Reference issues and pull requests liberally after the first line

### JavaScript Styleguide

All JavaScript must adhere to the style defined in the `.eslintrc.json` file.

### Tests Styleguide

- Fail tests first. How do you know if it is actually testing anything if the assert never failed?
- Treat `describe` as a noun or situation (Situations usually start with "when").
- Treat `it` as a statement about state or how an operation changes state. Usually, all `it` should start with "should".
- Prefer fewer asserts per `it`.
- Prefer one file for all specs of a javascript file, but, if it grows too much, split it into many files adding a sufix describing the behavior being tested in it (`file.behavior.js`)

#### Example

```js
describe("a dog", () => {
  describe("when is happy", () => {
    it("should wags its tail", () => {
      expect(dog.tail.moving).to.be.true();
    });
  });
});
```

## Developer's Certificate of Origin

By making a contribution to this project, I certify that:

- (a) The contribution was created in whole or in part by me and I have the right to
  submit it under the open source license indicated in the file; or

- (b) The contribution is based upon previous work that, to the best of my knowledge, is
  covered under an appropriate open source license and I have the right under that license
  to submit that work with modifications, whether created in whole or in part by me, under
  the same open source license (unless I am permitted to submit under a different
  license), as indicated in the file; or

- (c) The contribution was provided directly to me by some other person who certified
  (a), (b) or (c) and I have not modified it.

- (d) I understand and agree that this project and the contribution are public and that a
  record of the contribution (including all personal information I submit with it,
  including my sign-off) is maintained indefinitely and may be redistributed consistent
  with this project or the open source license(s) involved.
