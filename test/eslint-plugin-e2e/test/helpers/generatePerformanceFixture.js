import {
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative } from "node:path";

import { performanceTestsAreDisabled } from "./performance.js";

const DOMAIN_COUNT = 10;
const LAYER_COUNT = 10;
const FEATURE_COUNT = 5;
const FILES_PER_FEATURE = 10;
const UNKNOWN_FILES_COUNT = 10;
const LOCAL_IMPORTS_PER_FILE = 12;
const OFFSET_SEEDS = [
  1, 7, 13, 29, 61, 127, 173, 257, 389, 467, 557, 701, 809, 947,
];

/** @param {string} path */
function ensureDir(path) {
  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true });
  }
}

/** @param {string} fromFile
 * @param {string} targetFile
 */
function toImportPath(fromFile, targetFile) {
  const importPath = relative(dirname(fromFile), targetFile).replaceAll(
    "\\",
    "/"
  );
  return importPath.startsWith(".") ? importPath : `./${importPath}`;
}

/** @param {string} filePath
 * @param {string} content
 */
function writeFile(filePath, content) {
  ensureDir(dirname(filePath));
  writeFileSync(filePath, content);
}

/** @param {string} srcPath */
function createBulkFileRecords(srcPath) {
  const records = [];

  for (let domain = 1; domain <= DOMAIN_COUNT; domain++) {
    for (let layer = 1; layer <= LAYER_COUNT; layer++) {
      for (let feature = 1; feature <= FEATURE_COUNT; feature++) {
        for (let file = 1; file <= FILES_PER_FEATURE; file++) {
          records.push({
            domain: `domain-${String(domain).padStart(2, "0")}`,
            layer: `layer-${String(layer).padStart(2, "0")}`,
            feature: `feature-${String(feature).padStart(2, "0")}`,
            fileName: `file-${String(file).padStart(2, "0")}.js`,
            absolutePath: join(
              srcPath,
              "domains",
              `domain-${String(domain).padStart(2, "0")}`,
              "layers",
              `layer-${String(layer).padStart(2, "0")}`,
              "features",
              `feature-${String(feature).padStart(2, "0")}`,
              `file-${String(file).padStart(2, "0")}.js`
            ),
          });
        }
      }
    }
  }

  return records;
}

/** @param {string} srcPath */
function createBulkFiles(srcPath) {
  const records = createBulkFileRecords(srcPath);

  /** @param {number} index
   * @param {number} offsetIndex
   */
  function getTargetIndex(index, offsetIndex) {
    const seed = OFFSET_SEEDS[(index + offsetIndex) % OFFSET_SEEDS.length];
    const extraShift = (offsetIndex + 1) * 37;
    return (index + seed + extraShift) % records.length;
  }

  records.forEach((record, index) => {
    const localImports = Array.from({ length: LOCAL_IMPORTS_PER_FILE }).map(
      (_, offsetIndex) => {
        const target = records[getTargetIndex(index, offsetIndex)];
        const importPath = toImportPath(
          record.absolutePath,
          target.absolutePath
        );
        return `import { marker as localMarker${offsetIndex + 1} } from "${importPath}";`;
      }
    );

    const content = [
      ...localImports,
      'import { join as joinPath } from "node:path";',
      'import { readFileSync } from "node:fs";',
      'import chalk from "chalk";',
      'import { ESLint } from "eslint";',
      "",
      `export const marker = "${record.domain}:${record.layer}:${record.feature}:${record.fileName}";`,
      "",
      "export function runMarker() {",
      "  return [",
      "    localMarker1,",
      "    localMarker2,",
      "    localMarker3,",
      "    localMarker4,",
      "    localMarker5,",
      "    localMarker6,",
      "    localMarker7,",
      "    localMarker8,",
      "    localMarker9,",
      "    localMarker10,",
      "    localMarker11,",
      "    localMarker12,",
      "    joinPath(marker, String(Boolean(readFileSync))),",
      "    String(Boolean(chalk)),",
      "    String(Boolean(ESLint)),",
      '  ].join(":");',
      "}",
    ].join("\n");

    writeFile(record.absolutePath, `${content}\n`);
  });

  return records.length;
}

