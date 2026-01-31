import { dirname, join } from "path";
import { fileURLToPath } from "url";

import chalk from "chalk";

import createdConfigWithDefine from "./configs/createAndDefineConfig.config.js";
import createdConfig from "./configs/createConfig.config.js";
import monorepoConfig from "./configs/monorepo.config.js";
import recommendedConfig from "./configs/recommended.config.js";
import strictConfig from "./configs/strict.config.js";
import createRenamedConfig from "./configs-ts/createRenamedConfig.config.js";
import recommendedConfigTs from "./configs-ts/recommended.config.js";
import renamedConfigTs from "./configs-ts/renamed.config.js";
import { runTests } from "./runner.js";

const ___filename = fileURLToPath(import.meta.url);
const ___dirname = dirname(___filename);

/**
 * Find the results of a file given a portion of the file name
 * @param {string} fileNameFragment - Fragment of the file name
 * @param {import('./runner.js').ESLintResult} result - ESLint result object containing file results
 * @returns {import('./runner.js').ESLintFileResult | undefined} The file result if found, undefined otherwise
 */
function findFileResult(fileNameFragment, result) {
  return result.files?.find((file) => file.filePath.includes(fileNameFragment));
}

// Define tests with their configurations, fixtures and assertions
/** @type {Array<import('./runner.js').TestDefinition>} */
const tests = [
  {
    name: "recommended-config",
    config: recommendedConfig,
    fixture: join(___dirname, "fixtures", "basic"),
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
                  msg.message.includes(
                    "No rule allowing this dependency was found"
                  )
              )
          );
        }
      );
    },
  },
  {
    name: "created-config",
    config: createdConfig,
    fixture: join(___dirname, "fixtures", "basic"),
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
                  msg.message.includes(
                    "No rule allowing this dependency was found"
                  )
              )
          );
        }
      );
    },
  },
  {
    name: "created-config-with-define",
    config: createdConfigWithDefine,
    fixture: join(___dirname, "fixtures", "basic"),
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
                  msg.message.includes(
                    "No rule allowing this dependency was found"
                  )
              )
          );
        }
      );
    },
  },
  {
    name: "recommended-config-ts",
    config: recommendedConfigTs,
    fixture: join(___dirname, "fixtures", "basic"),
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
                  msg.message.includes(
                    "No rule allowing this dependency was found"
                  )
              )
          );
        }
      );
    },
  },
  {
    name: "renamed-config-ts",
    config: renamedConfigTs,
    fixture: join(___dirname, "fixtures", "basic"),
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
                  msg.message.includes(
                    "No rule allowing this dependency was found"
                  )
              )
          );
        }
      );
    },
  },
  {
    name: "created-renamed-config-ts",
    config: createRenamedConfig,
    fixture: join(___dirname, "fixtures", "basic"),
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
                  msg.message.includes(
                    "No rule allowing this dependency was found"
                  )
              )
          );
        }
      );
    },
  },
  {
    name: "strict-config",
    config: strictConfig,
    fixture: join(___dirname, "fixtures", "basic"),
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
                  "Importing unknown elements is not allowed"
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
                msg.message.includes("File is not of any known element type")
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
                msg.message.includes("Importing ignored files is not allowed")
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
                  msg.message.includes(
                    "No rule allowing this dependency was found"
                  )
              )
          );
        }
      );
    },
  },
  {
    name: "monorepo-external-config",
    config: [
      {
        ...monorepoConfig[0],
        settings: {
          ...monorepoConfig[0].settings,
          "boundaries/root-path": join(
            ___dirname,
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
    fixture: join(___dirname, "fixtures", "monorepo"),
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
                msg.message.includes("type 'component' with name 'component-a'")
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
                msg.message.includes("type 'helper' with name 'helper-a'")
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
                msg.message.includes("type 'helper' with name 'helper-a'")
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
            ___dirname,
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
    fixture: join(___dirname, "fixtures", "monorepo"),
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
