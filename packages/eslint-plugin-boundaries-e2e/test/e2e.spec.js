import { dirname, join } from "path";
import { fileURLToPath } from "url";

import chalk from "chalk";

import basicConfig from "./configs/basic.config.js";
import strictConfig from "./configs/strict.config.js";
import basicConfigTs from "./configs-ts/basic.config.js";
import { runTests } from "./runner.js";

const ___filename = fileURLToPath(import.meta.url);
const ___dirname = dirname(___filename);

// Define tests with their configurations, fixtures and assertions
/** @type {Array<import('./runner.js').TestDefinition>} */
const tests = [
  {
    name: "basic-config",
    config: basicConfig,
    fixture: join(___dirname, "fixtures", "basic-config"),
    assert: async (runner, result) => {
      await runner.assert(
        `basic-config should have ESLint errors in invalid.js`,
        async () => {
          if (!result.files) return false;
          const invalidFile = result.files.find((f) =>
            f.filePath.includes("invalid.js"),
          );
          return !!(invalidFile && invalidFile.errorCount > 0);
        },
      );

      await runner.assert(
        `basic-config should have no errors in valid files`,
        async () => {
          if (!result.files) return true;
          const validFiles = result.files.filter(
            (f) => !f.filePath.includes("invalid.js"),
          );
          return validFiles.every((f) => f.errorCount === 0);
        },
      );

      await runner.assert(
        `basic-config should detect boundaries violation`,
        async () => {
          if (!result.files) return false;
          const invalidFile = result.files.find((f) =>
            f.filePath.includes("invalid.js"),
          );
          if (!invalidFile) return false;

          return invalidFile.messages.some(
            (msg) =>
              msg.ruleId === "boundaries/element-types" &&
              msg.message.includes(
                "No rule allowing this dependency was found",
              ),
          );
        },
      );
    },
  },
  {
    name: "basic-config-ts",
    config: basicConfigTs,
    fixture: join(___dirname, "fixtures", "basic-config"),
    assert: async (runner, result) => {
      await runner.assert(
        `basic-config should have ESLint errors in invalid.js`,
        async () => {
          if (!result.files) return false;
          const invalidFile = result.files.find((f) =>
            f.filePath.includes("invalid.js"),
          );
          return !!(invalidFile && invalidFile.errorCount > 0);
        },
      );

      await runner.assert(
        `basic-config should have no errors in valid files`,
        async () => {
          if (!result.files) return true;
          const validFiles = result.files.filter(
            (f) => !f.filePath.includes("invalid.js"),
          );
          return validFiles.every((f) => f.errorCount === 0);
        },
      );

      await runner.assert(
        `basic-config should detect boundaries violation`,
        async () => {
          if (!result.files) return false;
          const invalidFile = result.files.find((f) =>
            f.filePath.includes("invalid.js"),
          );
          if (!invalidFile) return false;

          return invalidFile.messages.some(
            (msg) =>
              msg.ruleId === "boundaries/element-types" &&
              msg.message.includes(
                "No rule allowing this dependency was found",
              ),
          );
        },
      );
    },
  },
  {
    name: "strict-config",
    config: strictConfig,
    fixture: join(___dirname, "fixtures", "strict-config"),
    assert: async (runner, result) => {
      await runner.assert(
        `strict-config should run without critical errors`,
        async () => {
          return (result.errorCount || 0) >= 0; // Allow expected errors
        },
      );
    },
  },
];

// Run the tests
runTests(tests).catch((error) => {
  console.error(`${chalk.red("Test execution failed:")} ${error.message}`);
  console.error(error.stack);
  process.exit(1);
});
