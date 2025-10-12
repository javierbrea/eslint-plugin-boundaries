#!/usr/bin/env node

/**
 * Lint a single file using the nearest ESLint Flat Config.
 * Compatible with monorepos where each package may have its own config.
 *
 * Supports both eslint.config.js and eslint.config.mjs.
 * Works with .js, .mjs, .cjs, .ts, .tsx, .json, .md, etc.
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const file = process.argv[2];

if (!file) {
  console.error("❌ No file provided to lint-file.js");
  process.exit(1);
}

// Find the nearest ESLint config (either .js or .mjs)
let dir = path.resolve(path.dirname(file));
const root = path.parse(dir).root;
let configPath = null;
let isEsmConfig = false;

while (dir !== root) {
  const jsConfig = path.join(dir, "eslint.config.js");
  const mjsConfig = path.join(dir, "eslint.config.mjs");

  if (fs.existsSync(mjsConfig)) {
    configPath = mjsConfig;
    isEsmConfig = true;
    break;
  }

  if (fs.existsSync(jsConfig)) {
    configPath = jsConfig;
    break;
  }

  dir = path.dirname(dir);
}

// Fall back to the root config if none found
if (!configPath) {
  const fallbackJs = path.resolve("eslint.config.js");
  const fallbackMjs = path.resolve("eslint.config.mjs");

  if (fs.existsSync(fallbackMjs)) {
    configPath = fallbackMjs;
    isEsmConfig = true;
  } else if (fs.existsSync(fallbackJs)) {
    configPath = fallbackJs;
  } else {
    console.error("❌ No ESLint config found in any parent directory");
    process.exit(1);
  }
}

// Detect if file or config are ESM
const isMjsFile = file.endsWith(".mjs");
const shouldUseEsm = isEsmConfig || isMjsFile;

const nodeCmd = shouldUseEsm ? "node --input-type=module" : "node";

console.log(`🔍 Linting ${file} using config: ${configPath}`);

try {
  execSync(`./node_modules/.bin/eslint --config "${configPath}" "${file}"`, {
    stdio: "inherit",
    shell: true,
  });
} catch (err) {
  process.exitCode = err.status || 1;
}
