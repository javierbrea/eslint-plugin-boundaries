import { dirname, join } from "path";
import { fileURLToPath } from "url";

import chalk from "chalk";

import createdConfigWithDefine from "./configs/createAndDefineConfig.config.js";
import createdConfig from "./configs/createConfig.config.js";
import monorepoConfig from "./configs/monorepo.config.js";
import performanceLegacyConfig from "./configs/performance-legacy.config.js";
import performanceConfig from "./configs/performance.config.js";
import recommendedConfig from "./configs/recommended.config.js";
import strictConfig from "./configs/strict.config.js";
import createRenamedConfig from "./configs-ts/createRenamedConfig.config.js";
import recommendedConfigTs from "./configs-ts/recommended.config.js";
import renamedConfigTs from "./configs-ts/renamed.config.js";
import { ensurePerformanceFixture } from "./helpers/generatePerformanceFixture.js";
import { runTests } from "./runner.js";

const currentFile = fileURLToPath(import.meta.url);
const currentDir = dirname(currentFile);

const PERFORMANCE_MAX_INCREASE_PERCENT = 20;
const PERFORMANCE_MIN_DURATION_MS = 30000;
const PERFORMANCE_ERRORS = 44;
const PERFORMANCE_FILES = 5026;

const PERFORMANCE_LEGACY_BASELINE_MS = 55000;
const PERFORMANCE_LEGACY_MAX_DURATION_MS =
  PERFORMANCE_LEGACY_BASELINE_MS * (1 + PERFORMANCE_MAX_INCREASE_PERCENT / 100);

const PERFORMANCE_BASELINE_MS = 60000;
const PERFORMANCE_MAX_DURATION_MS =
  PERFORMANCE_BASELINE_MS * (1 + PERFORMANCE_MAX_INCREASE_PERCENT / 100);

const performanceFixture = ensurePerformanceFixture(
  join(currentDir, "fixtures")
);

/**
 * Find the results of a file given a portion of the file name
 * @param {string} fileNameFragment - Fragment of the file name
 * @param {import('./runner.js').ESLintResult} result - ESLint result object containing file results
 * @returns {import('./runner.js').ESLintFileResult | undefined} The file result if found, undefined otherwise
 */
function findFileResult(fileNameFragment, result) {
  return result.files?.find((file) => file.filePath.includes(fileNameFragment));
}

/**
 * Returns performance test definition with assertions for performance metrics and error detection
 * @param {string} name - Name of the performance test
 * @param {Object} config - ESLint configuration to be tested
 * @param {number} maxDurationMs - Optional maximum duration for the test in milliseconds
 * @returns {import('./runner.js').TestDefinition} The performance test definition
 */
function getPerformanceTest(name, config, maxDurationMs) {
  return {
    name,
    config,
    isPerformanceTest: true,
    fixture: performanceFixture.fixturePath,
    runOnFiles: ["src/**/*.js"],
    assert: async (runner, result) => {
      const allMessages = (result.files || []).flatMap((file) => file.messages);

      await runner.assert(
        `performance fixture should have ${PERFORMANCE_FILES} js files`,
        async () => {
          return performanceFixture.jsFilesCount >= PERFORMANCE_FILES;
        }
      );

      await runner.assert(
        `performance config should detect ${PERFORMANCE_ERRORS} errors`,
        async () => {
          return result.errorCount === PERFORMANCE_ERRORS;
        }
      );

      await runner.assert(
        `performance config should include at least one cross-domain dependencies error`,
        async () => {
          return allMessages.some(
            (msg) =>
              msg.ruleId === "boundaries/dependencies" &&
              msg.message.includes("cross-domain import blocked")
          );
        }
      );

      await runner.assert(
        `performance config should include at least one scenario dependencies error`,
        async () => {
          return allMessages.some(
            (msg) =>
              msg.ruleId === "boundaries/dependencies" &&
              msg.message.includes(
                "scenario boundaries cannot import architecture elements"
              )
          );
        }
      );

      await runner.assert(
        `performance config should include at least one external rule error`,
        async () => {
          return allMessages.some((msg) =>
            msg.message.includes(
              "scenario external cannot import blocked module"
            )
          );
        }
      );

      await runner.assert(
        `performance config should include at least one external rule error`,
        async () => {
          return allMessages.some((msg) =>
            msg.message.includes(
              "shared library must be consumed through index.js"
            )
          );
        }
      );

      await runner.assert(
        `performance config should include at least one no-unknown rule error`,
        async () => {
          return allMessages.some(
            (msg) => msg.ruleId === "boundaries/no-unknown"
          );
        }
      );

      await runner.assert(
        `performance config should include at least one no-unknown-files rule error`,
        async () => {
          return allMessages.some(
            (msg) => msg.ruleId === "boundaries/no-unknown-files"
          );
        }
      );

      await runner.assert(
        `performance config should take at least ${PERFORMANCE_MIN_DURATION_MS}ms`,
        async () => {
          return (result.durationMs || 0) >= PERFORMANCE_MIN_DURATION_MS;
        }
      );

      await runner.assert(
        `performance config should not exceed ${maxDurationMs}ms (+${PERFORMANCE_MAX_INCREASE_PERCENT}% baseline)`,
        async () => {
          return (result.durationMs || 0) <= maxDurationMs;
        }
      );
    },
  };
}

