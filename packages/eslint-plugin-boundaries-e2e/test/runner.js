import { ESLint } from 'eslint';
import { join } from 'path';
import chalk from 'chalk';

// Simple assertion system
export class TestRunner {
  constructor() {
    this.passedTests = 0;
    this.failedTests = 0;
    this.tests = [];
  }

  async assert(description, assertion) {
    try {
      const result = await assertion();
      if (result) {
        this.passedTests++;
        console.log(`${chalk.green('✓')} ${description}`);
        this.tests.push({ description, status: 'passed' });
      } else {
        this.failedTests++;
        console.log(`${chalk.red('✗')} ${description}`);
        this.tests.push({ description, status: 'failed', error: 'Assertion failed' });
      }
    } catch (error) {
      this.failedTests++;
      console.log(`${chalk.red('✗')} ${description}`);
      console.log(`  ${chalk.red(`Error: ${error.message}`)}`);
      this.tests.push({ description, status: 'failed', error: error.message });
    }
  }

  printSummary() {
    const total = this.passedTests + this.failedTests;
    console.log(`\n${chalk.bold('=== Test Summary ===')}`);
    console.log(`Total: ${total}`);
    console.log(`${chalk.green(`Passed: ${this.passedTests}`)}`);
    if (this.failedTests > 0) {
      console.log(`${chalk.red(`Failed: ${this.failedTests}`)}`);
    }
    
    if (this.failedTests === 0) {
      console.log(`\n${chalk.green.bold('All tests passed!')}`);
    } else {
      console.log(`\n${chalk.red.bold('Some tests failed!')}`);
      process.exit(1);
    }
  }
}

// Function to run ESLint on a specific fixture with provided config
async function runESLintOnFixture(fixturePath, eslintConfig) {
  try {
    const eslint = new ESLint({
      overrideConfig: eslintConfig,
      cwd: fixturePath
    });

    // Get all .js files in the src folder
    const results = await eslint.lintFiles(['src/**/*.js']);
    
    return {
      success: true,
      results,
      errorCount: results.reduce((sum, result) => sum + result.errorCount, 0),
      warningCount: results.reduce((sum, result) => sum + result.warningCount, 0),
      files: results.map(result => ({
        filePath: result.filePath,
        messages: result.messages,
        errorCount: result.errorCount,
        warningCount: result.warningCount
      }))
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Runs tests on the provided fixtures
 * @param {Array} fixtures - Array of fixture objects with structure: { name: string, config: object, path: string }
 * @param {Object} fixtureTests - Object with fixture-specific test functions
 */
export async function runTests(fixtures, fixtureTests = {}) {
  const runner = new TestRunner();
  
  console.log(`${chalk.blue.bold('Running ESLint Plugin Boundaries E2E Tests')}\n`);
  
  if (!fixtures || fixtures.length === 0) {
    console.log(`${chalk.yellow('No fixtures provided')}`);
    return;
  }

  console.log(`Found ${fixtures.length} fixture(s): ${fixtures.map(f => f.name).join(', ')}\n`);

  for (const fixture of fixtures) {
    console.log(`${chalk.blue(`Running tests for fixture: ${fixture.name}`)}`);
    
    const result = await runESLintOnFixture(fixture.path, fixture.config);
    
    await runner.assert(`ESLint should run successfully on ${fixture.name}`, async () => {
      return result.success;
    });

    if (result.success) {
      // Run fixture-specific tests if available
      const fixtureTestFn = fixtureTests[fixture.name];
      if (fixtureTestFn) {
        await fixtureTestFn(runner, result);
      }

      // Additional information about results
      if (result.files.length > 0) {
        console.log(`  ${chalk.yellow(`Files processed: ${result.files.length}`)}`);
        console.log(`  ${chalk.yellow(`Total errors: ${result.errorCount}`)}`);
        console.log(`  ${chalk.yellow(`Total warnings: ${result.warningCount}`)}`);
        
        // Show specific errors for debugging
        result.files.forEach(file => {
          if (file.errorCount > 0) {
            console.log(`    ${chalk.red(`Errors in ${file.filePath.split('/').pop()}:`)}`);
            file.messages.forEach(msg => {
              if (msg.severity === 2) { // Error
                console.log(`      Line ${msg.line}: ${msg.message} (${msg.ruleId})`);
              }
            });
          }
        });
      }
    } else {
      console.log(`  ${chalk.red(`ESLint execution failed: ${result.error}`)}`);
    }
    
    console.log(''); // Empty line between fixtures
  }

  runner.printSummary();
}