/** @param {string} srcPath */
function createSupportFiles(srcPath) {
  writeFile(
    join(srcPath, "libraries", "shared", "index.js"),
    [
      'export const sharedEntry = "shared-entry";',
      "export function sharedPublicApi() {",
      "  return sharedEntry;",
      "}",
      "",
    ].join("\n")
  );

  writeFile(
    join(srcPath, "libraries", "shared", "private", "secret.js"),
    ['export const privateSecret = "private-secret";', ""].join("\n")
  );

  writeFile(
    join(srcPath, "libraries", "shared", "private", "deep", "internal.js"),
    ['export const privateInternal = "private-internal";', ""].join("\n")
  );

  writeFile(
    join(srcPath, "libraries", "legacy", "index.js"),
    ['export const legacyEntry = "legacy-entry";', ""].join("\n")
  );

  writeFile(
    join(srcPath, "apps", "main", "index.js"),
    [
      'import { sharedPublicApi } from "../../libraries/shared/index.js";',
      "export const appMain = sharedPublicApi();",
      "",
    ].join("\n")
  );

  writeFile(
    join(srcPath, "apps", "admin", "index.js"),
    [
      'import { legacyEntry } from "../../libraries/legacy/index.js";',
      "export const appAdmin = legacyEntry;",
      "",
    ].join("\n")
  );

  writeFile(
    join(srcPath, "ignored", "ignored-a.js"),
    ['export const ignoredA = "ignored-a";', ""].join("\n")
  );

  writeFile(
    join(srcPath, "ignored", "ignored-b.js"),
    ['export const ignoredB = "ignored-b";', ""].join("\n")
  );

  for (let index = 1; index <= UNKNOWN_FILES_COUNT; index++) {
    const unknownName = `unknown-${String(index).padStart(2, "0")}`;
    writeFile(
      join(srcPath, "unmapped", `${unknownName}.js`),
      [
        `export const ${unknownName.replaceAll("-", "")} = "${unknownName}";`,
        "",
      ].join("\n")
    );
  }

  writeFile(
    join(srcPath, "scenarios", "boundaries", "case-01.js"),
    [
      'import { marker } from "../../domains/domain-10/layers/layer-05/features/feature-04/file-05.js";',
      'import { sharedEntry } from "../../libraries/shared/index.js";',
      'import { legacyEntry } from "../../libraries/legacy/index.js";',
      'export const boundariesCase01 = [marker, sharedEntry, legacyEntry].join(":");',
      "",
    ].join("\n")
  );

  writeFile(
    join(srcPath, "scenarios", "boundaries", "case-02.js"),
    [
      'import { marker } from "../../domains/domain-01/layers/layer-01/features/feature-01/file-01.js";',
      'import { sharedEntry } from "../../libraries/shared/index.js";',
      'export const boundariesCase02 = [marker, sharedEntry].join(":");',
      "",
    ].join("\n")
  );

  writeFile(
    join(srcPath, "scenarios", "external", "case-01.js"),
    [
      'import chalk from "chalk";',
      'import { ESLint } from "eslint";',
      'import { readFileSync } from "node:fs";',
      'import { join } from "node:path";',
      "export const externalCase01 = [",
      "  String(Boolean(chalk)),",
      "  String(Boolean(ESLint)),",
      "  String(Boolean(readFileSync)),",
      "  String(Boolean(join)),",
      '].join(":");',
      "",
    ].join("\n")
  );

  writeFile(
    join(srcPath, "scenarios", "external", "case-02.js"),
    [
      'import chalk from "chalk";',
      'import { ESLint } from "eslint";',
      "export const externalCase02 = String(Boolean(chalk && ESLint));",
      "",
    ].join("\n")
  );

  writeFile(
    join(srcPath, "scenarios", "entry", "case-01.js"),
    [
      'import { privateSecret } from "../../libraries/shared/private/secret.js";',
      'import { privateInternal } from "../../libraries/shared/private/deep/internal.js";',
      'export const entryCase01 = [privateSecret, privateInternal].join(":");',
      "",
    ].join("\n")
  );

  writeFile(
    join(srcPath, "scenarios", "private", "case-01.js"),
    [
      'import { privateSecret } from "../../libraries/shared/private/secret.js";',
      'import { privateInternal } from "../../libraries/shared/private/deep/internal.js";',
      'export const privateCase01 = [privateSecret, privateInternal].join(":");',
      "",
    ].join("\n")
  );

  writeFile(
    join(srcPath, "scenarios", "unknown", "case-01.js"),
    [
      'import { unknown01 } from "../../unmapped/unknown-01.js";',
      'import { unknown02 } from "../../unmapped/unknown-02.js";',
      'export const unknownCase01 = [unknown01, unknown02].join(":");',
      "",
    ].join("\n")
  );

  writeFile(
    join(srcPath, "scenarios", "ignored", "case-01.js"),
    [
      'import { ignoredA } from "../../ignored/ignored-a.js";',
      'import { ignoredB } from "../../ignored/ignored-b.js";',
      'export const ignoredCase01 = [ignoredA, ignoredB].join(":");',
      "",
    ].join("\n")
  );
}

/** @param {string} folderPath */
function countJsFiles(folderPath) {
  if (!existsSync(folderPath)) {
    return 0;
  }

  const stack = [folderPath];
  let count = 0;

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) {
      continue;
    }

    readdirSync(current).forEach((entry) => {
      const absoluteEntry = join(current, entry);
      const stats = statSync(absoluteEntry);
      if (stats.isDirectory()) {
        stack.push(absoluteEntry);
      } else if (absoluteEntry.endsWith(".js")) {
        count++;
      }
    });
  }

  return count;
}

/** @param {string} fixturesPath */
export function ensurePerformanceFixture(fixturesPath) {
  const fixturePath = join(fixturesPath, "performance");
  if (performanceTestsAreDisabled()) {
    console.warn(
      `Skipping fixture generation due to disabled performance tests.`
    );
    return {
      fixturePath: fixturePath,
      generated: false,
      jsFilesCount: 0,
      bulkFilesCount: 0,
    };
  }

  const srcPath = join(fixturePath, "src");
  const startTime = performance.now();

  console.warn(
    `[performance-fixture] Starting deterministic fixture generation at ${fixturePath}`
  );

  if (existsSync(fixturePath)) {
    rmSync(fixturePath, { recursive: true, force: true });
  }

  ensureDir(srcPath);
  const bulkFilesCount = createBulkFiles(srcPath);
  createSupportFiles(srcPath);
  const jsFilesCount = countJsFiles(srcPath);
  const durationMs = performance.now() - startTime;

  console.warn(
    `[performance-fixture] Generation completed: ${jsFilesCount} JS files created (${bulkFilesCount} bulk files) in ${durationMs.toFixed(2)} ms`
  );

  return {
    fixturePath,
    generated: true,
    jsFilesCount,
    bulkFilesCount,
  };
}
