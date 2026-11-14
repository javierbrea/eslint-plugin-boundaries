#!/usr/bin/env node

/**
 * Checks that a pull request adds an entry to the `CHANGELOG.md` of every package whose published or deployed files it changes, as the "Pull Request" section of `.github/CONTRIBUTING.md` asks.
 *
 * Usage: `node scripts/check-changelogs.js <base> <head> <released>`, for example `node scripts/check-changelogs.js origin/release HEAD origin/master`. It checks the changes from the merge base of `<base>` and `<head>` to `<head>`, and `<released>` is the branch that holds the released versions.
 *
 * Each changelog covers the files of its package, and two of them cover more: the `eslint-plugin` changelog covers the root `README.md`, which the build of the plugin copies into the package, and the `website` changelog covers the `playground` and `design-tokens` packages, which the website deploys. Of those files, the ones that are never published nor deployed, such as tests or the configuration of a tool that doesn't build the package, need no entry, and a `package.json` needs one only when something other than its `devDependencies` or `scripts` changes.
 *
 * A changelog has an entry when the part above its first released version, which is the first version that the changelog of `<released>` also has, changes. That counts an entry added or edited under `## [Unreleased]` or under a version that is not released yet, and the heading that a release adds above the entries it releases, but not an edit of a released version. Blank lines and trailing spaces are ignored.
 *
 * Every changelog that has no entry for its changes is written to stderr with the files that need it, and the exit code is 1. A git command that fails also exits with 1, and a bad argument with 2.
 */

import { execFileSync } from "node:child_process";
import path from "node:path";

const USAGE =
  "Usage: node scripts/check-changelogs.js <base> <head> <released>";

/**
 * @typedef {object} Changelog
 * @property {string} changelog The path of the changelog.
 * @property {string[]} paths The files it covers: a path that ends with `/` covers the files under that folder, and any other path covers that file.
 */

/** @type {Changelog[]} */
const CHANGELOGS = [
  {
    changelog: "packages/elements/CHANGELOG.md",
    paths: ["packages/elements/"],
  },
  { changelog: "packages/config/CHANGELOG.md", paths: ["packages/config/"] },
  {
    changelog: "packages/policies/CHANGELOG.md",
    paths: ["packages/policies/"],
  },
  {
    changelog: "packages/eslint-plugin/CHANGELOG.md",
    paths: ["packages/eslint-plugin/", "README.md"],
  },
  {
    changelog: "packages/website/CHANGELOG.md",
    paths: [
      "packages/website/",
      "packages/playground/",
      "packages/design-tokens/",
    ],
  },
];

// The covered files that are never published nor deployed, so they need no entry
const UNPUBLISHED_FILES = [
  // Changelogs, agent instructions and the READMEs of the private packages
  "**/CHANGELOG.md",
  "**/AGENTS.md",
  "**/CLAUDE.md",
  "**/.gitignore",
  "packages/website/README.md",
  "packages/playground/README.md",
  "packages/design-tokens/README.md",
  // Tests, their snapshots, mocks and Playwright page objects
  "**/*.spec.*",
  "**/*.test.*",
  "**/__snapshots__/**",
  "packages/*/test/**",
  "**/*.mock.{ts,tsx}",
  "**/*.pom.ts",
  "**/*.playwright.ts",
  "packages/playground/src/playwright.ts",
  "**/tsup.playwright.config.js",
  // The configuration of the tools that don't build the packages. Babel only transforms the tests
  "**/project.json",
  "**/eslint.config.*",
  "**/eslint-local-rules.js",
  "**/cspell.config.*",
  "**/jest.config.*",
  "**/jest.setup.*",
  "**/babel.config.*",
  "**/stryker.config.*",
  "**/sonar-project.properties",
  "**/serve.*.json",
  "**/tsconfig.eslint.json",
  "**/tsconfig.test.json",
  // What only development uses: the playground harness and the maintenance scripts
  "packages/playground/dev/**",
  "packages/playground/vite.config.js",
  "packages/website/scripts/**",
  "packages/design-tokens/scripts/**",
];

// The fields of a `package.json` that never reach the users of the package
const UNPUBLISHED_PACKAGE_FIELDS = ["devDependencies", "scripts"];

const VERSION_HEADING = /^## \[([^\]]+)\]/;
// Older changelogs wrote it in lower case
const UNRELEASED = "unreleased";

/**
 * Runs a git command.
 * @param {string[]} args The arguments of the command.
 * @returns {string} Its output.
 */
function git(args) {
  // eslint-disable-next-line sonarjs/no-os-command-from-path -- Git runs from the PATH, as it does for any developer or runner
  return execFileSync("git", args, {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    stdio: ["ignore", "pipe", "pipe"],
  });
}

/**
 * Reads a file at a commit.
 * @param {string} ref The commit.
 * @param {string} file The path of the file.
 * @returns {string | undefined} Its content, or undefined when the commit doesn't have it.
 */
function readFile(ref, file) {
  try {
    return git(["show", `${ref}:${file}`]);
  } catch {
    return undefined;
  }
}

/**
 * Lists the files that change between two commits. A renamed file is listed with both paths.
 * @param {string} from The first commit.
 * @param {string} to The second commit.
 * @returns {string[]} The paths of the changed files.
 */