// Define tests with their configurations, fixtures and assertions
/** @type {Array<import('./runner.js').TestDefinition>} */
const tests = [
  {
    name: "recommended-config",
    config: recommendedConfig,
    fixture: join(currentDir, "fixtures", "basic"),
    assert: async (runner, result) => {
      await runner.assert(
        `recommended config should detect 1 error`,
        async () => {
          return result.errorCount === 1;
        }
      );

      await runner.assert(
        `recommended config should have no errors when importing unknown elements`,
        async () => {
          const fileResult = findFileResult("ignored-import", result);
          return fileResult?.errorCount === 0;
        }
      );

      await runner.assert(
        `recommended config should have no errors when importing ignored elements`,
        async () => {
          const fileResult = findFileResult("unknown-import", result);
          return fileResult?.errorCount === 0;
        }
      );

      await runner.assert(
        `recommended config should detect boundaries violation`,
        async () => {
          const boundariesErrorFile = findFileResult("boundary-import", result);

          return Boolean(
            boundariesErrorFile?.errorCount &&
              boundariesErrorFile?.errorCount > 0 &&
              boundariesErrorFile?.messages.some(
                (msg) =>
                  msg.ruleId === "boundaries/element-types" &&
                  msg.message.includes("There is no rule allowing dependencies")
              )
          );
        }
      );
    },
  },
  {
    name: "created-config",
    config: createdConfig,
    fixture: join(currentDir, "fixtures", "basic"),
    assert: async (runner, result) => {
      await runner.assert(`created config should detect 1 error`, async () => {
        return result.errorCount === 1;
      });

      await runner.assert(
        `created config should have no errors when importing unknown elements`,
        async () => {
          const fileResult = findFileResult("ignored-import", result);
          return fileResult?.errorCount === 0;
        }
      );

      await runner.assert(
        `created config should have no errors when importing ignored elements`,
        async () => {
          const fileResult = findFileResult("unknown-import", result);
          return fileResult?.errorCount === 0;
        }
      );

      await runner.assert(
        `created config should detect boundaries violation`,
        async () => {
          const boundariesErrorFile = findFileResult("boundary-import", result);

          return Boolean(
            boundariesErrorFile?.errorCount &&
              boundariesErrorFile?.errorCount > 0 &&
              boundariesErrorFile?.messages.some(
                (msg) =>
                  msg.ruleId === "boundaries/element-types" &&
                  msg.message.includes("There is no rule allowing dependencies")
              )
          );
        }
      );
    },
  },
  {
    name: "created-config-with-define",
    config: createdConfigWithDefine,
    fixture: join(currentDir, "fixtures", "basic"),
    assert: async (runner, result) => {
      await runner.assert(
        `created config with define should detect 1 error`,
        async () => {
          return result.errorCount === 1;
        }
      );

      await runner.assert(
        `created config with define should have no errors when importing unknown elements`,
        async () => {
          const fileResult = findFileResult("ignored-import", result);
          return fileResult?.errorCount === 0;
        }
      );

      await runner.assert(
        `created config with define should have no errors when importing ignored elements`,
        async () => {
          const fileResult = findFileResult("unknown-import", result);
          return fileResult?.errorCount === 0;
        }
      );

      await runner.assert(
        `created config with define should detect boundaries violation`,
        async () => {
          const boundariesErrorFile = findFileResult("boundary-import", result);

          return Boolean(
            boundariesErrorFile?.errorCount &&
              boundariesErrorFile?.errorCount > 0 &&
              boundariesErrorFile?.messages.some(
                (msg) =>
                  msg.ruleId === "boundaries/element-types" &&
                  msg.message.includes("There is no rule allowing dependencies")
              )
          );
        }
      );
    },
  },
  {
    name: "recommended-config-ts",
    config: recommendedConfigTs,
    fixture: join(currentDir, "fixtures", "basic"),
    assert: async (runner, result) => {
      await runner.assert(
        `recommended config in Ts should detect 1 error`,
        async () => {
          return result.errorCount === 1;
        }
      );

      await runner.assert(
        `recommended config in Ts should have no errors when importing unknown elements`,
        async () => {
          const fileResult = findFileResult("ignored-import", result);
          return fileResult?.errorCount === 0;
        }
      );

      await runner.assert(
        `recommended config in Ts should have no errors when importing ignored elements`,
        async () => {
          const fileResult = findFileResult("unknown-import", result);
          return fileResult?.errorCount === 0;
        }
      );

      await runner.assert(
        `recommended config in Ts should detect boundaries violation`,
        async () => {
          const boundariesErrorFile = findFileResult("boundary-import", result);

          return Boolean(
            boundariesErrorFile?.errorCount &&
              boundariesErrorFile?.errorCount > 0 &&
              boundariesErrorFile?.messages.some(
                (msg) =>
                  msg.ruleId === "boundaries/element-types" &&
                  msg.message.includes("There is no rule allowing dependencies")
              )
          );
        }
      );
    },
  },
  {
    name: "renamed-config-ts",
    config: renamedConfigTs,
    fixture: join(currentDir, "fixtures", "basic"),
    assert: async (runner, result) => {
      await runner.assert(`renamed config should detect 1 error`, async () => {
        return result.errorCount === 1;
      });

      await runner.assert(
        `renamed config should have no errors when importing unknown elements`,
        async () => {
          const fileResult = findFileResult("ignored-import", result);
          return fileResult?.errorCount === 0;
        }
      );

      await runner.assert(
        `renamed config should have no errors when importing ignored elements`,
        async () => {
          const fileResult = findFileResult("unknown-import", result);
          return fileResult?.errorCount === 0;
        }
      );

      await runner.assert(
        `renamed config should detect boundaries violation`,
        async () => {
          const boundariesErrorFile = findFileResult("boundary-import", result);

          return Boolean(
            boundariesErrorFile?.errorCount &&
              boundariesErrorFile?.errorCount > 0 &&
              boundariesErrorFile?.messages.some(
                (msg) =>
                  msg.ruleId === "customBoundaries/element-types" &&
                  msg.message.includes("There is no rule allowing dependencies")
              )
          );
        }
      );
    },
  },
  {
    name: "created-renamed-config-ts",
    config: createRenamedConfig,
    fixture: join(currentDir, "fixtures", "basic"),
    assert: async (runner, result) => {
      await runner.assert(
        `created renamed config should detect 1 error`,
        async () => {
          return result.errorCount === 1;
        }
      );

      await runner.assert(
        `created renamed config should have no errors when importing unknown elements`,
        async () => {
          const fileResult = findFileResult("ignored-import", result);
          return fileResult?.errorCount === 0;
        }
      );

      await runner.assert(
        `created renamed config should have no errors when importing ignored elements`,
        async () => {
          const fileResult = findFileResult("unknown-import", result);
          return fileResult?.errorCount === 0;
        }
      );

      await runner.assert(
        `created renamed config should detect boundaries violation`,
        async () => {
          const boundariesErrorFile = findFileResult("boundary-import", result);

          return Boolean(
            boundariesErrorFile?.errorCount &&
              boundariesErrorFile?.errorCount > 0 &&
              boundariesErrorFile?.messages.some(
                (msg) =>
                  msg.ruleId === "customBoundaries/element-types" &&
                  msg.message.includes("There is no rule allowing dependencies")
              )
          );
        }
      );
    },
  },
  {
    name: "strict-config",
    config: strictConfig,
    fixture: join(currentDir, "fixtures", "basic"),
    assert: async (runner, result) => {
      await runner.assert(`strict config should detect 4 errors`, async () => {
        return result.errorCount === 4;
      });

      await runner.assert(
        `strict config should have errors when importing unknown elements`,
        async () => {
          const fileResult = findFileResult("unknown-import", result);
          return (
            fileResult?.errorCount === 1 &&
            fileResult?.messages.some(
              (msg) =>
                msg.ruleId === "boundaries/no-unknown" &&
                msg.message.includes(
                  "Dependencies to unknown elements are not allowed"
                )
            )
          );
        }
      );

      await runner.assert(
        `strict config should have errors in unknown elements`,
        async () => {
          const fileResult = findFileResult("unknown.js", result);
          return (
            fileResult?.errorCount === 1 &&
            fileResult?.messages.some(
              (msg) =>
                msg.ruleId === "boundaries/no-unknown-files" &&
                msg.message.includes("File does not match any element pattern")
            )
          );
        }
      );

      await runner.assert(
        `strict config should have errors when importing ignored elements`,
        async () => {
          const fileResult = findFileResult("ignored-import", result);
          return (
            fileResult?.errorCount === 1 &&
            fileResult?.messages.some(
              (msg) =>
                msg.ruleId === "boundaries/no-ignored" &&
                msg.message.includes(
                  "Dependencies to ignored files are not allowed"
                )
            )
          );
        }
      );

      await runner.assert(
        `strict config should detect boundaries violation`,
        async () => {
          const boundariesErrorFile = findFileResult("boundary-import", result);

          return Boolean(
            boundariesErrorFile?.errorCount &&
              boundariesErrorFile?.errorCount > 0 &&
              boundariesErrorFile?.messages.some(
                (msg) =>
                  msg.ruleId === "boundaries/element-types" &&
                  msg.message.includes("There is no rule allowing dependencies")
              )
          );
        }
      );
    },
  },
  getPerformanceTest(
    "performance-config",
    performanceConfig,
    PERFORMANCE_MAX_DURATION_MS
  ),
  getPerformanceTest(
    "performance-legacy-config",
    performanceLegacyConfig,
    PERFORMANCE_LEGACY_MAX_DURATION_MS
  ),
  {
    name: "monorepo-external-config",
    config: [
      {
        ...monorepoConfig[0],
        settings: {
          ...monorepoConfig[0].settings,
          "boundaries/root-path": join(
            currentDir,
            "fixtures",
            "monorepo",
            "package-a"
          ),
          "boundaries/flag-as-external": {
            outsideRootPath: true,
          },
        },
      },
    ],
    fixture: join(currentDir, "fixtures", "monorepo"),
    runOnFiles: ["**/*.js"],
    assert: async (runner, result) => {
      await runner.assert(`config should detect 3 errors`, async () => {
        return result.errorCount === 3;
      });
      await runner.assert(
        `component-a should not be able to import helper c (external)`,
        async () => {
          const fileResult = findFileResult(
            "package-a/components/component-a",
            result
          );
          return (
            fileResult?.errorCount === 1 &&
            fileResult?.messages.some(
              (msg) =>
                msg.ruleId === "boundaries/external" &&
                msg.message.includes('type "component" and name "component-a"')
            )
          );
        }
      );

      await runner.assert(
        `helper-a should not be able to import helper b (external)`,
        async () => {
          const fileResult = findFileResult(
            "package-a/helpers/helper-a",
            result
          );
          return (
            fileResult?.errorCount === 1 &&
            fileResult?.messages.some(
              (msg) =>
                msg.ruleId === "boundaries/external" &&
                msg.message.includes('type "helper" and name "helper-a"')
            )
          );
        }
      );

      await runner.assert(
        `helper-a (external) should not be able to import helper b (external)`,
        async () => {
          const fileResult = findFileResult(
            "package-b/helpers/helper-a",
            result
          );
          return (
            fileResult?.errorCount === 1 &&
            fileResult?.messages.some(
              (msg) =>
                msg.ruleId === "boundaries/external" &&
                msg.message.includes('type "helper" and name "helper-a"')
            )
          );
        }
      );
    },
  },
  {
    name: "monorepo-config-no-external",
    config: [
      {
        ...monorepoConfig[0],
        settings: {
          ...monorepoConfig[0].settings,
          "boundaries/root-path": join(
            currentDir,
            "fixtures",
            "monorepo",
            "package-a"
          ),
          "boundaries/flag-as-external": {
            outsideRootPath: false,
          },
        },
      },
    ],
    fixture: join(currentDir, "fixtures", "monorepo"),
    runOnFiles: ["**/*.js"],
    assert: async (runner, result) => {
      await runner.assert(`config should detect no errors`, async () => {
        return result.errorCount === 0;
      });
    },
  },
];

// Run the tests
runTests(tests).catch((error) => {
  console.error(`${chalk.red("Test execution failed:")} ${error.message}`);
  console.error(error.stack);
  process.exit(1);
});
