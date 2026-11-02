// Bundles the scenarios for browsers into dist/scenarios.js, as a browser consumer of the packages would: esbuild with
// platform "browser" and without aliases or polyfills of Node.js modules and globals. Copies the static page that loads
// the bundle to dist/index.html. Fails if the bundle has warnings or does not include the browser build of every
// package, so the browsers never run a Node.js build.

import { copyFile, rm } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { build } from "esbuild";

const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(PROJECT_ROOT, "dist");
const PACKAGES = [
  "@boundaries/elements",
  "@boundaries/config",
  "@boundaries/policies",
];

const requireFromProject = createRequire(import.meta.url);

await rm(DIST, { recursive: true, force: true });

const result = await build({
  entryPoints: [join(PROJECT_ROOT, "src", "scenarios", "index.js")],
  outfile: join(DIST, "scenarios.js"),
  absWorkingDir: PROJECT_ROOT,
  bundle: true,
  platform: "browser",
  format: "iife",
  globalName: "scenarios",
  metafile: true,
  logLevel: "warning",
});

const inputs = new Set(
  Object.keys(result.metafile.inputs).map((input) =>
    resolve(PROJECT_ROOT, input)
  )
);
const missingBuilds = PACKAGES.map((packageName) => {
  const manifestPath = requireFromProject.resolve(
    `${packageName}/package.json`
  );
  const { browser } = requireFromProject(manifestPath).exports["."];
  return resolve(dirname(manifestPath), browser.import);
}).filter((browserBuild) => !inputs.has(browserBuild));

if (result.warnings.length || missingBuilds.length) {
  console.error(
    missingBuilds
      .map((browserBuild) => `Not bundled: ${browserBuild}`)
      .join("\n")
  );
  process.exit(1);
}

await copyFile(
  join(PROJECT_ROOT, "src", "index.html"),
  join(DIST, "index.html")
);
console.warn(`Bundled ${PACKAGES.join(", ")} into ${DIST}`);
