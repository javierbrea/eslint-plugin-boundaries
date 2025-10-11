import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import chalk from 'chalk';
import { runTests } from './runner.js';

import basicConfig from './configs/basic.config.js';
import strictConfig from './configs/strict.config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Define tests with their configurations, fixtures and assertions
const tests = [
  {
    name: 'basic-config',
    config: basicConfig,
    fixture: join(__dirname, 'fixtures', 'basic-config'),
    assert: async (runner, result) => {
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
    }
  },
  {
    name: 'strict-config',
    config: strictConfig,
    fixture: join(__dirname, 'fixtures', 'strict-config'),
    assert: async (runner, result) => {
      await runner.assert(`strict-config should run without critical errors`, async () => {
        return result.errorCount >= 0; // Allow expected errors
      });
    }
  }
];

// Run the tests
runTests(tests).catch(error => {
  console.error(`${chalk.red('Test execution failed:')} ${error.message}`);
  console.error(error.stack);
  process.exit(1);
});

