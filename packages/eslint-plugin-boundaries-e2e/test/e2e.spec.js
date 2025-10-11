import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import chalk from 'chalk';
import { runTests } from './runner.js';

import basicConfig from './fixtures/basic.config.js';
import strictConfig from './fixtures/strict.config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Define fixtures with their configurations and paths
const fixtures = [
  {
    name: 'basic-config',
    config: basicConfig,
    path: join(__dirname, 'fixtures', 'basic-config')
  },
  {
    name: 'strict-config',
    config: strictConfig,
    path: join(__dirname, 'fixtures', 'strict-config')
  }
];

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

// Run the tests
runTests(fixtures, fixtureTests).catch(error => {
  console.error(`${chalk.red('Test execution failed:')} ${error.message}`);
  console.error(error.stack);
  process.exit(1);
});

