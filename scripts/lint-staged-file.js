#!/usr/bin/env node

/**
 * Lint all staged files individually using the nearest ESLint Flat Config.
 * Compatible with monorepos where each package may have its own config.
 *
 * Supports both eslint.config.js and eslint.config.mjs.
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const files = process.argv.slice(2);

if (files.length === 0) process.exit(0);

// Helper to find nearest ESLint config for a given file
function findConfig(file) {
  let dir = path.resolve(path.dirname(file));
  const root = path.parse(dir).root;
  while (dir !== root) {
    const jsConfig = path.join(dir, "eslint.config.js");
    const mjsConfig = path.join(dir, "eslint.config.mjs");

    if (fs.existsSync(mjsConfig)) return mjsConfig;
    if (fs.existsSync(jsConfig)) return jsConfig;

    dir = path.dirname(dir);
  }

  // fallback to root configs
  const fallbackMjs = path.resolve("eslint.config.mjs");
  const fallbackJs = path.resolve("eslint.config.js");
  if (fs.existsSync(fallbackMjs)) return fallbackMjs;
  if (fs.existsSync(fallbackJs)) return fallbackJs;

  console.error("❌ No ESLint config found for file:", file);
  process.exit(1);
}

let exitCode = 0;

for (const file of files) {
  const configPath = findConfig(file);
  const configFolder = path.dirname(configPath);
  const relativeFilePath = path.relative(configFolder, path.resolve(file));

  try {
    execSync(`pnpm eslint "${relativeFilePath}"`, {
      stdio: "inherit",
      cwd: configFolder,
      shell: true,
    });
  } catch {
    exitCode = 1; // mark failure but continue with the next file
  }
}

process.exit(exitCode);
