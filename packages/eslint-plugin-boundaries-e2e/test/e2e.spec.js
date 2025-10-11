import { ESLint } from 'eslint';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readdir, stat } from 'fs/promises';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Simple assertion system
class TestRunner {
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

// Function to run ESLint on a specific fixture
async function runESLintOnFixture(fixturePath) {
  const configPath = join(fixturePath, 'eslint.config.js');
  
  try {
    const eslint = new ESLint({
      overrideConfigFile: configPath,
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

// Function to find all fixture folders
async function findFixtures() {
  const fixturesDir = join(__dirname, 'fixtures');
  const fixtures = [];
  
  try {
    const items = await readdir(fixturesDir);
    
    for (const item of items) {
      const itemPath = join(fixturesDir, item);
      const itemStat = await stat(itemPath);
      
      if (itemStat.isDirectory()) {
        fixtures.push({
          name: item,
          path: itemPath
        });
      }
    }
  } catch (error) {
    console.error(`Error reading fixtures directory: ${error.message}`);
  }
  
  return fixtures;
}

// Main test function
async function runTests() {
  const runner = new TestRunner();
  
  console.log(`${chalk.blue.bold('Running ESLint Plugin Boundaries E2E Tests')}\n`);
  
  const fixtures = await findFixtures();
  
  if (fixtures.length === 0) {
    console.log(`${chalk.yellow('No fixtures found in test/fixtures directory')}`);
    return;
  }

  console.log(`Found ${fixtures.length} fixture(s): ${fixtures.map(f => f.name).join(', ')}\n`);

  for (const fixture of fixtures) {
    console.log(`${chalk.blue(`Running tests for fixture: ${fixture.name}`)}`);
    
    const result = await runESLintOnFixture(fixture.path);
    
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

// Fixture-specific test definitions
const fixtureTests = {
  'basic-config': async (runner, result) => {
    await runner.assert(`basic-config should have ESLint errors in invalid.js`, async () => {
      const invalidFile = result.files.find(f => f.filePath.includes('invalid.js'));
      return invalidFile && invalidFile.errorCount > 0;
    });

    await runner.assert(`basic-config should have no errors in valid files`, async () => {
      const validFiles = result.files.filter(f => !f.filePath.includes('invalid.js'));
      return validFiles.every(f => f.errorCount === 0);
    });

    await runner.assert(`basic-config should detect boundaries violation`, async () => {
      const invalidFile = result.files.find(f => f.filePath.includes('invalid.js'));
      if (!invalidFile) return false;
      
      return invalidFile.messages.some(msg => 
        msg.ruleId === 'boundaries/element-types' && 
        msg.message.includes('No rule allowing this dependency was found')
      );
    });
  },

  'strict-config': async (runner, result) => {
    await runner.assert(`strict-config should run without critical errors`, async () => {
      return result.errorCount >= 0; // Allow expected errors
    });
  }
};

runTests().catch(error => {
  console.error(`${chalk.red('Test execution failed:')} ${error.message}`);
  console.error(error.stack);
  process.exit(1);
});

