#!/usr/bin/env node

/**
 * Checks that a pull request adds an entry to the `CHANGELOG.md` of every package whose published or deployed files it changes, as the "Pull Request" section of `.github/CONTRIBUTING.md` asks.
 *
 * Usage: `node scripts/check-changelogs.js <base> <head> <released>`, for example `node scripts/check-changelogs.js origin/release HEAD origin/master`. It checks the changes from the merge base of `<base>` and `<head>` to `<head>`, and `<released>` is the branch that holds the released versions.
 *
 * Each changelog covers the files of its package, and two of them cover more: the `eslint-plugin` changelog covers the root `README.md`, which the build of the plugin copies into the package, and the `website` changelog covers the `playground` and `design-tokens` packages, which the website deploys. Of those files, the ones that are never published nor deployed, such as tests or the configuration of a tool that doesn't build the package, need no entry. A `package.json` needs one only when something other than its `devDependencies` or the scripts that its `build` script doesn't run changes, and a `project.json` only when its `build` target changes, comments aside.
 *
 * A changelog has an entry when the part above its first released version, which is the first version that the changelog of `<released>` also has, gains a line that it didn't have. That counts an entry added or edited under `## [Unreleased]` or under a version that is not released yet, and the heading that a release adds above the entries it releases, but not an edit of a released version, nor removing or moving entries. Blank lines and trailing spaces are ignored.
 *
 * Every changelog that has no entry for its changes is written to stderr with the files that need it, and the exit code is 1. A git command that fails, such as one given a reference that is not a commit, also exits with 1, and a bad argument with 2.
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
    changelog: "packages/analysis/CHANGELOG.md",
    paths: ["packages/analysis/"],
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
  "packages/website/src/playwright.ts",
  "**/tsup.playwright.config.js",
  // The support that the specs and the page objects of the playground share, which its production code never imports (`packages/playground/eslint.config.mjs`)
  "packages/playground/src/shared/testing/**",
  // The configuration of the tools that don't build the packages. Babel only transforms the tests
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

const PACKAGE_FILE = "package.json";
const PROJECT_FILE = "project.json";
// The Nx target of a `project.json` and the script of a `package.json` that build the package
const BUILD = "build";
// A script that runs another one, such as `pnpm build:tsc`
const RUN_SCRIPT = /\bpnpm (?:run )?([\w:-]+)/g;
// A string of a JSONC file, which is kept, or a comment, which is removed
const JSONC_COMMENT = /("(?:\\.|[^"\\])*")|\/\/[^\n]*|\/\*[\s\S]*?\*\//g;
// A string of a JSONC file, which is kept, or a comma that no value follows, which is removed
const JSONC_TRAILING_COMMA = /("(?:\\.|[^"\\])*")|,(?=\s*[}\]])/g;

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
 * Reads a file at a commit. A reference that is not a commit, or any other failure of git, throws.
 * @param {string} ref The commit.
 * @param {string} file The path of the file.
 * @returns {string | undefined} Its content, or undefined when the commit doesn't have it.
 */
function readFile(ref, file) {
  if (git(["ls-tree", "--full-tree", "--name-only", ref, "--", file]) === "") {
    return undefined;
  }

  return git(["show", `${ref}:${file}`]);
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
 * Parses a JSON file that may have comments and trailing commas, as Nx reads a `project.json`.
 * @param {string} text The content of the file.
 * @returns {any} Its value.
 */
function parseJsonc(text) {
  const keepString = (_match, string) => string ?? "";

  return JSON.parse(
    text
      .replace(JSONC_COMMENT, keepString)
      .replace(JSONC_TRAILING_COMMA, keepString)
  );
}

/**
 * Returns the scripts of a `package.json` that its build runs: `build`, and in turn the scripts that each one runs with `pnpm`.
 * @param {Record<string, string> | undefined} scripts The scripts of the `package.json`.
 * @returns {Record<string, string>} The scripts that the build runs.
 */
function buildScripts(scripts = {}) {
  const found = {};
  const pending = [BUILD];

  while (pending.length > 0) {
    const name = pending.pop();

    if (Object.hasOwn(scripts, name) && !Object.hasOwn(found, name)) {
      found[name] = scripts[name];

      for (const [, called] of scripts[name].matchAll(RUN_SCRIPT)) {
        pending.push(called);
      }
    }
  }

  return found;
}

/**
 * Returns the part of a `package.json` or a `project.json` that builds or publishes the package: the `package.json` without its `devDependencies` and the scripts that its build doesn't run, and the `build` target of the `project.json`.
 * @param {string} file The path of the file.
 * @param {string | undefined} text The content of the file.
 * @returns {string | undefined} That part, as JSON, or undefined when there is no file or no `build` target.
 */
function buildOrPublishedPart(file, text) {
  if (text === undefined) {
    return undefined;
  }

  if (path.posix.basename(file) === PROJECT_FILE) {
    return JSON.stringify(parseJsonc(text).targets?.[BUILD]);
  }

  const manifest = JSON.parse(text);

  delete manifest.devDependencies;
  manifest.scripts = buildScripts(manifest.scripts);

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

  if ([PACKAGE_FILE, PROJECT_FILE].includes(path.posix.basename(file))) {
    return (
      buildOrPublishedPart(file, readFile(from, file)) !==
      buildOrPublishedPart(file, readFile(to, file))
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
 * @returns {string[]} The lines of that part, without blank lines and trailing spaces.
 */
function unreleasedPart(text, released) {
  const lines = (text ?? "").split("\n").map((line) => line.trimEnd());
  const start = lines.findIndex((line) => line.startsWith("## "));

  if (start === -1) {
    return [];
  }

  // A changelog with no `## [Unreleased]` heading starts with its first released version, and then that part is empty
  const end = lines.findIndex(
    (line, index) =>
      index >= start && released.has(VERSION_HEADING.exec(line)?.[1])
  );

  return lines.slice(start, end === -1 ? undefined : end).filter(Boolean);
}

/**
 * Tells whether some lines include one that others don't, counting repeated lines once each.
 * @param {string[]} before The lines before the change.
 * @param {string[]} after The lines after the change.
 * @returns {boolean} Whether `after` has a line that `before` doesn't.
 */
function addsLine(before, after) {
  const remaining = new Map();

  for (const line of before) {
    remaining.set(line, (remaining.get(line) ?? 0) + 1);
  }

  return after.some((line) => {
    const count = remaining.get(line) ?? 0;

    remaining.set(line, count - 1);
    return count === 0;
  });
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
      hasEntry: addsLine(
        unreleasedPart(readFile(from, changelog), releasedVersions),
        unreleasedPart(readFile(head, changelog), releasedVersions)
      ),
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