function changedFiles(from, to) {
  return git(["diff", "--name-only", "--no-renames", "-z", from, to])
    .split("\0")
    .filter(Boolean);
}

/**
 * Tells whether a changelog covers a file.
 * @param {Changelog} changelog The changelog.
 * @param {string} file The path of the file.
 * @returns {boolean} Whether the changelog covers it.
 */
function covers(changelog, file) {
  return changelog.paths.some((covered) =>
    covered.endsWith("/") ? file.startsWith(covered) : file === covered
  );
}

/**
 * Returns a `package.json` without the fields that never reach the users of the package.
 * @param {string | undefined} text The content of the file.
 * @returns {string | undefined} The fields that reach them, as JSON, or undefined when there is no file.
 */
function publishedPackageFields(text) {
  if (text === undefined) {
    return undefined;
  }

  const manifest = JSON.parse(text);

  for (const field of UNPUBLISHED_PACKAGE_FIELDS) {
    delete manifest[field];
  }

  return JSON.stringify(manifest);
}

/**
 * Tells whether a change to a file needs a changelog entry.
 * @param {string} file The path of the changed file.
 * @param {string} from The commit before the change.
 * @param {string} to The commit after the change.
 * @returns {boolean} Whether the change needs an entry.
 */
function needsEntry(file, from, to) {
  if (UNPUBLISHED_FILES.some((glob) => path.posix.matchesGlob(file, glob))) {
    return false;
  }

  if (path.posix.basename(file) === "package.json") {
    return (
      publishedPackageFields(readFile(from, file)) !==
      publishedPackageFields(readFile(to, file))
    );
  }

  return true;
}

/**
 * Lists the versions that a changelog has a heading for.
 * @param {string | undefined} text The content of the changelog.
 * @returns {Set<string>} The versions, without `Unreleased`.
 */
function versions(text) {
  const found = new Set();

  for (const line of text?.split("\n") ?? []) {
    const version = VERSION_HEADING.exec(line)?.[1];

    if (version !== undefined && version.toLowerCase() !== UNRELEASED) {
      found.add(version);
    }
  }

  return found;
}

/**
 * Returns the part of a changelog that is not released: from its first `## ` heading to the heading of its first released version.
 * @param {string | undefined} text The content of the changelog.
 * @param {Set<string>} released The released versions.
 * @returns {string} That part, without blank lines and trailing spaces.
 */
function unreleasedPart(text, released) {
  const lines = (text ?? "").split("\n").map((line) => line.trimEnd());
  const start = lines.findIndex((line) => line.startsWith("## "));

  if (start === -1) {
    return "";
  }

  // A changelog with no `## [Unreleased]` heading starts with its first released version, and then that part is empty
  const end = lines.findIndex(
    (line, index) =>
      index >= start && released.has(VERSION_HEADING.exec(line)?.[1])
  );

  return lines
    .slice(start, end === -1 ? undefined : end)
    .filter(Boolean)
    .join("\n");
}

/**
 * Checks the changelogs.
 * @param {string} base The branch the changes go into.
 * @param {string} head The commit that holds the changes.
 * @param {string} released The branch that holds the released versions.
 * @returns {{ changelog: string, files: string[], hasEntry: boolean }[]} Each changelog that covers changes needing an entry, with those files and whether it has an entry.
 */
function checkChangelogs(base, head, released) {
  const from = git(["merge-base", base, head]).trim();
  const files = changedFiles(from, head);

  return CHANGELOGS.map((entry) => {
    const { changelog } = entry;
    const releasedVersions = versions(readFile(released, changelog));

    return {
      changelog,
      files: files.filter(
        (file) => covers(entry, file) && needsEntry(file, from, head)
      ),
      hasEntry:
        unreleasedPart(readFile(from, changelog), releasedVersions) !==
        unreleasedPart(readFile(head, changelog), releasedVersions),
    };
  }).filter((result) => result.files.length > 0);
}

/**
 * Runs the check.
 * @param {string[]} args The arguments after the script.
 * @returns {number} The exit code.
 */
function main(args) {
  if (args.length !== 3 || args.some((arg) => arg === "")) {
    console.error(USAGE);
    return 2;
  }

  const [base, head, released] = args;
  let results;

  try {
    results = checkChangelogs(base, head, released);
  } catch (error) {
    console.error(error.stderr?.trim() || error.message);
    return 1;
  }

  const missing = results.filter(({ hasEntry }) => !hasEntry);

  for (const { changelog, files } of results.filter(
    ({ hasEntry }) => hasEntry
  )) {
    const changes = files.length === 1 ? "1 file" : `${files.length} files`;

    process.stdout.write(`${changelog}: has an entry for ${changes}\n`);
  }

  if (missing.length === 0) {
    if (results.length === 0) {
      process.stdout.write("No change needs a changelog entry\n");
    }
    return 0;
  }

  for (const { changelog, files } of missing) {
    console.error(`${changelog}: has no entry for the changes to:`);
    for (const file of files) {
      console.error(`  ${file}`);
    }
  }

  console.error(
    'Add an entry under "## [Unreleased]" of each changelog, or under the section of the version that the pull request bumps, as the "Pull Request" section of .github/CONTRIBUTING.md says. A pull request that needs no entry, such as one that changes a package or a feature that is not released yet, takes the `skip-changelog` label.'
  );
  return 1;
}

process.exitCode = main(process.argv.slice(2));
