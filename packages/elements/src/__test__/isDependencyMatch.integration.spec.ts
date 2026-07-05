/* eslint-disable jest/no-conditional-in-test */

import micromatch from "micromatch";

import type {
  DependencyDescriptorOptions,
  DependencySingleSelector,
  Matcher,
} from "../index";
import { normalizeDependencySelector, Elements } from "../index";

describe("isDependencyMatch | Integration", () => {
  let matcher: Matcher;
  let elements: Elements;
  let micromatchSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    micromatchSpy = jest.spyOn(micromatch, "isMatch");

    elements = new Elements();
    matcher = elements.getMatcher(
      {
        elements: [
          {
            // v7 folder-based element: all files under src/components/ are "component" elements
            type: "component",
            pattern: "src/components",
          },
          {
            type: "module",
            pattern: ["modules/*"],
            capture: ["moduleName"],
          },
          {
            type: "foo",
            pattern: ["foo/*"],
          },
          {
            // partialMatch: false replaces deprecated mode: "full"
            type: "service",
            pattern: ["**/src/services/*"],
            partialMatch: false,
            capture: ["baseFolder", "serviceName"],
          },
          { type: "utility", pattern: "src/utils" },
        ],
        files: [
          { pattern: "**/*.tsx", category: "react" },
          { pattern: "**/*.test.ts", category: "test" },
          { pattern: "**/*.spec.ts", category: "test" },
          { pattern: "**/modules/**", category: "business-logic" },
        ],
      },
      {
        includePaths: ["**/src/**/*.ts", "**/src/**/*.tsx"],
        ignorePaths: ["**/src/**/__tests__/**"],
      }
    );
  });

  afterEach(() => {
    elements.clearCache();
  });

  describe("when matching dependencies using element selectors", () => {
    // eslint-disable-next-line jest/prefer-ending-with-an-expect
    it.each([
      {
        dependency: {
          from: "/project/src/components/Button.tsx",
          to: "/project/src/bar/Baz.ts",
          source: "project/bar",
          kind: "type",
          nodeKind: "ImportDeclaration",
        },
        selector: {
          from: { element: { types: "component" } },
        },
        expected: true,
      },
      {
        dependency: {
          from: "/project/src/components/Button.tsx",
          to: "/project/src/bar/Baz.ts",
          source: "project/bar",
          kind: "type",
          nodeKind: "ImportDeclaration",
        },
        selector: {
          from: { element: { type: "{{ from.types.[0] }}" } },
        },
        expected: true,
        expectedMatch: {
          from: { element: { type: "{{ from.types.[0] }}" } },
        },
      },
      {
        dependency: {
          from: "/project/src/components/Button.tsx",
          to: "/project/src/bar/Baz.ts",
          source: "project/bar",
          kind: "type",
          nodeKind: "ImportDeclaration",
        },
        selector: {
          from: { element: { types: "foo" } },
        },
        expected: false,
      },
      {
        dependency: {
          from: "/project/src/foo/var/modules/notification/modules/phone/modules/sms/SmsService.ts",
          to: "/project/src/bar/Baz.ts",
          source: "project/bar",
          kind: "type",
          nodeKind: "ImportDeclaration",
        },
        selector: {
          from: { element: { parent: { type: "module" } } },
        },
        expected: true,
      },
      {
        dependency: {
          from: "/project/src/foo/var/modules/notification/modules/phone/modules/sms/SmsService.ts",
          to: "/project/src/bar/Baz.ts",
          source: "project/bar",
          kind: "type",
          nodeKind: "ImportDeclaration",
        },
        selector: {
          from: {
            element: {
              parent: {
                captured: {
                  moduleName: "{{ from.parents.0.captured.moduleName }}",
                },
              },
            },
          },
        },
        expected: true,
      },
      {
        dependency: {
          from: "/project/src/components/Button.tsx",
          to: "/project/src/bar/Baz.ts",
          source: "project/bar",
          kind: "type",
          nodeKind: "ImportDeclaration",
        },
        selector: {
          from: { file: { path: "/project/src/components/Button.tsx" } },
        },
        expected: true,
      },
      {
        dependency: {
          from: "/project/src/components/Button.tsx",
          to: "/project/src/bar/Baz.ts",
          source: "project/bar",
          kind: "type",
          nodeKind: "ImportDeclaration",
        },
        selector: {
          from: { file: { path: "foo" } },
        },
        expected: false,
      },
      {
        dependency: {
          from: "/project/src/components/Button.tsx",
          to: "/project/src/bar/Baz.ts",
          source: "project/bar",
          kind: "type",
          nodeKind: "ImportDeclaration",
        },
        selector: {
          from: { element: { path: "**/*" } },
        },
        expected: true,
      },
      {
        dependency: {
          from: "/project/src/components/Button.tsx",
          to: "/project/src/bar/Baz.ts",
          source: "project/bar",
          kind: "type",
          nodeKind: "ImportDeclaration",
        },
        selector: {
          from: { element: { path: "foo" } },
        },
        expected: false,
      },
      {
        dependency: {
          from: "/project/src/components/Button.tsx",
          to: "/project/src/bar/Baz.ts",
          source: "project/bar",
          kind: "type",
          nodeKind: "ImportDeclaration",
        },
        selector: {
          from: { element: { isIgnored: false } },
        },
        expected: true,
      },
      {
        dependency: {
          from: "/project/src/components/Button.tsx",
          to: "/project/src/bar/Baz.ts",
          source: "project/bar",
          kind: "type",
          nodeKind: "ImportDeclaration",
        },
        selector: {
          from: { element: { isIgnored: true } },
        },
        expected: false,
      },
      {
        dependency: {
          from: "/project/src/components/Button.tsx",
          to: "/project/src/utils/math/math.test.ts",
          source: "../utils/math/math.test.ts",
          kind: "value",
          nodeKind: "Import",
          specifiers: ["calculateSum", "calculateAvg"],
        },
        selector: {
          to: { module: { origin: "foo" } },
        },
        expected: false,
      },
      {
        dependency: {
          from: "/project/src/components/Button.tsx",
          to: "/project/src/utils/math/math.test.ts",
          source: "../utils/math/math.test.ts",
          kind: "value",
          nodeKind: "Import",
          specifiers: ["calculateSum", "calculateAvg"],
        },
        selector: {
          to: [{ module: { origin: "local" } }, { element: { type: "var" } }],
        },
        expected: true,
        expectedMatch: {
          to: { module: { origin: "local" } },
        },
      },
      // File category tests (replaces deprecated element category)
      {
        dependency: {
          from: "/project/src/components/Button.tsx",
          to: "/project/src/utils/math/math.test.ts",
          source: "../utils/math/math.test.ts",
          kind: "value",
          nodeKind: "Import",
          specifiers: ["calculateSum", "calculateAvg"],
        },
        selector: {
          to: { file: { categories: "test" } },
        },
        expected: true,
      },
      // Type tests
      {
        dependency: {
          to: "/project/src/components/Button.tsx",
          from: "/project/src/utils/math/math.test.ts",
          source: "../components/Button.tsx",
          kind: "type",
          nodeKind: "Import",
          specifiers: ["calculateSum", "calculateAvg"],
        },
        selector: {
          to: { element: { type: "component" } },
        },
        expected: true,
        expectedMatch: {
          to: { element: { type: "component" } },
        },
      },
      {
        dependency: {
          to: "/project/src/components/Button.tsx",
          from: "/project/src/utils/math/math.test.ts",
          source: "../components/Button.tsx",
          kind: "type",
          nodeKind: "Import",
          specifiers: ["calculateSum", "calculateAvg"],
        },
        selector: {
          to: [{ element: { type: "foo" } }],
        },
        expected: false,
      },
      // Captured tests using module element
      {
        dependency: {
          to: "/project/src/modules/user/foo.ts",
          from: "/project/src/components/Button.tsx",
          source: "../modules/user/foo.ts",
          kind: "type",
          nodeKind: "Import",
          specifiers: ["UserService"],
        },
        selector: {
          to: { element: { type: "module", captured: { moduleName: "user" } } },
        },
        expected: true,
        expectedMatch: {
          to: { element: { type: "module", captured: { moduleName: "user" } } },
        },
      },
      {
        dependency: {
          to: "/project/src/modules/user/foo.ts",
          from: "/project/src/components/Button.tsx",
          source: "../modules/user/foo.ts",
          kind: "type",
          nodeKind: "Import",
          specifiers: ["UserService"],
        },
        selector: {
          to: {
            element: { type: "module", captured: { moduleName: "admin" } },
          },
        },
        expected: false,
      },
      // Template tests
      {
        dependency: {
          to: "/project/src/components/Button.tsx",
          from: "/project/src/utils/math/math.test.ts",
          source: "../components/Button.tsx",
          kind: "type",
          nodeKind: "Import",
          specifiers: ["calculateSum", "calculateAvg"],
        },
        selector: {
          to: { element: { types: "{{ to.types.[0] }}" } },
        },
        expected: true,
      },
      {
        dependency: {
          to: "/project/src/components/Button.tsx",
          from: "/project/src/utils/math/math.test.ts",
          source: "../components/Button.tsx",
          kind: "type",
          nodeKind: "Import",
          specifiers: ["calculateSum", "calculateAvg"],
        },
        selector: {
          from: { element: { type: "{{ from.types.[0] }}" } },
        },
        expected: true,
      },
      // Path tests
      {
        dependency: {
          to: "/project/src/components/Button.tsx",
          from: "/project/src/utils/math/math.test.ts",
          source: "../components/Button.tsx",
          kind: "type",
          nodeKind: "Import",
          specifiers: ["calculateSum", "calculateAvg"],
        },
        selector: {
          from: {
            element: { types: "{{ from.types.[0] }}" },
          },
          to: { file: { path: "{{ to.file.path }}" } },
        },
        expected: true,
      },
      {
        dependency: {
          to: "/project/src/components/Button.tsx",
          from: "/project/src/utils/math/math.test.ts",
          source: "../components/Button.tsx",
          kind: "type",
          nodeKind: "Import",
          specifiers: ["calculateSum", "calculateAvg"],
        },
        selector: {
          to: { file: { path: "**/Foo.tsx" } },
        },
        expected: false,
      },
      // Element Path tests
      {
        dependency: {
          to: "/project/src/components/Button.tsx",
          from: "/project/src/utils/math/math.test.ts",
          source: "../components/Button.tsx",
          kind: "type",
          nodeKind: "Import",
          specifiers: ["calculateSum", "calculateAvg"],
        },
        selector: {
          to: { element: { path: "**" } },
        },
        expected: true,
      },
      {
        dependency: {
          to: "/project/src/components/Button.tsx",
          from: "/project/src/utils/math/math.test.ts",
          source: "../components/Button.tsx",
          kind: "type",
          nodeKind: "Import",
          specifiers: ["calculateSum", "calculateAvg"],
        },
        selector: {
          to: { element: { path: "foo" } },
        },
        expected: false,
      },
      // IsIgnored tests
      {
        dependency: {
          to: "/project/src/components/Button.tsx",
          from: "/project/src/utils/math/math.test.ts",
          source: "../components/Button.tsx",
          kind: "type",
          nodeKind: "Import",
          specifiers: ["calculateSum", "calculateAvg"],
        },
        selector: {
          to: { element: { isIgnored: false } },
        },
        expected: true,
      },
      {
        dependency: {
          to: "/project/src/components/Button.tsx",
          from: "/project/src/utils/math/math.test.ts",
          source: "../components/Button.tsx",
          kind: "type",
          nodeKind: "Import",
          specifiers: ["calculateSum", "calculateAvg"],
        },
        selector: {
          to: { element: { isIgnored: true } },
        },
        expected: false,
      },
      // isUnknown tests
      {
        dependency: {
          to: "/project/src/components/Button.tsx",
          from: "/project/src/utils/math/math.test.ts",
          source: "../components/Button.tsx",
          kind: "type",
          nodeKind: "Import",
          specifiers: ["calculateSum", "calculateAvg"],
        },
        selector: {
          to: { element: { isUnknown: false } },
        },
        expected: true,
      },
      {
        dependency: {
          to: "/project/src/components/Button.tsx",
          from: "/project/src/utils/math/math.test.ts",
          source: "../components/Button.tsx",
          kind: "type",
          nodeKind: "Import",
          specifiers: ["calculateSum", "calculateAvg"],
        },
        selector: {
          to: { element: { isUnknown: true } },
        },
        expected: false,
      },
      // InternalPath tests
      {
        dependency: {
          to: "/project/src/components/Button.tsx",
          from: "/project/src/utils/math/math.test.ts",
          source: "../components/Button.tsx",
          kind: "type",
          nodeKind: "Import",
          specifiers: ["calculateSum", "calculateAvg"],
        },
        selector: {
          to: {
            element: {
              types: "{{ to.types.[0] }}",
              fileInternalPath: "**/Button.tsx",
            },
          },
        },
        expected: true,
        expectedMatch: {
          to: {
            element: {
              types: "{{ to.types.[0] }}",
              fileInternalPath: "**/Button.tsx",
            },
          },
        },
      },
      {
        dependency: {
          to: "/project/src/components/Button.tsx",
          from: "/project/src/utils/math/math.test.ts",
          source: "../components/Button.tsx",
          kind: "type",
          nodeKind: "Import",
          specifiers: ["calculateSum", "calculateAvg"],
        },
        selector: {
          to: {
            element: {
              types: "{{ to.types.[0] }}",
              fileInternalPath: ["foo", "**/Button.tsx"],
            },
          },
        },
        expected: true,
        expectedMatch: {
          to: {
            element: {
              types: "{{ to.types.[0] }}",
              fileInternalPath: ["foo", "**/Button.tsx"],
            },
          },
        },
      },
      {
        dependency: {
          from: "/project/src/components/Button.tsx",
          to: "/project/node_modules/react/index.tsx",
          source: "react",
          kind: "type",
          nodeKind: "ImportDeclaration",
        },
        selector: {
          to: { module: { origin: ["external", "local"] } },
          dependency: { source: "react" },
        },
        expected: true,
      },
      {
        dependency: {
          from: "/project/src/components/Button.tsx",
          to: "/project/node_modules/react/index.tsx",
          source: "react",
          kind: "type",
          nodeKind: "ImportDeclaration",
        },
        selector: {
          dependency: { source: "foo" },
        },
        expected: false,
      },
      {
        dependency: {
          from: "/project/src/components/Button.tsx",
          to: "/project/node_modules/react/index.tsx",
          source: "react",
          kind: "type",
          nodeKind: "ImportDeclaration",
        },
        selector: {
          to: { element: { path: "*" } }, // Unknown element, so element path is not set
        },
        expected: false,
      },
      {
        dependency: {
          from: "/project/src/components/Button.tsx",
          to: "/project/node_modules/react/index.tsx",
          source: "react",
          kind: "type",
          nodeKind: "ImportDeclaration",
        },
        selector: {
          to: { element: { isUnknown: true } },
        },
        expected: true,
      },
      // Module tests
      {
        dependency: {
          from: "/project/src/components/Button.tsx",
          to: "/project/node_modules/react/index.tsx",
          source: "react",
          kind: "type",
          nodeKind: "ImportDeclaration",
        },
        selector: {
          to: { module: { origin: ["external", "local"], source: "react" } },
        },
        expected: true,
      },
      {
        dependency: {
          from: "/project/src/components/Button.tsx",
          to: "/project/node_modules/react/index.tsx",
          source: "react",
          kind: "type",
          nodeKind: "ImportDeclaration",
        },
        selector: {
          to: { module: { source: "foo" } },
        },
        expected: false,
      },
      {
        dependency: {
          from: "/project/src/components/Button.tsx",
          to: "/project/node_modules/react/index.tsx",
          source: "react",
          kind: "type",
          nodeKind: "ImportDeclaration",
        },
        selector: {
          to: { module: { origin: ["external", "local"], source: "react" } },
          dependency: { source: "react" },
        },
        expected: true,
      },
      {
        dependency: {
          from: "/project/src/components/Button.tsx",
          to: "/project/node_modules/react/index.tsx",
          source: "react",
          kind: "type",
          nodeKind: "ImportDeclaration",
        },
        selector: {
          dependency: { relationship: { to: "foo" } },
        },
        expected: false,
      },
      // Dependency metadata source tests
      {
        dependency: {
          from: "/project/src/components/Button.tsx",
          to: "/project/node_modules/react/index.tsx",
          source: "react",
          kind: "type",
          nodeKind: "ImportDeclaration",
        },
        selector: {
          dependency: { source: "react" },
        },
        expected: true,
      },
      {
        dependency: {
          from: "/project/src/components/Button.tsx",
          to: "/project/node_modules/react/index.tsx",
          source: "react",
          kind: "type",
          nodeKind: "ImportDeclaration",
        },
        selector: {
          to: { module: { source: "react" } },
        },
        expected: true,
      },
      {
        dependency: {
          from: "/project/src/components/Button.tsx",
          to: "/project/node_modules/react/index.tsx",
          source: "react",
          kind: "type",
          nodeKind: "ImportDeclaration",
        },
        selector: [
          { dependency: { source: "foo" } },
          { to: { module: { source: "react" } } },
        ],
        expected: true,
        expectedMatch: {
          to: { module: { source: "react" } },
        },
      },
      {
        dependency: {
          from: "/project/src/components/Button.tsx",
          to: "/project/node_modules/react/index.tsx",
          source: "react",
          kind: "type",
          nodeKind: "ImportDeclaration",
        },
        selector: [
          { dependency: { source: "foo" } },
          { to: { module: { source: "bar" } } },
        ],
        expected: false,
      },
      // NodeKind tests
      {
        dependency: {
          from: "/project/src/components/Button.tsx",
          to: "/project/node_modules/react/index.tsx",
          source: "react",
          kind: "type",
          nodeKind: "ImportDeclaration",
        },
        selector: {
          dependency: { nodeKind: "ImportDeclaration" },
        },
        expected: true,
      },
      {
        dependency: {
          from: "/project/src/components/Button.tsx",
          to: "/project/node_modules/react/index.tsx",
          source: "react",
          kind: "type",
          nodeKind: "ImportDeclaration",
        },
        selector: {
          dependency: { nodeKind: ["Import*"] },
        },
        expected: true,
      },
      {
        dependency: {
          from: "/project/src/components/Button.tsx",
          to: "/project/node_modules/react/index.tsx",
          source: "react",
          kind: "type",
          nodeKind: "ImportDeclaration",
        },
        selector: {
          dependency: { nodeKind: "{{ dependency.nodeKind }}" },
        },
        expected: true,
      },
      {
        dependency: {
          from: "/project/src/components/Button.tsx",
          to: "/project/node_modules/react/index.tsx",
          source: "react",
          kind: "type",
          nodeKind: "ImportDeclaration",
        },
        selector: {
          dependency: { nodeKind: "{{ to.foo }}" },
        },
        expected: false,
      },
      {
        dependency: {
          from: "/project/src/components/Button.tsx",
          to: "/project/node_modules/react/index.tsx",
          source: "react",
          kind: "type",
        },
        selector: {
          dependency: { nodeKind: ["Import*"] },
        },
        expected: false,
      },
      // Kind tests
      {
        dependency: {
          from: "/project/src/components/Button.tsx",
          to: "/project/node_modules/react/index.tsx",
          source: "react",
          kind: "type",
          nodeKind: "ImportDeclaration",
        },
        selector: {
          dependency: { kind: "t*" },
        },
        expected: true,
      },
      {
        dependency: {
          from: "/project/src/components/Button.tsx",
          to: "/project/node_modules/react/index.tsx",
          source: "react",
          kind: "type",
          nodeKind: "ImportDeclaration",
        },
        selector: {
          dependency: { kind: "{{ dependency.kind }}" },
        },
        expected: true,
      },
      {
        dependency: {
          from: "/project/src/components/Button.tsx",
          to: "/project/node_modules/react/index.tsx",
          source: "react",
          kind: "type",
          nodeKind: "ImportDeclaration",
        },
        selector: {
          dependency: { kind: "{{ to.foo }}" },
        },
        expected: false,
      },
      {
        dependency: {
          from: "/project/src/components/Button.tsx",
          to: "/project/node_modules/react/index.tsx",
          source: "react",
          kind: 2,
          nodeKind: "ImportDeclaration",
        },
        selector: {
          dependency: { kind: "t*" },
        },
        expected: false,
      },
      {
        dependency: {
          from: "/project/src/components/Button.tsx",
          to: "/project/node_modules/react/index.tsx",
          source: "react",
          kind: 2,
          nodeKind: "ImportDeclaration",
        },
        selector: {
          dependency: { kind: "2" },
        },
        expected: true,
      },
      {
        dependency: {
          from: "/project/src/components/Button.tsx",
          to: "/project/node_modules/react/index.tsx",
          source: "react",
          nodeKind: "ImportDeclaration",
        },
        selector: {
          dependency: { kind: "t*" },
        },
        expected: false,
      },
      // Specifier tests
      {
        dependency: {
          from: "/project/src/components/Button.tsx",
          to: "/project/node_modules/react/index.tsx",
          source: "react",
          kind: "type",
          nodeKind: "ImportDeclaration",
          specifiers: ["foo", "bar"],
        },
        selector: {
          dependency: { specifiers: "foo" },
        },
        expected: true,
      },
      {
        dependency: {
          from: "/project/src/components/Button.tsx",
          to: "/project/node_modules/react/index.tsx",
          source: "react",
          kind: "type",
          nodeKind: "ImportDeclaration",
          specifiers: ["foo", "bar"],
        },
        selector: {
          dependency: { specifiers: ["var", "b*"] },
        },
        expected: true,
      },
      {
        dependency: {
          from: "/project/src/components/Button.tsx",
          to: "/project/node_modules/react/index.tsx",
          source: "react",
          kind: "type",
          nodeKind: "ImportDeclaration",
          specifiers: ["foo", "bar"],
        },
        selector: {
          dependency: { specifiers: "{{ lookup dependency.specifiers 0 }}" },
        },
        expected: true,
      },
      {
        dependency: {
          from: "/project/src/components/Button.tsx",
          to: "/project/node_modules/react/index.tsx",
          source: "react",
          kind: "type",
          nodeKind: "ImportDeclaration",
          specifiers: ["foo", "bar"],
        },
        selector: {
          dependency: { specifiers: "{{ dependency.specifiers.foo }}" },
        },
        expected: false,
      },
      {
        dependency: {
          from: "/project/src/components/Button.tsx",
          to: "/project/node_modules/react/index.tsx",
          source: "react",
          kind: "type",
          nodeKind: "ImportDeclaration",
        },
        selector: {
          dependency: { specifiers: "foo" },
        },
        expected: false,
      },
      // Relationship tests
      {
        dependency: {
          from: "/project/src/foo/var/modules/notification/modules/phone/modules/sms/SmsService.ts",
          to: "/project/src/foo/var/modules/notification/modules/email/EmailService.ts",
          source: "../../../email/EmailService",
          kind: "value",
          nodeKind: "ImportDeclaration",
        },
        selector: {
          dependency: { relationship: { to: "uncle" } },
        },
        expected: true,
      },
      {
        dependency: {
          from: "/project/src/foo/var/modules/notification/modules/phone/modules/sms/SmsService.ts",
          to: "/project/src/foo/var/modules/notification/modules/email/EmailService.ts",
          source: "../../../email/EmailService",
          kind: "value",
          nodeKind: "ImportDeclaration",
        },
        selector: {
          dependency: {
            relationship: { to: "{{ dependency.relationship.to }}" },
          },
        },
        expected: true,
      },
      {
        dependency: {
          from: "/project/src/foo/var/modules/notification/modules/phone/modules/sms/SmsService.ts",
          to: "/project/src/foo/var/modules/notification/modules/email/EmailService.ts",
          source: "../../../email/EmailService",
          kind: "value",
          nodeKind: "ImportDeclaration",
        },
        selector: {
          dependency: { relationship: { to: "{{ to.foo }}" } },
        },
        expected: false,
      },
      {
        dependency: {
          from: "/project/src/foo/var/modules/notification/modules/phone/modules/sms/SmsService.ts",
          to: "/project/src/foo/var/modules/notification/modules/email/EmailService.ts",
          source: "../../../email/EmailService",
          kind: "value",
          nodeKind: "ImportDeclaration",
        },
        selector: {
          dependency: { relationship: { from: "nephew" } },
        },
        expected: true,
      },
      {
        dependency: {
          from: "/project/src/foo/var/modules/notification/modules/phone/modules/sms/SmsService.ts",
          to: "/project/src/foo/var/modules/notification/modules/email/EmailService.ts",
          source: "../../../email/EmailService",
          kind: "value",
          nodeKind: "ImportDeclaration",
        },
        selector: {
          dependency: {
            relationship: { from: "{{ dependency.relationship.from }}" },
          },
        },
        expected: true,
      },
      {
        dependency: {
          from: "/project/src/foo/var/modules/notification/modules/phone/modules/sms/SmsService.ts",
          to: "/project/src/foo/var/modules/notification/modules/email/EmailService.ts",
          source: "../../../email/EmailService",
          kind: "value",
          nodeKind: "ImportDeclaration",
        },
        selector: {
          dependency: { relationship: { from: "{{ from.foo }}" } },
        },
        expected: false,
      },
      {
        dependency: {
          from: "/project/src/foo/var/modules/notification/modules/phone/modules/sms/SmsService.ts",
          to: "/project/src/foo/var/modules/notification/modules/email/EmailService.ts",
          source: "../../../email/EmailService",
          kind: "value",
          nodeKind: "ImportDeclaration",
        },
        selector: {
          dependency: {
            relationship: {
              to: "uncle",
              from: "nephew",
            },
          },
        },
        expected: true,
      },
      {
        dependency: {
          from: "/project/src/foo/var/modules/notification/modules/phone/modules/sms/SmsService.ts",
          to: "/project/src/foo/var/modules/notification/modules/email/EmailService.ts",
          source: "../../../email/EmailService",
          kind: "value",
          nodeKind: "ImportDeclaration",
        },
        selector: {
          dependency: {
            relationship: {
              to: "{{ dependency.relationship.to }}",
              from: "{{ dependency.relationship.from }}",
            },
          },
        },
        expected: true,
      },
      {
        dependency: {
          from: "/project/src/foo/var/modules/notification/modules/phone/modules/sms/SmsService.ts",
          to: "/project/src/foo/var/modules/notification/modules/email/EmailService.ts",
          source: "../../../email/EmailService",
          kind: "value",
          nodeKind: "ImportDeclaration",
        },
        selector: {
          dependency: {
            relationship: {
              to: "uncle",
              from: "foo",
            },
          },
        },
        expected: false,
      },
    ])(
      "should return $expected when checking if dependency matches the selector $selector",
      // @ts-expect-error: Testing some invalid cases too
      ({
        dependency,
        expected,
        selector,
        extraTemplateData,
        expectedMatch,
      }: {
        dependency: DependencyDescriptorOptions;
        expected: boolean;
        selector: DependencySingleSelector;
        extraTemplateData?: Record<string, unknown>;
        expectedMatch?: DependencySingleSelector;
      }) => {
        const result = extraTemplateData
          ? matcher.isDependencyMatch(dependency, selector, {
              extraTemplateData,
            })
          : matcher.isDependencyMatch(dependency, selector);

        if (result !== expected) {
          console.error(
            "Mismatch on:",
            JSON.stringify(
              {
                dependency,
                selector,
                extraTemplateData,
                expectedMatch,
                description: matcher.describeDependency(dependency),
              },
              null,
              2
            )
          );
        }

        expect(result).toBe(expected);

        if (expected) {
          const selectorMatchingResult = matcher.getDependencySelectorMatching(
            dependency,
            selector,
            extraTemplateData ? { extraTemplateData } : undefined
          );

          const convertedMatchingResult = selectorMatchingResult
            ? normalizeDependencySelector(selectorMatchingResult)
            : null;

          const convertedSelector =
            expectedMatch || selector
              ? normalizeDependencySelector(expectedMatch || selector)
              : null;

          // eslint-disable-next-line jest/no-conditional-expect
          expect(convertedMatchingResult).toStrictEqual(convertedSelector);
        }
      }
    );

    it("should match using entity selector in from and to", () => {
      const result = matcher.isDependencyMatch(
        {
          from: "/project/src/components/Button.tsx",
          to: "/project/src/services/api/api.ts",
          source: "../utils/math/math.test.ts",
          kind: "value",
          nodeKind: "Import",
          specifiers: ["calculateSum", "calculateAvg"],
        },
        {
          from: { element: { type: "component" } },
          to: { element: { type: "service" } },
        }
      );

      expect(result).toBe(true);
    });

    it("should match using entity selector with captured in from", () => {
      const result = matcher.isDependencyMatch(
        {
          from: "/project/src/modules/user/foo.ts",
          to: "/project/src/utils/math/math.test.ts",
          source: "../utils/math/math.test.ts",
          kind: "value",
          nodeKind: "Import",
          specifiers: ["calculateSum", "calculateAvg"],
        },
        {
          from: {
            element: { type: "module", captured: { moduleName: "user" } },
          },
        }
      );

      expect(result).toBe(true);
    });

    it("should support dependency selector arrays", () => {
      const dependency = {
        from: "/project/src/components/Button.tsx",
        to: "/project/node_modules/react/index.tsx",
        source: "react",
        kind: "value" as const,
        nodeKind: "ImportDeclaration",
      };

      expect(
        matcher.isDependencyMatch(dependency, {
          dependency: [{ kind: "type" }, { kind: "value" }],
        })
      ).toBe(true);

      expect(
        matcher.getDependencySelectorMatching(dependency, {
          dependency: [{ kind: "type" }, { kind: "value" }],
        })
      ).toStrictEqual({
        dependency: { kind: "value" },
      });
    });

    it("should throw an error when using invalid dependency selector", () => {
      const invalidSelector = {
        var: "baz",
      } as unknown as DependencySingleSelector;

      expect(() =>
        matcher.isDependencyMatch(
          {
            from: "/project/src/components/Button.tsx",
            to: "/project/src/utils/math/math.test.ts",
            source: "../utils/math/math.test.ts",
            kind: "value",
            nodeKind: "Import",
            specifiers: ["calculateSum", "calculateAvg"],
          },
          invalidSelector
        )
      ).toThrow();
    });

    it("should throw an error when using invalid dependency description in getDependencySelectorMatchingDescription", () => {
      expect(() =>
        matcher.getDependencySelectorMatchingDescription(
          // @ts-expect-error: Testing invalid description
          {},
          {
            from: { element: { types: "component" } },
            to: { element: { types: "foo" } },
          }
        )
      ).toThrow();
    });

    it("should throw an error when using invalid element selector", () => {
      const invalidSelector = {
        to: { var: "baz" },
      } as unknown as DependencySingleSelector;

      expect(() =>
        matcher.isDependencyMatch(
          {
            from: "/project/src/components/Button.tsx",
            to: "/project/src/utils/math/math.test.ts",
            source: "../utils/math/math.test.ts",
            kind: "value",
            nodeKind: "Import",
            specifiers: ["calculateSum", "calculateAvg"],
          },
          invalidSelector
        )
      ).toThrow();
    });

    it("should not call to micromatch after matching with same options", () => {
      const result = matcher.isDependencyMatch(
        {
          from: "/project/src/components/Button.tsx",
          to: "/project/src/utils/math/math.test.ts",
          source: "../utils/math/math.test.ts",
          kind: "value",
          nodeKind: "Import",
          specifiers: ["calculateSum", "calculateAvg"],
        },
        {
          from: { element: { types: "component" } },
        }
      );

      expect(micromatchSpy).toHaveBeenCalled();
      expect(result).toBe(true);

      micromatchSpy.mockClear();

      const result2 = matcher.isDependencyMatch(
        {
          from: "/project/src/components/Button.tsx",
          to: "/project/src/utils/math/math.test.ts",
          source: "../utils/math/math.test.ts",
          kind: "value",
          nodeKind: "Import",
          specifiers: ["calculateSum", "calculateAvg"],
        },
        {
          from: { element: { types: "component" } },
        }
      );

      expect(result2).toBe(true);
      expect(micromatchSpy).not.toHaveBeenCalled();
    });

    it("should call again to micromatch after clearing cache", () => {
      const result = matcher.isDependencyMatch(
        {
          from: "/project/src/components/Button.tsx",
          to: "/project/src/utils/math/math.test.ts",
          source: "../utils/math/math.test.ts",
          kind: "value",
          nodeKind: "Import",
          specifiers: ["calculateSum", "calculateAvg"],
        },
        {
          from: { element: { types: "component" } },
        }
      );

      expect(micromatchSpy).toHaveBeenCalled();
      expect(result).toBe(true);

      micromatchSpy.mockClear();

      const result2 = matcher.isDependencyMatch(
        {
          from: "/project/src/components/Button.tsx",
          to: "/project/src/utils/math/math.test.ts",
          source: "../utils/math/math.test.ts",
          kind: "value",
          nodeKind: "Import",
          specifiers: ["calculateSum", "calculateAvg"],
        },
        {
          from: { element: { types: "component" } },
        }
      );

      expect(result2).toBe(true);
      expect(micromatchSpy).not.toHaveBeenCalled();

      elements.clearCache();

      matcher.isDependencyMatch(
        {
          from: "/project/src/components/Button.tsx",
          to: "/project/src/utils/math/math.test.ts",
          source: "../utils/math/math.test.ts",
          kind: "value",
          nodeKind: "Import",
          specifiers: ["calculateSum", "calculateAvg"],
        },
        {
          from: { element: { types: "component" } },
        }
      );

      expect(micromatchSpy).toHaveBeenCalled();
    });

    it("should not call when using same selector", () => {
      const result = matcher.isDependencyMatch(
        {
          from: "/project/src/components/Button.tsx",
          to: "/project/src/components/Button.tsx",
          source: "../utils/math/math.test.ts",
          kind: "value",
          nodeKind: "Import",
          specifiers: ["calculateSum", "calculateAvg"],
        },
        {
          from: { element: { types: "component" } },
        }
      );

      expect(micromatchSpy).toHaveBeenCalled();
      expect(result).toBe(true);

      micromatchSpy.mockClear();

      const result2 = matcher.isDependencyMatch(
        {
          from: "/project/src/components/Button.tsx",
          to: "/project/src/components/Button.tsx",
          source: "../utils/math/math.test.ts",
          kind: "value",
          nodeKind: "Import",
          specifiers: ["calculateSum", "calculateAvg"],
        },
        {
          from: { element: { types: "component" } },
          to: { element: { types: "component" } }, // Same as from, it should not normalize again
        }
      );

      expect(result2).toBe(true);
      expect(micromatchSpy).not.toHaveBeenCalled();

      elements.clearCache();

      matcher.isDependencyMatch(
        {
          from: "/project/src/components/Button.tsx",
          to: "/project/src/components/Button.tsx",
          source: "../utils/math/math.test.ts",
          kind: "value",
          nodeKind: "Import",
          specifiers: ["calculateSum", "calculateAvg"],
        },
        {
          from: { element: { types: "component" } },
          to: { element: { types: "component" } },
        }
      );

      expect(micromatchSpy).toHaveBeenCalled();
    });
  });
});
