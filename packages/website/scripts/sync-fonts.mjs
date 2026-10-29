/**
 * Copies the self-hosted font files from the Fontsource packages into
 * `static/fonts/`, together with each family's license.
 *
 * The Fontsource packages are dev dependencies used only as a source of
 * files: the woff2 files are committed so that the build has no network
 * dependency. Run `pnpm --filter website sync:fonts` after upgrading them.
 *
 * With `--check`, nothing is copied: the script fails if a committed file
 * differs from its package, which `pnpm lint` runs so that an upgrade
 * without the sync does not pass CI.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const resolveModule = createRequire(import.meta.url);
const websiteRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const targetDir = join(websiteRoot, "static", "fonts");
const check = process.argv.includes("--check");

/** Latin woff2 files to ship, per Fontsource package. */
const FONTS = {
  "@fontsource/sora": [
    "sora-latin-500-normal",
    "sora-latin-600-normal",
    "sora-latin-700-normal",
  ],
  "@fontsource/ibm-plex-sans": [
    "ibm-plex-sans-latin-400-normal",
    "ibm-plex-sans-latin-400-italic",
    "ibm-plex-sans-latin-500-normal",
    "ibm-plex-sans-latin-600-normal",
  ],
  "@fontsource/ibm-plex-mono": [
    "ibm-plex-mono-latin-400-normal",
    "ibm-plex-mono-latin-500-normal",
  ],
};

/** Committed files that differ from their package, in `--check` mode. */
const outdated = [];

function sync(source, target) {
  if (!check) {
    copyFileSync(source, target);
  } else if (
    !existsSync(target) ||
    !readFileSync(source).equals(readFileSync(target))
  ) {
    outdated.push(relative(websiteRoot, target));
  }
}

if (!check) {
  mkdirSync(targetDir, { recursive: true });
}

for (const [packageName, files] of Object.entries(FONTS)) {
  const packageRoot = dirname(
    resolveModule.resolve(`${packageName}/package.json`)
  );
  const family = packageName.split("/")[1];
  sync(join(packageRoot, "LICENSE"), join(targetDir, `LICENSE-${family}.txt`));
  for (const file of files) {
    sync(
      join(packageRoot, "files", `${file}.woff2`),
      join(targetDir, `${file}.woff2`)
    );
  }
}

if (outdated.length) {
  console.error(
    `These files differ from the Fontsource packages; run \`pnpm --filter website sync:fonts\` and commit them:\n${outdated.join("\n")}`
  );
  process.exit(1);
}
