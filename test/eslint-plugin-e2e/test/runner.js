/* eslint-disable no-console */

import chalk from "chalk";
import { ESLint } from "eslint";

// Exported types for external use
/**
 * @typedef {Object} TestResult
 * @property {string} description - Test description
 * @property {'passed' | 'failed'} status - Test status
 * @property {string} [error] - Error message if test failed
 */

/**
 * @typedef {Object} ESLintMessage
 * @property {number} line - Line number
 * @property {number} column - Column number
 * @property {string} message - Error message
 * @property {string | null} ruleId - ESLint rule ID
 * @property {number} severity - 1 for warning, 2 for error
 */

/**
 * @typedef {Object} ESLintFileResult
 * @property {string} filePath - Path to the linted file
 * @property {Array<ESLintMessage>} messages - ESLint messages for this file
 * @property {number} errorCount - Number of errors in this file
 * @property {number} warningCount - Number of warnings in this file
 */

/**
 * @typedef {Object} ESLintResult
 * @property {boolean} success - Whether ESLint ran successfully
 * @property {Array<Object>} [results] - Raw ESLint results
 * @property {number} [errorCount] - Total number of errors
 * @property {number} [warningCount] - Total number of warnings
 * @property {Array<ESLintFileResult>} [files] - Processed file results
 * @property {string} [error] - Error message if ESLint failed
 */

/**
 * @typedef {function(TestRunner, ESLintResult): Promise<void>} AssertFunction
 */

/**
 * @typedef {Object} TestDefinition
 * @property {string} name - Test name/identifier
 * @property {Object} config - ESLint configuration object
 * @property {string} fixture - Path to the fixture directory
 * @property {AssertFunction} assert - Function that runs test assertions
 */

/**
 * Simple assertion system for running tests
 */
export class TestRunner {
  /**
   * Creates a new TestRunner instance
   */
  constructor() {
    /** @type {number} */
    this.passedTests = 0;
    /** @type {number} */
    this.failedTests = 0;
    /** @type {Array<TestResult>} */
    this.tests = [];
  }

  /**
   * Runs an assertion and tracks the result
   * @param {string} description - Description of what is being tested
   * @param {function(): Promise<boolean>} assertion - Async function that returns true if test passes
   * @returns {Promise<void>}
   */
  async assert(description, assertion) {
    try {
      const result = await assertion();
      if (result) {
        this.passedTests++;
        console.log(`${chalk.green("✓")} ${description}`);
        this.tests.push({ description, status: "passed" });
      } else {
        this.failedTests++;
        console.log(`${chalk.red("✗")} ${description}`);
        this.tests.push({
          description,
          status: "failed",
          error: "Assertion failed",
        });
      }
    } catch (error) {
      this.failedTests++;
      console.log(`${chalk.red("✗")} ${description}`);
      console.log(
        `  ${chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`)}`
      );
      this.tests.push({
        description,
        status: "failed",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Prints a summary of all test results and exits if tests failed
   * @returns {void}
   */
  printSummary() {
    const total = this.passedTests + this.failedTests;
    console.log(`\n${chalk.bold("=== Test Summary ===")}`);
    console.log(`Total: ${total}`);
    console.log(`${chalk.green(`Passed: ${this.passedTests}`)}`);
    if (this.failedTests > 0) {
      console.log(`${chalk.red(`Failed: ${this.failedTests}`)}`);
    }

    if (this.failedTests === 0) {
      console.log(`\n${chalk.green.bold("All tests passed!")}`);
    } else {
      console.log(`\n${chalk.red.bold("Some tests failed!")}`);
      process.exit(1);
    }
  }
}

/**
 * Runs ESLint on a specific fixture with the provided configuration
 * @param {string} fixturePath - Absolute path to the fixture directory
 * @param {Object} eslintConfig - ESLint configuration object
 * @returns {Promise<ESLintResult>} Promise that resolves to the ESLint result
 */
async function runESLintOnFixture(fixturePath, eslintConfig) {
  try {
    const eslint = new ESLint({
      overrideConfig: eslintConfig,
      cwd: fixturePath,
    });

    // Get all .js files in the src folder
    const results = await eslint.lintFiles(["src/**/*.js"]);

    return {
      success: true,
      results,
      errorCount: results.reduce((sum, result) => sum + result.errorCount, 0),
      warningCount: results.reduce(
        (sum, result) => sum + result.warningCount,
        0
      ),
      files: results.map((result) => ({
        filePath: result.filePath,
        messages: result.messages,
        errorCount: result.errorCount,
        warningCount: result.warningCount,
      })),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Runs tests on the provided test definitions
 * @param {Array<TestDefinition>} tests - Array of test definitions
 * @returns {Promise<void>} Promise that resolves when all tests complete
 * @example
 * ```javascript
 * const tests = [
 *   {
 *     name: 'basic-test',
 *     config: { rules: { 'no-console': 'error' } },
 *     fixture: '/path/to/fixture',
 *     assert: async (runner, result) => {
 *       await runner.assert('should have errors', async () => {
 *         return result.errorCount > 0;
 *       });
 *     }
 *   }
 * ];
 *
 * await runTests(tests);
 * ```
 */
export async function runTests(tests) {
  const runner = new TestRunner();

  console.log(
    `${chalk.blue.bold("Running ESLint Plugin Boundaries E2E Tests")}\n`
  );

  if (!tests || tests.length === 0) {
    console.log(`${chalk.yellow("No tests provided")}`);
    return;
  }

  console.log(
    `Found ${tests.length} test(s): ${tests.map((t) => t.name).join(", ")}\n`
  );

  for (const test of tests) {
    console.log(`${chalk.blue(`Running tests for: ${test.name}`)}`);

    const result = await runESLintOnFixture(test.fixture, test.config);

    await runner.assert(
      `ESLint should run successfully on ${test.name}`,
      async () => {
        return result.success;
      }
    );

    if (result.success) {
      // Run test-specific assertions if available
      if (test.assert && typeof test.assert === "function") {
        await test.assert(runner, result);
      }

      // Additional information about results
      if (result.files && result.files.length > 0) {
        console.log(
          `  ${chalk.yellow(`Files processed: ${result.files.length}`)}`
        );
        console.log(
          `  ${chalk.yellow(`Total errors: ${result.errorCount || 0}`)}`
        );
        console.log(
          `  ${chalk.yellow(`Total warnings: ${result.warningCount || 0}`)}`
        );

        // Show specific errors for debugging
        result.files.forEach((file) => {
          if (file.errorCount > 0) {
            console.log(
              `    ${chalk.red(`Errors in ${file.filePath.split("/").pop()}:`)}`
            );
            file.messages.forEach((msg) => {
              if (msg.severity === 2) {
                // Error
                console.log(
                  `      Line ${msg.line}: ${msg.message} (${msg.ruleId})`
                );
              }
            });
          }
        });
      }
    } else {
      console.log(`  ${chalk.red(`ESLint execution failed: ${result.error}`)}`);
    }

    console.log(""); // Empty line between tests
  }

  runner.printSummary();
}
