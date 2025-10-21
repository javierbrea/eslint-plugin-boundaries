# ESLint Plugin Boundaries E2E Tests

This package contains end-to-end (E2E) tests for the eslint-plugin-boundaries plugin. The tests run ESLint programmatically with different configurations to ensure that the plugin works correctly in different scenarios using real imports. These tests mainly focus on verifying the various paths, types, and configuration utilities of the plugin, ensuring that the public interface behaves as expected after publication. Functional behavior is fully covered by the plugin's own unit tests.

## How it works

1. **Test Definitions**: `e2e.spec.js` defines test cases with specific configurations and assertions
2. **Test Runner**: `runner.js` provides a custom test runner with assertion system and colored output
3. **Configurations**: Different ESLint configurations for tests in `configs/` and `configs-ts/` directories
4. **Fixtures**: Test scenarios in `fixtures/` directory with source files to lint
5. **Programmatic Execution**: Uses ESLint API to lint files and validate results

## Run tests

```bash
# Run all E2E tests
pnpm nx test:e2e eslint-plugin-boundaries-e2e
```

## Adding new tests

To add a new test case:

1. Add a new configuration in `test/configs/` or `test/configs-ts/` if needed.
2. Create a new folder in `test/fixtures/` with your files structure to lint if needed
3. Define your test in the `tests` array in `e2e.spec.js`

> [!WARNING]
> TypeScript configurations are transpiled to JavaScript before test execution via the `build` script. To assert type errors, use `@ts-expect-error` for the expected incorrect types. From the test runner's perspective, always import the corresponding `.js` file from `configs-ts/`, not the original `.ts` file.

### Test Definition Example

```javascript
{
  name: "my-new-test",
  config: myConfig, // Import your configuration
  fixture: join(___dirname, "fixtures", "my-new-fixture"), // Path to your fixture
  assert: async (runner, result) => {
    await runner.assert(`Description of what should happen`, async () => {
      // Your test logic here
      return result.errorCount === expectedErrors;
    });
  }
}
```

### Test Assertion Parameters

Each test assertion callback receives:
- `runner`: TestRunner instance with `assert` method for running assertions
- `result`: ESLintResult object containing:
  - `success`: Boolean indicating if ESLint ran successfully
  - `errorCount`: Total number of errors across all files
  - `warningCount`: Total number of warnings across all files
  - `files`: Array of ESLintFileResult objects with detailed results per file
  - `error`: Error message if ESLint execution failed

### ESLintFileResult Structure

Each file result contains:
- `filePath`: Absolute path to the linted file
- `messages`: Array of ESLint messages (errors/warnings)
- `errorCount`: Number of errors in this specific file
- `warningCount`: Number of warnings in this specific file

### Message Structure

Each ESLint message contains:
- `line`: Line number where the issue was found
- `column`: Column number where the issue was found
- `message`: Human-readable error/warning message
- `ruleId`: ESLint rule that triggered (e.g., "boundaries/element-types")
- `severity`: 1 for warning, 2 for error

## System Features

- **Custom Test Runner**: Built-in test runner with assertion system (no external test frameworks)
- **Programmatic ESLint**: Runs ESLint via API as an IDE or CI would
- **Colored Output**: Uses chalk for easy-to-read colored console output
- **Detailed Results**: Shows file-by-file results, error counts, and specific messages
- **TypeScript Support**: Tests both JavaScript and TypeScript configurations
- **Error Details**: Shows line numbers, rule IDs, and specific error messages for debugging

## Debugging

When a test fails, the runner provides comprehensive debugging information:

- **Assertion Results**: Clear pass/fail indicators with ✓ and ✗ symbols
- **Error Details**: Specific ESLint errors found in each file
- **File Statistics**: Number of files processed, errors, and warnings per test
- **Message Details**: Line numbers, column positions, and rule IDs for each issue
- **Test Summary**: Total passed/failed count at the end

### Example Output

```
Running ESLint Plugin Boundaries E2E Tests

Found 3 test(s): basic-config, basic-config-ts, strict-config

Running tests for: basic-config
✓ ESLint should run successfully on basic-config
✓ basic-config should have ESLint errors in invalid.js
✓ basic-config should have no errors in valid files
✓ basic-config should detect boundaries violation
  Files processed: 2
  Total errors: 1
  Total warnings: 0
    Errors in invalid.js:
      Line 3: No rule allowing this dependency was found (boundaries/element-types)

=== Test Summary ===
Total: 6
Passed: 6

All tests passed!
```

This detailed output allows you to quickly identify:
- Which specific assertions are failing
- What ESLint errors are being generated
- Whether the plugin is working as expected
- How to fix configuration or test issues
