---
paths:
  - "**/*.spec.ts"
  - "**/*.spec.tsx"
---

# Unit testing conventions (Jest + TypeScript)

## Placement and naming

Use `.spec.ts` for all test files, or `.spec.tsx` for those that render React components, never `.test.ts`. Placement depends on the package:

| Package | Convention |
|---|---|
| `elements` | Colocated with source (`src/Cache/Cache.spec.ts`) |
| `config` | Colocated with source (`src/Config/Config.spec.ts`) |
| `policies` | Colocated with source (`src/Evaluation/Evaluation.spec.ts`) |
| `playground` | Colocated with source (`src/app/Playground.spec.tsx`), in the environment that `packages/playground/AGENTS.md` ("Host contract") gives; page objects in `.agents/rules/playground-testing.md` |
| `eslint-plugin` | Rule tests in `test/rules/<scenario>/`, run against the fixture projects in `test/fixtures/<scenario>/`; a test may use another scenario's fixtures. Everything else (e.g. `src/index.spec.ts`) is colocated with source |

## Structure

Every `it` block follows **Arrange → Act → Assert**. One top-level `describe` per class or module, one nested `describe` per public method:

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

Lint forbids `any`, in tests too. A partial mock is cast with `as unknown as T`, and a value of the wrong type that a test passes on purpose gets `@ts-expect-error` with a comment that says why, on the line before it.

## Coverage — 100% required

The Jest config of `packages/elements`, `packages/config`, `packages/policies`, `packages/eslint-plugin` and `packages/playground` sets `coverageThreshold.global` to 100% (branches, functions, lines, statements); a drop below fails the build. Prefer adding tests over suppressing coverage. See the `unit-testing` skill for the workflow to close remaining coverage gaps and for the `istanbul ignore` rules covering genuinely unreachable branches.

## Anti-patterns

| Anti-pattern | Correct approach |
|---|---|
| `.test.ts` extension | Use `.spec.ts` |
| Shared mutable state across tests | Reset in `beforeEach` |
| `as jest.Mocked<T>` for module mocks | `jest.mocked()` |
| Missing AAA structure | Always follow Arrange → Act → Assert |
| Removing production code to fix coverage | Present evidence and ask the user first |
