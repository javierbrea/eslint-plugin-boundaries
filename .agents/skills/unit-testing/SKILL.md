---
name: unit-testing
description: "Write unit tests with Jest and TypeScript following project conventions. Use when: writing tests, creating test files, adding test cases, mocking dependencies, completing coverage, or testing any TypeScript module in packages/. Covers mock usage, type safety, AAA pattern, test structure, coverage completion, and post-modification workflow."
argument-hint: "Path to target test or source file under packages/ (e.g., packages/elements/src/Matcher/ElementsMatcher.ts)"
---

# Unit Testing — Jest + TypeScript

## When to Use

Load this skill when:

- Writing or updating any test file (`*.spec.ts`)
- Choosing how to mock dependencies
- Structuring `describe` / `it` blocks
- Needing guidance on type safety in tests
- Completing or maximizing branch coverage for a specific test file
- Running or verifying tests after a change

---

## Post-Modification Workflow

**Always** follow this flow after writing or editing a test file. Run commands from the package directory (`packages/<package-name>/`):

```bash
# 1. Lint the modified file
pnpm nx lint <package-name> <path-to-modified-file> --output-style=stream --fix

# 2. Run tests for the modified file (no coverage for speed)
cd packages/<package-name>
pnpm test:unit <path-to-test-file> --coverage=false
```

Only run the full suite (`pnpm test:unit`) when the individual file passes.

---

## Test File Placement and Naming

Use `.spec.ts` for all test files. Placement depends on the package:

| Package | Convention | Example |
|---|---|---|
| `elements` | Colocated with source | `src/Cache/Cache.spec.ts` |
| `eslint-plugin` | Separate `test/` directory | `test/rules/one-level/element-types.spec.ts` |
| `eslint-plugin` (source-level) | Colocated with source | `src/index.spec.ts` |

---

## Test Structure — AAA Pattern

Every `it` block must follow **Arrange → Act → Assert**:

```typescript
it("should return the user when found", () => {
  // Arrange
  const userId = "abc-123";
  mockRepository.findById.mockReturnValue({ id: userId, name: "Alice" });

  // Act
  const result = service.getUser(userId);

  // Assert
  expect(result).toEqual({ id: userId, name: "Alice" });
  expect(mockRepository.findById).toHaveBeenCalledWith(userId);
});
```

---

## Describe Block Structure

```typescript
describe("ServiceName", () => {
  let service: MyService;
  let mockDep: jest.Mocked<IDep>;

  beforeEach(() => {
    mockDep = { method: jest.fn() } as unknown as jest.Mocked<IDep>;
    service = new MyService(mockDep);
  });

  describe("methodName", () => {
    it("should do X when Y", () => { ... });
    it("should throw when Z", () => { ... });
  });
});
```

- One top-level `describe` per class or module.
- One nested `describe` per public method.
- Use `it()`, not `test()`.
- `beforeEach` resets mocks to avoid state leakage between tests.

---

## Reset and Isolation

Always reset or recreate mocks in `beforeEach`:

```typescript
beforeEach(() => {
  jest.clearAllMocks();
  mockRepository = { findById: jest.fn() } as unknown as jest.Mocked<IRepo>;
});
```

Prefer `jest.clearAllMocks()` in `beforeEach` over `afterEach` to ensure a clean state before each test regardless of failures.

---

## Mocking

### Inline Typed Mocks

When mocking an interface, create a `jest.Mocked<T>` object:

```typescript
let mockRepository: jest.Mocked<IUserRepository>;

beforeEach(() => {
  mockRepository = {
    findById: jest.fn(),
    save: jest.fn(),
  } as unknown as jest.Mocked<IUserRepository>;
});
```

### Module-Level Mocks

Prefer `jest.mocked()` over `as jest.Mocked<Type>` for module-level mocks:

```typescript
jest.mock("../path/to/module");
import { someFunction } from "../path/to/module";
const mockedFn = jest.mocked(someFunction);
```

### Jest Spying

Use `jest.spyOn` when you need to observe calls to an existing method:

```typescript
jest.spyOn(micromatch, "capture");
```

### ESLint Rule Testing

