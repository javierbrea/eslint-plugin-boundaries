#!/usr/bin/env node

/**
 * Checks that a pull request changes no snapshot of the website docs but the one of the latest version, as `packages/website/AGENTS.md` says.
 *
 * Usage: `node scripts/check-versioned-docs.js <base> <head>`, for example `node scripts/check-versioned-docs.js origin/release HEAD`. It checks the changes from the merge base of `<base>` and `<head>` to `<head>`.
 *
 * A snapshot is the folder `packages/website/versioned_docs/version-<version>/` and the file `packages/website/versioned_sidebars/version-<version>-sidebars.json`. A change to it passes when its version is the latest one, which is the first entry of `packages/website/versions.json` at the merge base, or when the pull request adds that version to `versions.json` or removes it, as a release does when it creates a snapshot.
 *
 * Each changed file of another snapshot is written to stderr, and the exit code is 1. A git command that fails also exits with 1, and a bad argument with 2.
 */

import { execFileSync } from "node:child_process";

const USAGE = "Usage: node scripts/check-versioned-docs.js <base> <head>";
const VERSIONS_FILE = "packages/website/versions.json";
const SNAPSHOT_FILE =
  /^packages\/website\/(?:versioned_docs\/version-([^/]+)\/|versioned_sidebars\/version-(.+)-sidebars\.json$)/;

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
 * Reads the versions of the website docs at a commit.
 * @param {string} ref The commit.
 * @returns {string[]} The versions, latest first, or none when the commit has no `versions.json`.
 */
function readVersions(ref) {
  let text;

  try {
    text = git(["show", `${ref}:${VERSIONS_FILE}`]);
  } catch {
    return [];
  }

  return JSON.parse(text);
}

/**
 * Checks the snapshots.
 * @param {string} base The branch the changes go into.
 * @param {string} head The commit that holds the changes.
 * @returns {{ latest: string | undefined, problems: { file: string, version: string }[] }} The latest version, and each changed file of a snapshot that cannot change.
 */
function checkVersionedDocs(base, head) {
  const from = git(["merge-base", base, head]).trim();
  const before = readVersions(from);
  const after = readVersions(head);
  // The versions whose snapshot the pull request creates or removes
  const addedOrRemoved = new Set(
    [...before, ...after].filter(
      (version) => before.includes(version) !== after.includes(version)
    )
  );
  const latest = before[0];
  const problems = [];

  for (const file of git([
    "diff",
    "--name-only",
    "--no-renames",
    "-z",
    from,
    head,
  ])
    .split("\0")
    .filter(Boolean)) {
    const match = SNAPSHOT_FILE.exec(file);

    if (match === null) {
      continue;
    }

    const version = match[1] ?? match[2];

    if (version !== latest && !addedOrRemoved.has(version)) {
      problems.push({ file, version });
    }
  }

  return { latest, problems };
}

/**
 * Runs the check.
 * @param {string[]} args The arguments after the script.
 * @returns {number} The exit code.
 */
function main(args) {
  if (args.length !== 2 || args.some((arg) => arg === "")) {
    console.error(USAGE);
    return 2;
  }

  const [base, head] = args;
  let result;

  try {
    result = checkVersionedDocs(base, head);
  } catch (error) {
    console.error(error.stderr?.trim() || error.message);
    return 1;
  }

  const { latest, problems } = result;

  if (problems.length === 0) {
    process.stdout.write("No snapshot of an older version changes\n");
    return 0;
  }

  for (const { file, version } of problems) {
    console.error(`${file}: belongs to the snapshot of ${version}`);
  }

  console.error(
    `Only the snapshot of the latest version, ${latest}, can change, together with packages/website/docs/, as packages/website/AGENTS.md says. A pull request that must change an older snapshot takes the \`skip-versioned-docs\` label.`
  );
  return 1;
}

process.exitCode = main(process.argv.slice(2));
