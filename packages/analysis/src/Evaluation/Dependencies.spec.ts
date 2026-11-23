import { Policies } from "@boundaries/policies";

import { analyzeConfig } from "../Config";
import type { ConfigPath, ProjectConfig } from "../Config";

import { evaluateDependencies } from "./Dependencies";
import type { DependenciesInput } from "./Dependencies.types";
import type {
  DependencyVerdict,
  ProjectDependency,
  ProjectDependencySyntax,
  ProjectSpecifier,
  SkipReason,
} from "./Evaluation.types";

const SETTINGS = {
  "boundaries/elements": [
    { type: "helper", pattern: "helpers/*" },
    { type: "component", pattern: "components/*/*" },
    { type: "module", pattern: "modules/*" },
  ],
  "boundaries/files": [
    { pattern: "**/*.spec.js", category: "test" },
    { pattern: "**/*.css", category: "style" },
  ],
};

const BUTTON = "src/components/atoms/Button/index.js";
const SPEC = "src/components/atoms/Button/Button.spec.js";
const STYLE = "src/components/atoms/Button/Button.css";
const FORMAT = "src/helpers/format/index.js";
const CHECKOUT = "src/modules/checkout/index.js";
const INDEX = "src/index.js";

/** The rule of the quick start: components allow helpers, modules allow components and helpers, and nobody imports a test file */
const QUICK_START_OPTIONS = {
  default: "disallow",
  policies: [
    {
      from: { element: { type: "component" } },
      allow: { to: { element: { type: "helper" } } },
    },
    {
      from: { element: { type: "module" } },
      allow: { to: { element: { types: ["component", "helper"] } } },
    },
    { disallow: { to: { file: { categories: "test" } } } },
  ],
};

const QUICK_START_RULE = [2, QUICK_START_OPTIONS];

/** The path of the options of the `dependencies` rule in the config objects of the spec */
const OPTIONS_PATH = ["rules", "boundaries/dependencies", 1] as const;

/**
 * Builds what `evaluateDependencies` is given, with the config analyzed as the analysis does and a new `Policies` instance, whose real descriptions and evaluations the tests only count.
 * @param config The config object, with the settings of the quick start unless it has its own.
 * @param dependencies The dependencies of the project.
 * @returns The input.
 */
function createInput(
  config: ProjectConfig,
  dependencies: readonly ProjectDependency[]
): DependenciesInput {
  const { settings, rule } = analyzeConfig({
    settings: config.settings ?? SETTINGS,
    rules: config.rules,
  });
  const policies = new Policies();
  jest.spyOn(policies, "describeDependency");
  jest.spyOn(policies, "evaluateDependency");
  return { dependencies, policies, settings, rule };
}

/**
 * Reads the value that a path points to in a config object.
 * @param config The config object, as written.
 * @param path The path from the root of the config object.
 * @returns The value written at the path, or `undefined` when nothing is written there.
 */
function valueAt(config: ProjectConfig, path: ConfigPath): unknown {
  return path.reduce<unknown>(
    (value, key) =>
      (value as Record<string | number, unknown> | undefined)?.[key],
    config
  );
}

/**
 * Builds a dependency on a file of the project.
 * @param from The file that has it.
 * @param to The file it points to.
 * @param source The source its statement writes.
 * @returns The dependency, an `import` of a value with no names.
 */
function dependencyOn(
  from: string,
  to: string,
  source: string
): ProjectDependency {
  return {
    from,
    target: { kind: "file", path: to },
    syntax: "import",
    importKind: "value",
    specifiers: [],
    source,
  };
}

/**
 * Builds a dependency on a module outside the project, whose statement writes its name as the source.
 * @param from The file that has it.
 * @param name The name of the module.
 * @returns The dependency, an `import` of a value with no names.
 */
function dependencyOnModule(from: string, name: string): ProjectDependency {
  return {
    from,
    target: { kind: "external", name },
    syntax: "import",
    importKind: "value",
    specifiers: [],
    source: name,
  };
}

/**
 * Evaluates one dependency with a rule.
 * @param rule The entry of the `dependencies` rule.
 * @param dependency The dependency.
 * @param settings The settings, when they are not those of the quick start.
 * @returns Its verdict.
 */
function verdictOf(
  rule: unknown,
  dependency: ProjectDependency,
  settings?: object
): DependencyVerdict {
  const [result] = evaluateDependencies(
    createInput({ settings, rules: { "boundaries/dependencies": rule } }, [
      dependency,
    ])
  );
  return result.verdict;
}

/**
 * Writes the entry of a rule that allows everything except what a policy disallows.
 * @param disallow The `disallow` selector of the only policy.
 * @param options What else the options hold.
 * @returns The entry of the rule.
 */
function disallowing(disallow: object, options: object = {}): [number, object] {
  return [2, { default: "allow", policies: [{ disallow }], ...options }];
}

/**
 * Lists the sources that `describeDependency` of the instance of an input received, in the order it received them.
 * @param input The input, as `createInput` builds it.
 * @param input.policies
 * @returns The sources.
 */
function describedSources({ policies }: DependenciesInput): string[] {
  return jest
    .mocked(policies.describeDependency)
    .mock.calls.map(([, { source }]) => source);
}

/** The verdict of a dependency that a policy allowed */
type AllowedVerdict = Extract<DependencyVerdict, { status: "allowed" }>;

/** The verdict of a dependency that a policy disallowed */
type DisallowedVerdict = Extract<DependencyVerdict, { status: "disallowed" }>;

/** The dependency of a helper on a component, which no policy of the quick start allows */
const HELPER_ON_COMPONENT = dependencyOn(
  FORMAT,
  BUTTON,
  "../../components/atoms/Button/index.js"
);

/** The dependency of a module on a helper that the policies of the specifier cases decide */
const MODULE_ON_HELPER = dependencyOn(
  CHECKOUT,
  FORMAT,
  "../../helpers/format/index.js"
);

/** The dependency of a module on a component */
const MODULE_ON_COMPONENT = dependencyOn(
  CHECKOUT,
  BUTTON,
  "../../components/atoms/Button/index.js"
);

/** The dependency of a component on a helper */
const COMPONENT_ON_HELPER = dependencyOn(
  BUTTON,
  FORMAT,
  "../../../helpers/format/index.js"
);

/** The dependency of a module on a test file */
const MODULE_ON_TEST = dependencyOn(
  CHECKOUT,
  SPEC,
  "../../components/atoms/Button/Button.spec.js"
);

/** The dependency of a component on a style file of its own element */
const COMPONENT_ON_STYLE = dependencyOn(BUTTON, STYLE, "./Button.css");

/** The dependency of a test file on the component of its own element */
const TEST_ON_COMPONENT = dependencyOn(SPEC, BUTTON, "./index.js");

/** The dependency of a file that matches no element and no category on a module */
const INDEX_ON_MODULE = dependencyOn(
  INDEX,
  CHECKOUT,
  "./modules/checkout/index.js"
);

