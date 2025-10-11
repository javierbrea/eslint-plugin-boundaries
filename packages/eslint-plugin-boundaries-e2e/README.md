# ESLint Plugin Boundaries E2E Tests

This package contains end-to-end (E2E) tests for the `eslint-plugin-boundaries` plugin. The tests run ESLint programmatically with different configurations to ensure that the plugin works correctly in different scenarios.

## Structure

```
test/
├── e2e.spec.js          # Main test runner
└── fixtures/            # Test configurations
    ├── basic-config/     # Basic element-types test
    │   ├── eslint.config.js
    │   └── src/
    └── strict-config/    # Stricter test
        ├── eslint.config.js
        └── src/
```

## How it works

1. **Test Runner**: `e2e.spec.js` contains a simple testing system without external dependencies
2. **Fixtures**: Each folder in `test/fixtures/` represents an independent test case
3. **Configurations**: Each fixture has its own `eslint.config.js` and test files
4. **Assertions**: The runner executes ESLint and verifies expected results

## Run tests

```bash
# Run all E2E tests
npm test

# Run with debug
npm run test:debug
```

## Adding new tests

To add a new test case:

1. Create a new folder in `test/fixtures/`
2. Add an `eslint.config.js` with specific configuration
3. Create test files in a `src/` folder
4. Register specific test assertions using the callback system

### Fixture example

```
test/fixtures/my-new-test/
├── eslint.config.js     # ESLint configuration
└── src/
    ├── valid.js         # File that should pass
    └── invalid.js       # File that should fail
```

### Adding fixture-specific tests

Add your test function to the `fixtureTests` object in `e2e.spec.js`:

```javascript
const fixtureTests = {
  'my-new-test': async (runner, result) => {
    await runner.assert(`my-new-test should have specific behavior`, async () => {
      // Your test logic here
      return result.errorCount === expectedErrors;
    });
  }
};
```

### Test callback parameters

Each fixture test callback receives:
- `runner`: TestRunner instance with `assert` method
- `result`: ESLint execution result containing:
  - `success`: Boolean indicating if ESLint ran successfully
  - `errorCount`: Total number of errors
  - `warningCount`: Total number of warnings
  - `files`: Array of file results with messages and counts

## System features

- **No external frameworks**: Uses only Node.js and ESLint
- **Programmatic execution**: Runs ESLint as an IDE or CI would
- **Simple assertions**: Basic but effective assertion system
- **Colored output**: Easy to read results
- **Automatic detection**: Automatically finds all fixtures
- **Detailed information**: Shows specific errors and statistics

## Types of tests you can do

- Verify that certain imports generate errors
- Check that valid imports don't generate errors
- Test different plugin configurations
- Try different element types and rules
- Verify behavior with different project structures

## Debugging

If a test fails, the runner will show:
- Which assertion failed
- Specific ESLint errors found
- Files processed and statistics
- Detailed error messages

This allows you to quickly identify problems in the plugin or test configuration.