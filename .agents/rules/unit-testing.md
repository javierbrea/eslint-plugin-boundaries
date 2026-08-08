---
paths:
  - "**/*.spec.ts"
---

# Unit testing conventions (Jest + TypeScript)

## Placement and naming

Use `.spec.ts` for all test files, never `.test.ts`. Placement depends on the package:

| Package | Convention |
|---|---|
| `elements` | Colocated with source (`src/Cache/Cache.spec.ts`) |
| `eslint-plugin` | Rule tests under `test/rules/<scenario>/`, mirrored by fixtures in `test/fixtures/<scenario>/`; everything else (e.g. `src/index.spec.ts`) colocated with source |

## Structure

Every `it` block follows **Arrange → Act → Assert**. Use `it()`, never `test()`. One top-level `describe` per class or module, one nested `describe` per public method:

```typescript
describe("ServiceName", () => {
  let service: MyService;
  let mockDep: jest.Mocked<Dep>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDep = { method: jest.fn() } as unknown as jest.Mocked<Dep>;
    service = new MyService(mockDep);
  });

  describe("methodName", () => {
    it("should do X when Y", () => {
      // Arrange
      // Act
      // Assert
    });
  });
});
```

Reset or recreate mocks in `beforeEach` (not `afterEach`) so state doesn't leak between tests regardless of failures.

## Mocking

- **Inline typed mocks**: build a `jest.Mocked<T>` object rather than a loose literal.
- **Module-level mocks**: prefer `jest.mocked(fn)` over `fn as jest.Mocked<Type>`.
- **Spying**: use `jest.spyOn` to observe calls to an existing method.
- **ESLint rule tests**: use the project's test infrastructure — `createRuleTester`, `pathResolvers`, and `SETTINGS` from `test/support/helpers`.

## Type safety

**Never use `any` in tests.** Use `as unknown as T` for partial mocks that can't implement the full interface, and `@ts-expect-error` with a descriptive comment only when intentionally passing an incomplete type, kept close to the problematic line.

```typescript
// Good
const partialConfig = { timeout: 5000 } as unknown as Config;

// Bad
const config: any = { timeout: 5000 };
```

## Coverage — 100% required

Both `packages/elements/jest.config.js` and `packages/eslint-plugin/jest.config.js` set `coverageThreshold.global` to 100% (branches, functions, lines, statements); a drop below fails the build. Prefer adding tests over suppressing coverage. See the `unit-testing` skill for the workflow to close remaining coverage gaps and for the `istanbul ignore` rules covering genuinely unreachable branches.

## Anti-patterns

| Anti-pattern | Correct approach |
|---|---|
| `const x: any = ...` | `const x = ... as unknown as Foo` |
| `test()` instead of `it()` | Use `it()` consistently |
| `.test.ts` extension | Use `.spec.ts` |
| Shared mutable state across tests | Reset in `beforeEach` |
| `as jest.Mocked<T>` for module mocks | `jest.mocked()` |
| Missing AAA structure | Always follow Arrange → Act → Assert |
| Removing production code to fix coverage | Present evidence and ask the user first |