/** The dependency of a component on a file that matches no element and no category */
const COMPONENT_ON_INDEX = dependencyOn(BUTTON, INDEX, "../../../index.js");

/** The dependency of a module on `react` */
const MODULE_ON_REACT = dependencyOnModule(CHECKOUT, "react");

/** The selector of the helper that the module imports */
const TO_HELPER = { element: { type: "helper" } };

describe("Dependencies", () => {
  describe("evaluateDependencies", () => {
    describe("with the rule of the quick start", () => {
      it("should return a result for every dependency, in the order of the input, with the dependency itself", () => {
        // Arrange
        const dependencies = [
          HELPER_ON_COMPONENT,
          MODULE_ON_HELPER,
          COMPONENT_ON_HELPER,
        ];
        const input = createInput(
          { rules: { "boundaries/dependencies": QUICK_START_RULE } },
          dependencies
        );

        // Act
        const results = evaluateDependencies(input);

        // Assert
        expect(
          results.map(
            ({ dependency }, index) => dependency === dependencies[index]
          )
        ).toEqual([true, true, true]);
      });

      it("should number the dependencies of each file from 0, in the order of the input", () => {
        // Arrange
        const input = createInput(
          { rules: { "boundaries/dependencies": QUICK_START_RULE } },
          [
            MODULE_ON_COMPONENT,
            HELPER_ON_COMPONENT,
            MODULE_ON_HELPER,
            COMPONENT_ON_HELPER,
            MODULE_ON_TEST,
          ]
        );

        // Act
        const results = evaluateDependencies(input);

        // Assert
        expect(results.map(({ ref }) => [ref.path, ref.index])).toEqual([
          [CHECKOUT, 0],
          [FORMAT, 0],
          [CHECKOUT, 1],
          [BUTTON, 0],
          [CHECKOUT, 2],
        ]);
      });

      it("should describe each dependency with the source its statement writes, which the input gives", () => {
        // Arrange
        const input = createInput(
          { rules: { "boundaries/dependencies": QUICK_START_RULE } },
          [MODULE_ON_COMPONENT, COMPONENT_ON_STYLE, MODULE_ON_REACT]
        );

        // Act
        const results = evaluateDependencies(input);

        // Assert
        expect(describedSources(input)).toEqual([
          "../../components/atoms/Button/index.js",
          "./Button.css",
          "react",
        ]);
        expect(
          results.map(({ description }) => description?.dependency.source)
        ).toEqual([
          "../../components/atoms/Button/index.js",
          "./Button.css",
          "react",
        ]);
      });

      it.each([
        ["a component", COMPONENT_ON_HELPER, 0],
        ["a module", MODULE_ON_COMPONENT, 1],
        ["a module, a helper", MODULE_ON_HELPER, 1],
      ])(
        "should allow %s, by the policy that allows it",
        (_title, dependency, index) => {
          // Arrange
          const config = {
            rules: { "boundaries/dependencies": QUICK_START_RULE },
          };
          const input = createInput(config, [dependency]);

          // Act
          const [{ verdict }] = evaluateDependencies(input);

          // Assert
          expect(verdict).toMatchObject({
            status: "allowed",
            policy: { index },
          });

          const { policy } = verdict as AllowedVerdict;

          expect(policy).toBe(input.rule?.policies[index]);
          expect(policy.path).toEqual([...OPTIONS_PATH, "policies", index]);
          expect(valueAt(config, policy.path)).toEqual(
            QUICK_START_OPTIONS.policies[index]
          );
        }
      );

      it("should disallow a dependency that no policy decides by the default, with the message of the plugin", () => {
        // Arrange
        const config = {
          rules: { "boundaries/dependencies": QUICK_START_RULE },
        };
        const input = createInput(config, [HELPER_ON_COMPONENT]);

        // Act
        const [{ verdict }] = evaluateDependencies(input);

        // Assert
        expect(verdict).toEqual({
          status: "disallowed",
          policy: { index: null, path: [...OPTIONS_PATH, "default"] },
          message:
            'There is no policy allowing dependencies from elements of type "helper" to elements of type "component"',
          level: "error",
        });

        const { policy } = verdict as DisallowedVerdict;

        expect(policy).toBe(input.rule?.defaultPolicy);
        expect(valueAt(config, policy!.path)).toBe("disallow");
      });

      it("should disallow a dependency to a test file by the last policy", () => {
        // Arrange
        const input = createInput(
          { rules: { "boundaries/dependencies": QUICK_START_RULE } },
          [MODULE_ON_TEST]
        );

        // Act
        const [{ verdict }] = evaluateDependencies(input);

        // Assert
        expect(verdict).toMatchObject({
          status: "disallowed",
          policy: { index: 2 },
          message:
            'Dependencies to file of category "test" are not allowed. Denied by policy at index 2',
        });
      });
    });

    describe("when the rule skips the dependency", () => {
      it.each<[SkipReason, string, ProjectDependency, object | undefined]>([
        [
          "from-ignored",
          "the file is ignored",
          TEST_ON_COMPONENT,
          { ...SETTINGS, "boundaries/ignore": ["**/*.spec.js"] },
        ],
        [
          "from-unknown",
          "the file matches no element and no category",
          INDEX_ON_MODULE,
          undefined,
        ],
        [
          "to-ignored",
          "the target is ignored",
          MODULE_ON_TEST,
          { ...SETTINGS, "boundaries/ignore": ["**/*.spec.js"] },
        ],
        [
          "not-local",
          "the target is a module outside the project",
          MODULE_ON_REACT,
          undefined,
        ],
        [
          "unknown-local",
          "the target is a local file that matches no element and no category",
          COMPONENT_ON_INDEX,
          undefined,
        ],
        [
          "internal",
          "both files are of the same element",
          COMPONENT_ON_STYLE,
          undefined,
        ],
      ])(
        "should not check it for the reason %s: %s",
        (reason, _title, dependency, settings) => {
          // Act
          const verdict = verdictOf(QUICK_START_RULE, dependency, settings);

          // Assert
          expect(verdict).toEqual({ status: "not-checked", reason });
        }
      );

      it.each([
        ["checkAllOrigins", { checkAllOrigins: true }, MODULE_ON_REACT],
        [
          "checkUnknownLocals",
          { checkUnknownLocals: true },
          COMPONENT_ON_INDEX,
        ],
        ["checkInternals", { checkInternals: true }, COMPONENT_ON_STYLE],
      ])(
        "should check it with the option %s",
        (_option, options, dependency) => {
          // Act
          const verdict = verdictOf(
            [2, { ...QUICK_START_OPTIONS, ...options }],
            dependency
          );

          // Assert
          expect(verdict.status).toBe("disallowed");
        }
      );
    });

    describe("when boundaries/dependency-nodes leaves out the syntax", () => {
      const NODES_SETTINGS = {
        ...SETTINGS,
        "boundaries/dependency-nodes": ["import"],
      };

      it.each<[ProjectDependencySyntax]>([
        ["require"],
        ["dynamic-import"],
        ["export-from"],
      ])(
        "should not check a dependency of the syntax %s as not read",
        (syntax) => {
          // Act
          const verdict = verdictOf(
            QUICK_START_RULE,
            { ...HELPER_ON_COMPONENT, syntax },
            NODES_SETTINGS
          );

          // Assert
          expect(verdict).toEqual({
            status: "not-checked",
            reason: "not-read",
          });
        }
      );

      it("should check a dependency of a syntax it keeps", () => {
        // Act
        const verdict = verdictOf(
          QUICK_START_RULE,
          HELPER_ON_COMPONENT,
          NODES_SETTINGS
        );

        // Assert
        expect(verdict.status).toBe("disallowed");
      });

      it("should not read an import when only the other syntaxes are selected", () => {
        // Act
        const verdict = verdictOf(QUICK_START_RULE, HELPER_ON_COMPONENT, {
          ...SETTINGS,
          "boundaries/dependency-nodes": ["require", "export"],
        });

        // Assert
        expect(verdict).toEqual({ status: "not-checked", reason: "not-read" });
      });

      it("should not read it before the rule skips it for its own reason", () => {
        // Act
        const verdict = verdictOf(
          QUICK_START_RULE,
          { ...INDEX_ON_MODULE, syntax: "require" },
          NODES_SETTINGS
        );

        // Assert
        expect(verdict).toEqual({ status: "not-checked", reason: "not-read" });
      });

      it("should read the syntaxes that the setting selects", () => {
        // Arrange
        const dependencies: ProjectDependency[] = [
          { ...HELPER_ON_COMPONENT, syntax: "import" },
          { ...HELPER_ON_COMPONENT, syntax: "export-from" },
          { ...HELPER_ON_COMPONENT, syntax: "require" },
          { ...HELPER_ON_COMPONENT, syntax: "dynamic-import" },
        ];
        const input = createInput(
          {
            settings: {
              ...SETTINGS,
              "boundaries/dependency-nodes": [
                "require",
                "dynamic-import",
                "export",
              ],
            },
            rules: { "boundaries/dependencies": QUICK_START_RULE },
          },
          dependencies
        );

        // Act
        const results = evaluateDependencies(input);

        // Assert
        expect(results.map(({ verdict }) => verdict.status)).toEqual([
          "not-checked",
          "disallowed",
          "disallowed",
          "disallowed",
        ]);
      });
    });

    describe("when boundaries/additional-dependency-nodes has selectors", () => {
      // With these nodes ESLint 9.39.5 reports the `import` of a helper file and not its `require()` call, which it never visits: the selector of the additional node is not one that reads a `require()` call, whatever its name is (measured on 2026-11-06 with the workspace build of `@boundaries/eslint-plugin` 7.4.2)
      const OTHER_SELECTOR_SETTINGS = {
        ...SETTINGS,
        "boundaries/dependency-nodes": ["import"],
        "boundaries/additional-dependency-nodes": [
          {
            selector: "CallExpression[callee.name='jest.mock'] > Literal",
            kind: "value",
            name: "require",
          },
        ],
      };

      it("should not read a syntax through an additional selector that has the name of its node kind but is not a built-in one", () => {
        // Act
        const verdict = verdictOf(
          QUICK_START_RULE,
          { ...HELPER_ON_COMPONENT, syntax: "require" },
          OTHER_SELECTOR_SETTINGS
        );

        // Assert
        expect(verdict).toEqual({ status: "not-checked", reason: "not-read" });
      });

      it("should keep reading the syntaxes that the setting selects", () => {
        // Act
        const verdict = verdictOf(
          QUICK_START_RULE,
          HELPER_ON_COMPONENT,
          OTHER_SELECTOR_SETTINGS
        );

        // Assert
        expect(verdict.status).toBe("disallowed");
      });

      it.each<[ProjectDependencySyntax, string, string, "value" | "type"]>([
        [
          "import",
          "ImportDeclaration:not([importKind=type]) > Literal",
          "import",
          "value",
        ],
        [
          "export-from",
          "ExportNamedDeclaration:not([exportKind=type]) > Literal",
          "export",
          "value",
        ],
        [
          "require",
          "CallExpression[callee.name=require] > Literal",
          "require",
          "value",
        ],
        [
          "require",
          "TSImportEqualsDeclaration[importKind=type] > TSExternalModuleReference > Literal",
          "require",
          "type",
        ],
        [
          "dynamic-import",
          "ImportExpression > Literal",
          "dynamic-import",
          "value",
        ],
      ])(
        "should read the syntax %s through a built-in selector that an additional node repeats: %s",
        (syntax, selector, nodeName, importKind) => {
          // Arrange
          const settings = {
            ...SETTINGS,
            "boundaries/dependency-nodes": [],
            "boundaries/additional-dependency-nodes": [
              { selector, kind: "value", name: nodeName },
            ],
          };

          // Act
          const verdict = verdictOf(
            QUICK_START_RULE,
            { ...HELPER_ON_COMPONENT, syntax, importKind },
            settings
          );

          // Assert
          expect(verdict.status).toBe("disallowed");
        }
      );

      it("should read only the syntax of the built-in selector that an additional node repeats", () => {
        // Arrange
        const input = createInput(
          {
            settings: {
              ...SETTINGS,
              "boundaries/dependency-nodes": [],
              "boundaries/additional-dependency-nodes": [
                {
                  selector: "CallExpression[callee.name=require] > Literal",
                  kind: "value",
                  name: "require",
                },
              ],
            },
            rules: { "boundaries/dependencies": QUICK_START_RULE },
          },
          [
            { ...HELPER_ON_COMPONENT, syntax: "import" },
            { ...HELPER_ON_COMPONENT, syntax: "export-from" },
            { ...HELPER_ON_COMPONENT, syntax: "require" },
            { ...HELPER_ON_COMPONENT, syntax: "dynamic-import" },
          ]
        );

        // Act
        const results = evaluateDependencies(input);

        // Assert
        expect(results.map(({ verdict }) => verdict.status)).toEqual([
          "not-checked",
          "not-checked",
          "disallowed",
          "not-checked",
        ]);
      });

      // ESLint 9.39.5 checks the `require()` call through a node with the built-in selector of `require()` and another name or no name, with `dependency-nodes: []`, and reports the name of that node as the `nodeKind` (measured on 2026-11-23 with the workspace build of `@boundaries/eslint-plugin` 7.4.4)
      it.each([
        ["another name", { name: "custom" }, "custom"],
        ["no name", {}, null],
      ])(
        "should read a syntax through a built-in selector that an additional node gives %s, and describe it with that name",
        (_title, name, nodeKind) => {
          // Arrange
          const input = createInput(
            {
              settings: {
                ...SETTINGS,
                "boundaries/dependency-nodes": [],
                "boundaries/additional-dependency-nodes": [
                  {
                    selector: "CallExpression[callee.name=require] > Literal",
                    kind: "value",
                    ...name,
                  },
                ],
              },
              rules: { "boundaries/dependencies": QUICK_START_RULE },
            },
            [{ ...HELPER_ON_COMPONENT, syntax: "require" }]
          );

          // Act
          const [{ description, verdict }] = evaluateDependencies(input);

          // Assert
          expect(verdict.status).toBe("disallowed");
          expect(description?.dependency.nodeKind).toBe(nodeKind);
        }
      );
    });

    describe("when the nodes read only one import kind of a syntax", () => {
      // ESLint 9.39.5 checks no `import type`, `export type … from`, `import type x = require()` nor `typeof import()` through the value selector of its syntax alone, and no value `import` through the type selector alone (measured on 2026-11-23 with the workspace build of `@boundaries/eslint-plugin` 7.4.4)
      it.each<[ProjectDependencySyntax, string, string]>([
        [
          "import",
          "ImportDeclaration:not([importKind=type]) > Literal",
          "import",
        ],
        [
          "export-from",
          "ExportNamedDeclaration:not([exportKind=type]) > Literal",
          "export",
        ],
        ["require", "CallExpression[callee.name=require] > Literal", "require"],
        ["dynamic-import", "ImportExpression > Literal", "dynamic-import"],
      ])(
        "should not read a type dependency of the syntax %s that only the value selector %s reads, nor describe it, and read the value one",
        (syntax, selector, nodeName) => {
          // Arrange
          const input = createInput(
            {
              settings: {
                ...SETTINGS,
                "boundaries/dependency-nodes": [],
                "boundaries/additional-dependency-nodes": [
                  { selector, kind: "value", name: nodeName },
                ],
              },
              rules: { "boundaries/dependencies": QUICK_START_RULE },
            },
            [
              { ...HELPER_ON_COMPONENT, syntax, importKind: "value" },
              { ...HELPER_ON_COMPONENT, syntax, importKind: "type" },
            ]
          );

          // Act
          const results = evaluateDependencies(input);

          // Assert
          expect(results.map(({ verdict }) => verdict)).toEqual([
            expect.objectContaining({ status: "disallowed" }),
            { status: "not-checked", reason: "not-read" },
          ]);
          expect(
            results.map(({ description }) => description !== undefined)
          ).toEqual([true, false]);
          expect(input.policies.describeDependency).toHaveBeenCalledTimes(1);
          expect(input.policies.evaluateDependency).toHaveBeenCalledTimes(1);
        }
      );

      it.each<[ProjectDependencySyntax, string, string]>([
        ["import", "ImportDeclaration[importKind=type] > Literal", "import"],
        [
          "export-from",
          "ExportNamedDeclaration[exportKind=type] > Literal",
          "export",
        ],
        [
          "require",
          "TSImportEqualsDeclaration[importKind=type] > TSExternalModuleReference > Literal",
          "require",
        ],
        [
          "dynamic-import",
          ":matches(TSImportType > Literal, TSImportType > TSLiteralType > Literal)",
          "dynamic-import",
        ],
      ])(
        "should not read a value dependency of the syntax %s that only the type selector %s reads, nor describe it, and read the type one",
        (syntax, selector, nodeName) => {
          // Arrange
          const input = createInput(
            {
              settings: {
                ...SETTINGS,
                "boundaries/dependency-nodes": [],
                "boundaries/additional-dependency-nodes": [
                  { selector, kind: "type", name: nodeName },
                ],
              },
              rules: { "boundaries/dependencies": QUICK_START_RULE },
            },
            [
              { ...HELPER_ON_COMPONENT, syntax, importKind: "value" },
              { ...HELPER_ON_COMPONENT, syntax, importKind: "type" },
            ]
          );

          // Act
          const results = evaluateDependencies(input);

          // Assert
          expect(results.map(({ verdict }) => verdict)).toEqual([
            { status: "not-checked", reason: "not-read" },
            expect.objectContaining({ status: "disallowed" }),
          ]);
          expect(
            results.map(({ description }) => description !== undefined)
          ).toEqual([false, true]);
          expect(input.policies.describeDependency).toHaveBeenCalledTimes(1);
        }
      );

      it("should check a type import when boundaries/dependency-nodes selects its syntax, which keeps both selectors", () => {
        // Arrange
        const input = createInput(
          {
            settings: {
              ...SETTINGS,
              "boundaries/dependency-nodes": ["import"],
            },
            rules: { "boundaries/dependencies": QUICK_START_RULE },
          },
          [{ ...HELPER_ON_COMPONENT, importKind: "type" }]
        );

        // Act
        const [{ description, verdict }] = evaluateDependencies(input);

        // Assert
        expect(verdict.status).toBe("disallowed");
        expect(description?.dependency).toMatchObject({
          kind: "type",
          nodeKind: "import",
        });
      });
    });

    describe("when an additional node repeats a built-in selector with its own name or kind", () => {
      // ESLint 9.39.5 runs the last node with a selector, and reports its name as the `nodeKind` and its kind as the `kind`, or `value` when it has none (measured on 2026-11-23 with the workspace build of `@boundaries/eslint-plugin` 7.4.4)
      const IMPORT_VALUE = "ImportDeclaration:not([importKind=type]) > Literal";

      /**
       * Writes the settings of the quick start with `boundaries/dependency-nodes: ["import"]` and additional nodes.
       * @param additional The `boundaries/additional-dependency-nodes` setting.
       * @returns The settings as written.
       */
      const withImportAnd = (additional: object[]): object => ({
        ...SETTINGS,
        "boundaries/dependency-nodes": ["import"],
        "boundaries/additional-dependency-nodes": additional,
      });

      it.each<[string, object, "value" | "type", string | null, string]>([
        [
          "another name and the kind type",
          { selector: IMPORT_VALUE, kind: "type", name: "custom" },
          "value",
          "custom",
          "type",
        ],
        [
          "the kind typeof",
          { selector: IMPORT_VALUE, kind: "typeof", name: "import" },
          "value",
          "import",
          "typeof",
        ],
        [
          "no name",
          { selector: IMPORT_VALUE, kind: "value" },
          "value",
          null,
          "value",
        ],
        [
          "no kind, which the plugin passes as value, also for a type import",
          {
            selector: "ImportDeclaration[importKind=type] > Literal",
            name: "custom",
          },
          "type",
          "custom",
          "value",
        ],
      ])(
        "should describe a dependency read through a node with %s with the name and the kind of that node",
        (_title, node, importKind, nodeKind, kind) => {
          // Arrange
          const input = createInput(
            {
              settings: withImportAnd([node]),
              rules: { "boundaries/dependencies": QUICK_START_RULE },
            },
            [{ ...MODULE_ON_HELPER, importKind }]
          );

          // Act
          const [{ description }] = evaluateDependencies(input);

          // Assert
          expect(description?.dependency.nodeKind).toBe(nodeKind);
          expect(description?.dependency.kind).toBe(kind);
        }
      );

      it("should describe a dependency through the last of two nodes with the same selector", () => {
        // Arrange
        const input = createInput(
          {
            settings: withImportAnd([
              { selector: IMPORT_VALUE, kind: "type", name: "first" },
              { selector: IMPORT_VALUE, kind: "value", name: "last" },
            ]),
            rules: { "boundaries/dependencies": QUICK_START_RULE },
          },
          [MODULE_ON_HELPER]
        );

        // Act
        const [{ description }] = evaluateDependencies(input);

        // Assert
        expect(description?.dependency).toMatchObject({
          kind: "value",
          nodeKind: "last",
        });
      });

      it.each([
        ["nodeKind", { nodeKind: "custom" }],
        ["kind", { kind: "type" }],
      ])(
        "should decide a value import read through a node named custom of the kind type by a policy on its %s, which it does not match with the built-in node",
        (_title, dependency) => {
          // Arrange
          const rule = disallowing({ dependency });
          const node = { selector: IMPORT_VALUE, kind: "type", name: "custom" };

          // Act
          const overridden = verdictOf(
            rule,
            MODULE_ON_HELPER,
            withImportAnd([node])
          );
          const builtIn = verdictOf(rule, MODULE_ON_HELPER, withImportAnd([]));

          // Assert
          expect(overridden).toMatchObject({
            status: "disallowed",
            policy: { index: 0 },
          });
          expect(builtIn.status).toBe("allowed");
        }
      );
    });

    describe("with the severity of the rule", () => {
      it.each([
        [2, "error"],
        ["error", "error"],
        [1, "warning"],
        ["warn", "warning"],
      ])(
        "should disallow with the level of the severity %s: %s",
        (severity, level) => {
          // Act
          const verdict = verdictOf(
            [severity, QUICK_START_OPTIONS],
            HELPER_ON_COMPONENT
          );

          // Assert
          expect(verdict).toMatchObject({ status: "disallowed", level });
        }
      );
    });

    describe("with the default allow", () => {
      it("should allow what no policy decides, by the default", () => {
        // Arrange
        const rule = [2, { default: "allow", policies: [] }];
        const config = { rules: { "boundaries/dependencies": rule } };
        const input = createInput(config, [HELPER_ON_COMPONENT]);

        // Act
        const [{ verdict }] = evaluateDependencies(input);

        // Assert
        expect(verdict).toEqual({
          status: "allowed",
          policy: { index: null, path: [...OPTIONS_PATH, "default"] },
        });

        const { policy } = verdict as AllowedVerdict;

        expect(policy).toBe(input.rule?.defaultPolicy);
        expect(valueAt(config, policy.path)).toBe("allow");
      });
    });

    describe("with a custom message", () => {
      it("should disallow with the message rendered for the dependency", () => {
        // Arrange
        const rule = [
          2,
          {
            default: "allow",
            policies: [
              {
                disallow: { to: { file: { categories: "test" } } },
                message:
                  "Never import test files from {{ from.element.types.[0] }}s",
              },
            ],
          },
        ];

        // Act
        const verdict = verdictOf(rule, MODULE_ON_TEST);

        // Assert
        expect(verdict).toMatchObject({
          status: "disallowed",
          policy: { index: 0 },
          message: "Never import test files from modules",
        });
      });

      it("should disallow with the message of the options when the policy sets none", () => {
        // Arrange
        const rule = disallowing(
          { to: { file: { categories: "test" } } },
          { message: "Tests are private to {{ to.element.types.[0] }}s" }
        );

        // Act
        const verdict = verdictOf(rule, MODULE_ON_TEST);

        // Assert
        expect(verdict).toMatchObject({
          status: "disallowed",
          message: "Tests are private to components",
        });
      });

      it("should disallow with the error and no policy when the message fails to render", () => {
        // Arrange
        const rule = [
          2,
          {
            default: "allow",
            policies: [
              {
                disallow: { to: { file: { categories: "test" } } },
                message: "Never import {{ unknownHelper from }}",
              },
            ],
          },
        ];

        // Act
        const verdict = verdictOf(rule, MODULE_ON_TEST);

        // Assert
        expect(verdict).toEqual({
          status: "disallowed",
          policy: undefined,
          message: expect.stringMatching(
            /^The custom message "Never import \{\{ unknownHelper from \}\}" of the policy at index 0 failed to render: /
          ),
          level: "error",
        });
      });

      it("should give the level of the severity to a message that fails to render", () => {
        // Arrange
        const rule = [
          1,
          { default: "disallow", message: "{{#if}}", policies: [] },
        ];

        // Act
        const verdict = verdictOf(rule, HELPER_ON_COMPONENT);

        // Assert
        expect(verdict).toMatchObject({
          status: "disallowed",
          policy: undefined,
          message: expect.stringContaining(
            "of the rule options failed to render"
          ),
          level: "warning",
        });
      });
    });

    describe("with a custom message that renders to an empty text", () => {
      // ESLint 9.39.5 stops the lint with "Missing `message` property in report() call; add a message that describes the linting problem." when a message renders to an empty text, whether the rule or the policy sets it (measured on 2026-11-06 with the workspace build of `@boundaries/eslint-plugin` 7.4.2). A helper has no parents, so its first parent has no type
      const EMPTY = "{{from.element.parents.[0].type}}";

      it("should disallow with a message that says the rule options render it empty, and keep the policy that decided", () => {
        // Arrange
        const rule = [2, { default: "disallow", message: EMPTY, policies: [] }];

        // Act
        const verdict = verdictOf(rule, HELPER_ON_COMPONENT);

        // Assert
        expect(verdict).toEqual({
          status: "disallowed",
          policy: { index: null, path: [...OPTIONS_PATH, "default"] },
          message:
            'The custom message "{{from.element.parents.[0].type}}" of the rule options renders to an empty text for this dependency, and ESLint stops with an error when a rule reports a problem with no message.',
          level: "error",
        });
      });

      it("should disallow with a message that says the policy renders it empty, and keep that policy", () => {
        // Arrange
        const rule = [
          2,
          {
            default: "allow",
            policies: [
              {
                disallow: { to: { file: { categories: "test" } } },
                message: EMPTY,
              },
            ],
          },
        ];

        // Act
        const verdict = verdictOf(rule, MODULE_ON_TEST);

        // Assert
        expect(verdict).toEqual({
          status: "disallowed",
          policy: { index: 0, path: [...OPTIONS_PATH, "policies", 0] },
          message:
            'The custom message "{{from.element.parents.[0].type}}" of the policy at index 0 renders to an empty text for this dependency, and ESLint stops with an error when a rule reports a problem with no message.',
          level: "error",
        });
      });

      it("should name the policy that sets the message and not the rule options, which set one too", () => {
        // Arrange
        const rule = [
          2,
          {
            default: "disallow",
            message: "Never import {{ to.element.types.[0] }}",
            policies: [
              {
                disallow: { to: { file: { categories: "test" } } },
                message: EMPTY,
              },
            ],
          },
        ];

        // Act
        const verdict = verdictOf(rule, MODULE_ON_TEST);

        // Assert
        expect(verdict).toMatchObject({
          status: "disallowed",
          policy: { index: 0 },
          message:
            'The custom message "{{from.element.parents.[0].type}}" of the policy at index 0 renders to an empty text for this dependency, and ESLint stops with an error when a rule reports a problem with no message.',
        });
      });

      it("should name the rule options when the policy that decided sets no message", () => {
        // Arrange
        const rule = disallowing(
          { to: { file: { categories: "test" } } },
          { message: EMPTY }
        );

        // Act
        const verdict = verdictOf(rule, MODULE_ON_TEST);

        // Assert
        expect(verdict).toMatchObject({
          status: "disallowed",
          policy: { index: 0 },
          message: expect.stringContaining(
            "of the rule options renders to an empty text"
          ),
        });
      });

      it("should name the rule options when the default decided, even if a policy sets an empty message", () => {
        // Arrange
        const rule = [
          2,
          {
            default: "disallow",
            message: EMPTY,
            policies: [
              {
                disallow: { to: { file: { categories: "test" } } },
                message: EMPTY,
              },
            ],
          },
        ];

        // Act
        const verdict = verdictOf(rule, HELPER_ON_COMPONENT);

        // Assert
        expect(verdict).toMatchObject({
          status: "disallowed",
          policy: { index: null },
          message: expect.stringContaining(
            "of the rule options renders to an empty text"
          ),
        });
      });

      it("should give the level of the severity to the verdict", () => {
        // Arrange
        const rule = [1, { default: "disallow", message: EMPTY, policies: [] }];

        // Act
        const verdict = verdictOf(rule, HELPER_ON_COMPONENT);

        // Assert
        expect(verdict).toMatchObject({
          status: "disallowed",
          level: "warning",
          message: expect.stringContaining("renders to an empty text"),
        });
      });

      it("should keep the message of a policy that renders text, as the plugin reports it", () => {
        // Arrange
        const rule = [
          2,
          {
            default: "allow",
            message: EMPTY,
            policies: [
              {
                disallow: { to: { file: { categories: "test" } } },
                message:
                  "Never import test files from {{ from.element.types.[0] }}s",
              },
            ],
          },
        ];

        // Act
        const verdict = verdictOf(rule, MODULE_ON_TEST);

        // Assert
        expect(verdict).toMatchObject({
          status: "disallowed",
          policy: { index: 0 },
          message: "Never import test files from modules",
        });
      });

      it("should keep a message that renders only white space, which ESLint reports", () => {
        // Arrange
        const rule = [
          2,
          { default: "disallow", message: `  ${EMPTY}  `, policies: [] },
        ];

        // Act
        const verdict = verdictOf(rule, HELPER_ON_COMPONENT);

        // Assert
        expect(verdict).toMatchObject({
          status: "disallowed",
          policy: { index: null },
          message: "    ",
        });
      });

      it("should not look at the message of a dependency the rule allows", () => {
        // Arrange
        const rule = [2, { default: "allow", message: EMPTY, policies: [] }];

        // Act
        const verdict = verdictOf(rule, HELPER_ON_COMPONENT);

        // Assert
        expect(verdict).toMatchObject({ status: "allowed" });
      });
    });

    describe("with the description of the dependency that the policies match", () => {
      it.each<[string, readonly string[]]>([
        ["import", ["disallowed", "allowed", "allowed", "allowed"]],
        ["export", ["allowed", "disallowed", "allowed", "allowed"]],
        ["require", ["allowed", "allowed", "disallowed", "allowed"]],
        ["dynamic-import", ["allowed", "allowed", "allowed", "disallowed"]],
      ])(
        "should describe the four syntaxes by the node kinds import, export, require and dynamic-import: a policy on %s disallows one",
        (nodeKind, expected) => {
          // Arrange
          const rule = disallowing({ dependency: { nodeKind } });
          const input = createInput(
            { rules: { "boundaries/dependencies": rule } },
            [
              { ...MODULE_ON_HELPER, syntax: "import" },
              { ...MODULE_ON_HELPER, syntax: "export-from" },
              { ...MODULE_ON_HELPER, syntax: "require" },
              { ...MODULE_ON_HELPER, syntax: "dynamic-import" },
            ]
          );

          // Act
          const results = evaluateDependencies(input);

          // Assert
          expect(results.map(({ verdict }) => verdict.status)).toEqual(
            expected
          );
        }
      );

      it.each([
        ["type", "disallowed"],
        ["value", "allowed"],
      ] as const)(
        "should describe an import of kind %s as that kind: %s",
        (importKind, expected) => {
          // Arrange
          const rule = disallowing({ dependency: { kind: "type" } });

          // Act
          const verdict = verdictOf(rule, { ...MODULE_ON_HELPER, importKind });

          // Assert
          expect(verdict.status).toBe(expected);
        }
      );

      it.each([
        ["../../helpers/*/index.js", "disallowed"],
        ["../../helpers/*", "allowed"],
        ["./format", "allowed"],
        ["src/helpers/**", "allowed"],
      ])(
        "should describe the source as the statement writes it, matched by %s: %s",
        (source, expected) => {
          // Arrange
          const rule = disallowing({ dependency: { source } });

          // Act
          const verdict = verdictOf(rule, MODULE_ON_HELPER);

          // Assert
          expect(verdict.status).toBe(expected);
        }
      );

      it("should describe the source that the input gives, also when it is not the full path from the file to its target", () => {
        // Arrange
        const rule = disallowing({ dependency: { source: "../../helpers/*" } });
        const input = createInput(
          { rules: { "boundaries/dependencies": rule } },
          [{ ...MODULE_ON_HELPER, source: "../../helpers/format" }]
        );

        // Act
        const [{ description, verdict }] = evaluateDependencies(input);

        // Assert
        expect(describedSources(input)).toEqual(["../../helpers/format"]);
        expect(description?.dependency.source).toBe("../../helpers/format");
        expect(verdict.status).toBe("disallowed");
      });

      it.each([
        ["react", "external"],
        ["node:fs", "core"],
      ])(
        "should describe an external target by the source its statement writes: %s is of the origin %s, and a file of the project is local",
        (moduleName, moduleOrigin) => {
          // Arrange
          const rule = disallowing(
            { to: { module: { origin: moduleOrigin } } },
            { checkAllOrigins: true }
          );
          const input = createInput(
            { rules: { "boundaries/dependencies": rule } },
            [MODULE_ON_HELPER, dependencyOnModule(CHECKOUT, moduleName)]
          );

          // Act
          const results = evaluateDependencies(input);

          // Assert
          expect(results.map(({ verdict }) => verdict.status)).toEqual([
            "allowed",
            "disallowed",
          ]);
        }
      );
    });

    describe("with the specifiers that the plugin reads from the code", () => {
      const named = (imported: string, alias?: string): ProjectSpecifier => ({
        kind: "named",
        name: imported,
        ...(alias === undefined ? {} : { alias }),
      });

      it.each<[string, Partial<ProjectDependency>, string, string]>([
        [
          "the imported name of a named import, and not its alias",
          { specifiers: [named("round", "r")] },
          "round",
          "disallowed",
        ],
        [
          "not the alias of a named import",
          { specifiers: [named("round", "r")] },
          "r",
          "allowed",
        ],
        [
          "every named import of a statement",
          {
            specifiers: [
              { kind: "default", name: "format" },
              named("round"),
              named("floor", "f"),
            ],
          },
          "floor",
          "disallowed",
        ],
        [
          "not a default import",
          { specifiers: [{ kind: "default", name: "round" }] },
          "round",
          "allowed",
        ],
        [
          "not a namespace import",
          { specifiers: [{ kind: "namespace", name: "round" }] },
          "round",
          "allowed",
        ],
        [
          "none for an import with no names",
          { specifiers: [] },
          "*",
          "allowed",
        ],
        [
          "the exported name of an export from, which is its alias when it has one",
          { syntax: "export-from", specifiers: [named("round", "y")] },
          "y",
          "disallowed",
        ],
        [
          "not the name of an export from that has an alias",
          { syntax: "export-from", specifiers: [named("round", "y")] },
          "round",
          "allowed",
        ],
        [
          "the name of an export from that has no alias",
          { syntax: "export-from", specifiers: [named("round")] },
          "round",
          "disallowed",
        ],
        [
          "the default export of an export from",
          { syntax: "export-from", specifiers: [named("default")] },
          "default",
          "disallowed",
        ],
        [
          "not the namespace of an export from",
          {
            syntax: "export-from",
            specifiers: [{ kind: "namespace", name: "round" }],
          },
          "round",
          "allowed",
        ],
        [
          "none for an export from everything",
          { syntax: "export-from", specifiers: [] },
          "*",
          "allowed",
        ],
        [
          "none for a require",
          { syntax: "require", specifiers: [named("round")] },
          "round",
          "allowed",
        ],
        [
          "none for a dynamic import",
          { syntax: "dynamic-import", specifiers: [named("round")] },
          "round",
          "allowed",
        ],
      ])("should read %s", (_title, overrides, pattern, expected) => {
        // Arrange
        const rule = disallowing({
          to: TO_HELPER,
          dependency: { specifiers: pattern },
        });

        // Act
        const verdict = verdictOf(rule, { ...MODULE_ON_HELPER, ...overrides });

        // Assert
        expect(verdict.status).toBe(expected);
      });
    });

    describe("with the description of each dependency", () => {
      /** What the plugin describes of the helper that the checkout module imports, with the settings of the quick start */
      const FORMAT_AS_HELPER = {
        element: {
          types: ["helper"],
          path: "src/helpers/format",
          fileInternalPath: "index.js",
          captured: null,
          parents: [],
          isIgnored: false,
          isUnknown: false,
        },
        file: {
          categories: null,
          path: FORMAT,
          captured: null,
          isIgnored: false,
          isUnknown: true,
        },
        module: { origin: "local", source: null, internalPath: null },
      };

      it("should give each result the description of the dependency, as the plugin describes it", () => {
        // Arrange
        const input = createInput(
          { rules: { "boundaries/dependencies": QUICK_START_RULE } },
          [MODULE_ON_HELPER]
        );

        // Act
        const [{ description }] = evaluateDependencies(input);

        // Assert
        expect(description).toEqual({
          to: FORMAT_AS_HELPER,
          dependency: {
            kind: "value",
            nodeKind: "import",
            source: "../../helpers/format/index.js",
            specifiers: [],
            relationship: { from: null, to: null },
          },
        });
      });

      it.each<[string, Partial<ProjectDependency>, readonly string[]]>([
        [
          "the imported name of a named import, and not its alias",
          { specifiers: [{ kind: "named", name: "round", alias: "r" }] },
          ["round"],
        ],
        [
          "only the named imports of a statement",
          {
            specifiers: [
              { kind: "default", name: "format" },
              { kind: "named", name: "round" },
              { kind: "namespace", name: "all" },
            ],
          },
          ["round"],
        ],
        [
          "the exported name of an export from, which is its alias when it has one",
          {
            syntax: "export-from",
            specifiers: [
              { kind: "named", name: "round", alias: "y" },
              { kind: "named", name: "floor" },
            ],
          },
          ["y", "floor"],
        ],
        ["none for a require", { syntax: "require" }, []],
        ["none for an import with no names", { specifiers: [] }, []],
      ])(
        "should describe the specifiers as the plugin reads them: %s",
        (_title, overrides, expected) => {
          // Arrange
          const input = createInput(
            { rules: { "boundaries/dependencies": QUICK_START_RULE } },
            [{ ...MODULE_ON_HELPER, ...overrides }]
          );

          // Act
          const [{ description }] = evaluateDependencies(input);

          // Assert
          expect(description?.dependency.specifiers).toEqual(expected);
        }
      );

      it.each([
        ["import", "import"],
        ["export-from", "export"],
        ["require", "require"],
        ["dynamic-import", "dynamic-import"],
      ] as const)(
        "should describe the syntax %s as the node kind %s",
        (syntax, nodeKind) => {
          // Arrange
          const input = createInput(
            { rules: { "boundaries/dependencies": QUICK_START_RULE } },
            [{ ...MODULE_ON_HELPER, syntax }]
          );

          // Act
          const [{ description }] = evaluateDependencies(input);

          // Assert
          expect(description?.dependency.nodeKind).toBe(nodeKind);
        }
      );

      it.each(["value", "type"] as const)(
        "should describe an import of kind %s with that kind",
        (importKind) => {
          // Arrange
          const input = createInput(
            { rules: { "boundaries/dependencies": QUICK_START_RULE } },
            [{ ...MODULE_ON_HELPER, importKind }]
          );

          // Act
          const [{ description }] = evaluateDependencies(input);

          // Assert
          expect(description?.dependency.kind).toBe(importKind);
        }
      );

      it("should describe a dependency on an external module by the module, with no element and no file", () => {
        // Arrange
        const input = createInput(
          { rules: { "boundaries/dependencies": QUICK_START_RULE } },
          [dependencyOnModule(CHECKOUT, "react/jsx-runtime")]
        );

        // Act
        const [{ description }] = evaluateDependencies(input);

        // Assert
        expect(description?.to.module).toEqual({
          origin: "external",
          source: "react",
          internalPath: "jsx-runtime",
        });
        expect(description?.to.element).toMatchObject({
          types: null,
          path: null,
          isUnknown: true,
        });
        expect(description?.to.file).toMatchObject({
          categories: null,
          path: null,
          isUnknown: true,
        });
        expect(description?.dependency.source).toBe("react/jsx-runtime");
      });

      it("should describe a dependency that the rule skips, as the policies match it", () => {
        // Arrange
        const input = createInput(
          { rules: { "boundaries/dependencies": QUICK_START_RULE } },
          [INDEX_ON_MODULE]
        );

        // Act
        const [{ description, verdict }] = evaluateDependencies(input);

        // Assert
        expect(verdict).toEqual({
          status: "not-checked",
          reason: "from-unknown",
        });
        expect(description?.to.element.types).toEqual(["module"]);
      });

      it("should describe a dependency that the rule disallows, as it describes one that the rule allows", () => {
        // Arrange
        const input = createInput(
          { rules: { "boundaries/dependencies": QUICK_START_RULE } },
          [HELPER_ON_COMPONENT]
        );

        // Act
        const [{ description, verdict }] = evaluateDependencies(input);

        // Assert
        expect(verdict.status).toBe("disallowed");
        expect(description?.to.element.types).toEqual(["component"]);
        expect(description?.dependency.relationship).toEqual({
          from: null,
          to: null,
        });
      });

      it("should describe a dependency between elements that are related with the relationship from both sides", () => {
        // Arrange
        const nestedSettings = {
          "boundaries/elements": [
            { type: "module", pattern: "modules/*" },
            { type: "component", pattern: "components/*" },
          ],
        };
        const input = createInput(
          {
            settings: nestedSettings,
            rules: { "boundaries/dependencies": QUICK_START_RULE },
          },
          [
            dependencyOn(
              "src/modules/a/index.js",
              "src/modules/a/components/b/index.js",
              "./components/b/index.js"
            ),
            dependencyOn(
              "src/modules/a/components/b/index.js",
              "src/modules/a/index.js",
              "../../index.js"
            ),
          ]
        );

        // Act
        const results = evaluateDependencies(input);

        // Assert
        expect(
          results.map(({ description }) => description?.dependency.relationship)
        ).toEqual([
          { from: "parent", to: "child" },
          { from: "child", to: "parent" },
        ]);
      });

      it("should describe no dependency that the plugin does not read, and describe the others", () => {
        // Arrange
        const input = createInput(
          {
            settings: {
              ...SETTINGS,
              "boundaries/dependency-nodes": ["import"],
            },
            rules: { "boundaries/dependencies": QUICK_START_RULE },
          },
          [MODULE_ON_HELPER, { ...MODULE_ON_HELPER, syntax: "require" }]
        );

        // Act
        const results = evaluateDependencies(input);

        // Assert
        expect(
          results.map(({ description }) => description !== undefined)
        ).toEqual([true, false]);
        expect(results[1].verdict).toEqual({
          status: "not-checked",
          reason: "not-read",
        });
      });

      it("should describe the dependencies while none is evaluated, and not the ones that the plugin does not read", () => {
        // Arrange
        const input = createInput(
          {
            settings: {
              ...SETTINGS,
              "boundaries/dependency-nodes": ["import"],
            },
            rules: {},
          },
          [MODULE_ON_HELPER, { ...MODULE_ON_HELPER, syntax: "require" }]
        );

        // Act
        const results = evaluateDependencies(input);

        // Assert
        expect(input.rule).toBeUndefined();
        expect(results[0].description?.to).toEqual(FORMAT_AS_HELPER);
        expect(results[1].description).toBeUndefined();
        expect(results.map(({ verdict }) => verdict)).toEqual([
          { status: "not-evaluated" },
          { status: "not-evaluated" },
        ]);
      });

      describe("how many times the plugin describes a dependency", () => {
        const DEPENDENCIES = [
          MODULE_ON_HELPER,
          MODULE_ON_COMPONENT,
          HELPER_ON_COMPONENT,
        ];

        it("should describe each dependency once when it is evaluated", () => {
          // Arrange
          const input = createInput(
            { rules: { "boundaries/dependencies": QUICK_START_RULE } },
            DEPENDENCIES
          );

          // Act
          evaluateDependencies(input);

          // Assert
          expect(input.policies.describeDependency).toHaveBeenCalledTimes(3);
        });

        it("should decide each dependency with the description that it gives the result", () => {
          // Arrange
          const input = createInput(
            { rules: { "boundaries/dependencies": QUICK_START_RULE } },
            DEPENDENCIES
          );

          // Act
          const results = evaluateDependencies(input);

          // Assert
          const described = jest
            .mocked(input.policies.describeDependency)
            .mock.results.map(({ value }) => value as unknown);
          const decided = jest
            .mocked(input.policies.evaluateDependency)
            .mock.calls.map(([, , description]) => description as unknown);

          expect(decided).toHaveLength(3);
          expect(
            decided.map(
              (description, index) => description === described[index]
            )
          ).toEqual([true, true, true]);
          expect(
            results.map(({ description }) => description?.to.element.types)
          ).toEqual([["helper"], ["component"], ["component"]]);
        });

        it("should describe each dependency once when none is evaluated", () => {
          // Arrange
          const input = createInput({ rules: {} }, DEPENDENCIES);

          // Act
          evaluateDependencies(input);

          // Assert
          expect(input.policies.describeDependency).toHaveBeenCalledTimes(3);
          expect(input.policies.evaluateDependency).not.toHaveBeenCalled();
        });

        it("should not describe a dependency that the plugin does not read", () => {
          // Arrange
          const input = createInput(
            {
              settings: {
                ...SETTINGS,
                "boundaries/dependency-nodes": ["import"],
              },
              rules: { "boundaries/dependencies": QUICK_START_RULE },
            },
            [
              MODULE_ON_HELPER,
              { ...MODULE_ON_HELPER, syntax: "require" },
              { ...MODULE_ON_HELPER, syntax: "dynamic-import" },
            ]
          );

          // Act
          evaluateDependencies(input);

          // Assert
          expect(input.policies.describeDependency).toHaveBeenCalledTimes(1);
          expect(input.policies.evaluateDependency).toHaveBeenCalledTimes(1);
        });
      });
    });

    describe("while no dependency is evaluated", () => {
      it("should give every dependency the verdict not evaluated, with its place and the description of the source of the input", () => {
        // Arrange
        const dependencies = [MODULE_ON_HELPER, MODULE_ON_TEST];
        const input = createInput({ rules: {} }, dependencies);

        // Act
        const results = evaluateDependencies(input);

        // Assert
        expect(input.rule).toBeUndefined();
        expect(results).toEqual([
          {
            dependency: dependencies[0],
            ref: { path: CHECKOUT, index: 0 },
            description: expect.objectContaining({
              dependency: expect.objectContaining({
                source: "../../helpers/format/index.js",
              }),
            }),
            verdict: { status: "not-evaluated" },
          },
          {
            dependency: dependencies[1],
            ref: { path: CHECKOUT, index: 1 },
            description: expect.objectContaining({
              dependency: expect.objectContaining({
                source: "../../components/atoms/Button/Button.spec.js",
              }),
            }),
            verdict: { status: "not-evaluated" },
          },
        ]);
        expect(describedSources(input)).toEqual([
          "../../helpers/format/index.js",
          "../../components/atoms/Button/Button.spec.js",
        ]);
      });

      it("should return no result for a project with no dependencies", () => {
        // Arrange
        const input = createInput(
          { rules: { "boundaries/dependencies": QUICK_START_RULE } },
          []
        );

        // Act
        const results = evaluateDependencies(input);

        // Assert
        expect(results).toEqual([]);
      });
    });
  });
});