For ESLint rule tests, use the project's test infrastructure:

```typescript
import { SETTINGS, createRuleTester, pathResolvers } from "../../support/helpers";

const { absoluteFilePath, codeFilePath } = pathResolvers("one-level");
const ruleTester = createRuleTester(SETTINGS.oneLevel);

ruleTester.run(RULE, rule, {
  valid: [
    { filename: absoluteFilePath("components", "Component1"), code: "import ..." },
  ],
  invalid: [
    {
      filename: absoluteFilePath("components", "Component1"),
      code: "import ...",
      errors: [{ message: "...", type: "Literal" }],
    },
  ],
});
```

---

## Type Safety Rules

- **NEVER use `any` in tests.** TypeScript errors in tests surface real bugs early.
- Use `as unknown as T` for partial mocks that cannot implement the full interface.
- Add `@ts-expect-error` with a descriptive comment only when intentionally passing an incomplete type, keeping it close to the problematic line.

```typescript
// Good
const partialConfig = { timeout: 5000 } as unknown as IConfig;

// Good: defensive branch testing
const partialMock = {
  retries: 3,
  // @ts-expect-error Testing branch with undefined property for edge case
  requiredField: undefined,
} as unknown as CompleteInterface;

// Bad
const config: any = { timeout: 5000 };
```

---

## Testing Errors and Rejections

```typescript
it("should throw NotFoundError when user does not exist", async () => {
  // Arrange
  mockRepository.findById.mockResolvedValue(null);

  // Act & Assert
  await expect(service.getUser("missing")).rejects.toThrow(NotFoundError);
});
```

---

## Running Tests — Quick Reference

Run test commands from the package directory (`cd packages/<package-name>/`):

| Goal | Command |
|---|---|
| Run package tests with coverage | `pnpm test:unit` |
| Run without coverage (faster) | `pnpm test:unit --coverage=false` |
| Run a specific test file | `pnpm test:unit <file-path> --coverage=false` |
| Run by name pattern | `pnpm test:unit --coverage=false -t "<pattern>"` |
| Run all packages (from repo root) | `pnpm nx run-many -t test:unit --all` |

---

## Coverage Policy — 100% Required

All packages enforce **100% coverage** (branches, functions, lines, statements). Any drop below 100% will fail the build.

### Completing Coverage for a Specific File

1. **Run the target test file with coverage** to get a baseline:
   ```bash
   cd packages/<package-name>
   pnpm test:unit <test-file>
   ```

2. **Find missing branches** by inspecting `packages/<package>/coverage/lcov.info` for `BRDA` entries with zero hits. Map uncovered branches to exact conditions in the source.

3. **Add tests** to hit uncovered branches. Re-run after each change. Repeat until resolved or justified.

4. **Prefer adding tests over suppressing coverage.**

5. If uncovered logic appears obsolete, **do not change production code** — present evidence and request user confirmation first.

### Handling Unreachable or Defensive Branches

When a branch is genuinely unreachable at runtime and cannot be exercised through tests, mark it with an `istanbul ignore` comment that **justifies why**:

```typescript
/* istanbul ignore next -- Defensive guard: invalid parser state is impossible through public API */
```

Rules for `istanbul ignore`:

1. **Always include a justification** after the `--` separator.
2. **Prefer making code non-optional over ignoring it.** If a default is never exercised, remove it instead of adding an ignore comment.
3. **Only use for genuinely unreachable code.** If a branch can be triggered through a public API, write a test for it.
4. **Keep the ignore scope as narrow as possible.** Place on the specific line or branch, not on entire functions.

---

## Anti-patterns to Avoid

| Anti-pattern | Correct approach |
|---|---|
| `const x: any = ...` | `const x = ... as unknown as IFoo` |
| Using `test()` instead of `it()` | Use `it()` consistently |
| Using `.test.ts` file extension | Use `.spec.ts` |
| Shared mutable state across tests | Reset in `beforeEach` |
| `as jest.Mocked<T>` for module mocks | `jest.mocked()` |
| Missing AAA structure | Always follow Arrange → Act → Assert |
| Removing production code without asking | Present evidence and ask the user first |
