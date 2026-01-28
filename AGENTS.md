# Agent Guidelines for gvp-orch-auth-server

## Language Policy

**CRITICAL:** All repository artifacts must be written in English.

- Code, comments, test names and descriptions, documentation, and configuration messages must be in English.
- The agent can converse in other languages with users, but any output persisted to the repository (files, code, docs, test titles) must be in English.

## Repository Overview

This repository is a monorepo structured using Nx, containing multiple packages and applications related to the boundaries project. Different packages are organized under the `packages/` directory, each serving a specific purpose such as ESLint plugins, shared utilities, public website with documentation, and more.

Each package contains its own README.md file with detailed information about its functionality, usage, and development guidelines.

## Essential Commands

The repository uses `pnpm` as the package manager, and `nx` as the build system. Package task names are standardized across the repository. This means that commands for building, testing, linting, and formatting are consistent.

To run commands for a specific package, use the following format:

```bash
pnpm nx <task> <package-name> --output-style=stream 
```

Example:

```bash
pnpm nx test:unit eslint-plugin --output-style=stream
```

### Running Tests

**Run unit tests with coverage:**
```bash
pnpm nx test:unit eslint-plugin --output-style=stream
```

**Run tests without coverage (faster for development):**
```bash
pnpm nx test:unit eslint-plugin --output-style=stream --coverage=false
```

**Run tests for specific file:**
```bash
pnpm nx test:unit eslint-plugin <file-path-relative-to-package> --output-style=stream --coverage=false
```

Package task names are standardized across the repository. The following are the most common tasks:

* `lint`: Lints the package.
* `check:types`: Checks the TypeScript types in the package.
* `check:spell`: Checks the spelling in the package.
* `build`: Builds the package.
* `test:unit`: Runs the unit tests.
* `test:mutation`: Runs the mutation tests.
* `test:e2e`: Runs the end-to-end tests.
* `check:all`: Run all the checks and build the package.

### Running a task in all packages

To run a task in all packages, use the following syntax: `pnpm nx run-many <task> --all`. For example, to run the unit tests in all packages, use the following command:

```bash
pnpm nx run-many -t test:unit --all
```

This will run the `test:unit` task in all packages and also the corresponding dependencies, in the right order, so everything is built and tested correctly.

### Running check in all packages
To run all the checks in all packages, use the following command:

```bash
pnpm nx run-many -t check:all --all
```

## Workflow Best Practices

### After Making Changes

1. **Always format the modified file using `pnpm nx lint <package-name> <path-to-modified-file> --fix`**
2. **Always run tests for the modified files immediately after changes**
3. **Use `--coverage=false` flag to speed up test execution during development**
4. **Run focused tests first, then full package suite if needed**

### Standard Post-Modification Flow

```bash
# 1. Format the modified file
pnpm nx lint <package-name> <path-to-modified-file> --output-style=stream --fix

# 2. Run tests for the modified file
pnpm nx test:unit <package-name> <path-to-modified-test-file> --output-style=stream --coverage=false

# Example: After modifying packages/elements/src/Matcher/ElementsMatcher.ts
pnpm nx lint elements src/Matcher/ElementsMatcher.ts --output-style=stream --fix
pnpm nx test:unit elements test/specs/Matcher.spec.ts --output-style=stream --coverage=false
```

### Type Safety in Tests

**NEVER use `any` type in tests.** Always use proper types to ensure type safety and catch potential issues early.

**For partial mocks**, use `@ts-expect-error` with a descriptive comment when you don't need to implement the complete interface, or `as unknown as` when necessary.

```typescript
// Good: Partial mock with explicit comment
const partialConfig = {
  timeout: 5000,
  retries: 3
} as unknown as ICompleteConfig;

// Bad: Using 'any' type
const config: any = { timeout: 5000 };
```

**Key principles:**
- Always import and use the correct interface/type
- Mock only what's necessary for the test
- Use `@ts-expect-error Mocked partially` comment when creating partial mocks
- Prefer existing mock factories over manual object creation

## Other Useful Commands

**Install dependencies:**

```bash
pnpm install
```
