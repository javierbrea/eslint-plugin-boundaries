import type {
  SketchDependency,
  SketchDependencySyntax,
  SketchSpecifier,
} from "@/contract";
import { DEFAULT_RESOLVERS } from "@/domains/project/helpers/sketch";

import { evaluateDependencies } from "./dependencies";
import type { DependenciesInput } from "./dependencies.types";
import { areRulesValid } from "./diagnostics";
import type {
  DependencyVerdict,
  DisallowedVerdict,
  SkipReason,
} from "./engine.types";
import { selectRule } from "./evaluatedRule";
import { normalizeConfigSafely } from "./normalizeConfigSafely";
import { parseConfig } from "./parseConfig";
import { resolveRootPath } from "./rootPath";

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

const FILES = [
  "src/components/atoms/Button/Button.css",
  "src/components/atoms/Button/Button.spec.js",
  "src/components/atoms/Button/index.js",
  "src/helpers/format/index.js",
  "src/modules/checkout/index.js",
  "src/index.js",
];

const BUTTON = "src/components/atoms/Button/index.js";
const SPEC = "src/components/atoms/Button/Button.spec.js";
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

/**
 * Builds what `evaluateDependencies` is given, with the config normalized and the rule selected as the engine does.
 * @param config The config object, with the settings of the quick start unless it has its own.
 * @param config.settings
 * @param config.rules
 * @param dependencies The dependencies of the sketch.
 * @returns The input.
 */
function createInput(
  config: { settings?: object; rules?: object },
  dependencies: readonly SketchDependency[]
): DependenciesInput {
  const settings = config.settings ?? SETTINGS;
  const text = JSON.stringify({ settings, rules: config.rules }, null, 2);
  const parsed = parseConfig(text);
  if (!parsed.parsed) {
    throw new Error("The config text should be one JSON5 object");
  }
  const { value, diagnostics } = normalizeConfigSafely(
    { settings: parsed.value.settings, rules: parsed.value.rules },
    { rootPath: resolveRootPath(parsed.value.settings) }
  );
  return {
    sketch: { config: text, tree: [], dependencies },
    paths: FILES,
    settings: value.settings,
    rule: selectRule({
      config: parsed,
      rules: value.rules,
      rulesValid: areRulesValid(diagnostics),
    }).rule,
    resolvers: DEFAULT_RESOLVERS,
  };
}

/**
 * Reads the text of the config that a policy of a verdict is written in.
 * @param input What the dependencies were evaluated with.
 * @param range The range of the policy of the verdict.
 * @param range.from
 * @param range.to
 * @returns The text.
 */
function readRange(
  input: DependenciesInput,
  { from, to }: { from: number; to: number }
): string {
  return input.sketch.config.slice(from, to);
}

/**
 * Builds a dependency on a file of the sketch.
 * @param from The file that has it.
 * @param to The file it points to.
 * @param overrides What differs from an `import` of a value with no names.
 * @returns The dependency.
 */
function dependencyOn(
  from: string,
  to: string,
  overrides: Partial<SketchDependency> = {}
): SketchDependency {
  return {
    from,
    target: { kind: "node", path: to },
    syntax: "import",
    importKind: "value",
    specifiers: [],
    ...overrides,
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
  dependency: SketchDependency,
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

/** The verdict of a dependency that a policy allowed */
type AllowedVerdict = Extract<DependencyVerdict, { status: "allowed" }>;

/** The dependency of a module on a helper that the policies of the specifier cases decide */
const MODULE_ON_HELPER = dependencyOn(CHECKOUT, FORMAT);

/** The selector of the helper that the module imports */
const TO_HELPER = { element: { type: "helper" } };

describe("Dependencies", () => {
  describe("evaluateDependencies", () => {
    describe("with the rule of the quick start", () => {
      it("should return a result for every dependency, in the order of the sketch, with the dependency itself", () => {
        // Arrange
        const dependencies = [
          dependencyOn(FORMAT, BUTTON),
          dependencyOn(CHECKOUT, FORMAT),
          dependencyOn(BUTTON, FORMAT),
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

      it("should number the dependencies of each file from 0, in the order of the sketch", () => {
        // Arrange
        const input = createInput(
          { rules: { "boundaries/dependencies": QUICK_START_RULE } },
          [
            dependencyOn(CHECKOUT, BUTTON),
            dependencyOn(FORMAT, BUTTON),
            dependencyOn(CHECKOUT, FORMAT),
            dependencyOn(BUTTON, FORMAT),
            dependencyOn(CHECKOUT, SPEC),
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

      it("should give each result the source its statement writes", () => {
        // Arrange
        const input = createInput(
          { rules: { "boundaries/dependencies": QUICK_START_RULE } },
          [
            dependencyOn(CHECKOUT, BUTTON),
            dependencyOn(BUTTON, "src/components/atoms/Button/Button.css"),
            {
              ...dependencyOn(CHECKOUT, FORMAT),
              target: { kind: "external", name: "react" },
            },
          ]
        );

        // Act
        const results = evaluateDependencies(input);

        // Assert
        expect(results.map(({ source }) => source)).toEqual([
          "../../components/atoms/Button",
          "./Button.css",
          "react",
        ]);
      });

      it.each([
        ["a component", BUTTON, FORMAT, 0],
        ["a module", CHECKOUT, BUTTON, 1],
        ["a module, a helper", CHECKOUT, FORMAT, 1],
      ])(
        "should allow %s, by the policy that allows it",
        (_title, from, to, index) => {
          // Arrange
          const input = createInput(
            { rules: { "boundaries/dependencies": QUICK_START_RULE } },
            [dependencyOn(from, to)]
          );

          // Act
          const [{ verdict }] = evaluateDependencies(input);

          // Assert
          expect(verdict).toMatchObject({
            status: "allowed",
            policy: { index },
          });
          expect(
            JSON.parse(
              readRange(input, (verdict as AllowedVerdict).policy.range)
            )
          ).toEqual(QUICK_START_OPTIONS.policies[index]);
        }
      );

      it("should disallow a dependency that no policy decides by the default, with the message of the plugin", () => {
        // Arrange
        const input = createInput(
          { rules: { "boundaries/dependencies": QUICK_START_RULE } },
          [dependencyOn(FORMAT, BUTTON)]
        );

        // Act
        const [{ verdict }] = evaluateDependencies(input);

        // Assert
        expect(verdict).toEqual({
          status: "disallowed",
          policy: { index: null, range: expect.any(Object) },
          message:
            'There is no policy allowing dependencies from elements of type "helper" to elements of type "component"',
          level: "error",
        });
        expect(
          readRange(input, (verdict as DisallowedVerdict).policy!.range)
        ).toBe('"disallow"');
      });

      it("should disallow a dependency to a test file by the last policy", () => {
        // Arrange
        const input = createInput(
          { rules: { "boundaries/dependencies": QUICK_START_RULE } },
          [dependencyOn(CHECKOUT, SPEC)]
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
      it.each<[SkipReason, string, SketchDependency, object | undefined]>([
        [
          "from-ignored",
          "the file is ignored",
          dependencyOn(SPEC, BUTTON),
          { ...SETTINGS, "boundaries/ignore": ["**/*.spec.js"] },
        ],
        [
          "from-unknown",
          "the file matches no element and no category",
          dependencyOn(INDEX, CHECKOUT),
          undefined,
        ],
        [
          "to-ignored",
          "the target is ignored",
          dependencyOn(CHECKOUT, SPEC),
          { ...SETTINGS, "boundaries/ignore": ["**/*.spec.js"] },
        ],
        [
          "not-local",
          "the target is a module outside the sketch",
          {
            ...dependencyOn(CHECKOUT, FORMAT),
            target: { kind: "external", name: "react" },
          },
          undefined,
        ],
        [
          "unknown-local",
          "the target is a local file that matches no element and no category",
          dependencyOn(BUTTON, INDEX),
          undefined,
        ],
        [
          "internal",
          "both files are of the same element",
          dependencyOn(BUTTON, "src/components/atoms/Button/Button.css"),
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
        [
          "checkAllOrigins",
          { checkAllOrigins: true },
          {
            ...dependencyOn(CHECKOUT, FORMAT),
            target: { kind: "external", name: "react" },
          },
        ],
        [
          "checkUnknownLocals",
          { checkUnknownLocals: true },
          dependencyOn(BUTTON, INDEX),
        ],
        [
          "checkInternals",
          { checkInternals: true },
          dependencyOn(BUTTON, "src/components/atoms/Button/Button.css"),
        ],
      ])(
        "should check it with the option %s",
        (_option, options, dependency) => {
          // Act
          const verdict = verdictOf(
            [2, { ...QUICK_START_OPTIONS, ...options }],
            dependency as SketchDependency
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

      it.each<[SketchDependencySyntax]>([
        ["require"],
        ["dynamic-import"],
        ["export-from"],
      ])(
        "should not check a dependency of the syntax %s as not read",
        (syntax) => {
          // Act
          const verdict = verdictOf(
            QUICK_START_RULE,
            dependencyOn(FORMAT, BUTTON, { syntax }),
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
          dependencyOn(FORMAT, BUTTON),
          NODES_SETTINGS
        );

        // Assert
        expect(verdict.status).toBe("disallowed");
      });

      it("should not read an import when only the other syntaxes are selected", () => {
        // Act
        const verdict = verdictOf(
          QUICK_START_RULE,
          dependencyOn(FORMAT, BUTTON),
          { ...SETTINGS, "boundaries/dependency-nodes": ["require", "export"] }
        );

        // Assert
        expect(verdict).toEqual({ status: "not-checked", reason: "not-read" });
      });

      it("should not read it before the rule skips it for its own reason", () => {
        // Act
        const verdict = verdictOf(
          QUICK_START_RULE,
          dependencyOn(INDEX, CHECKOUT, { syntax: "require" }),
          NODES_SETTINGS
        );

        // Assert
        expect(verdict).toEqual({ status: "not-checked", reason: "not-read" });
      });

      it("should read the syntaxes that the setting selects", () => {
        // Arrange
        const dependencies: SketchDependency[] = [
          dependencyOn(FORMAT, BUTTON, { syntax: "import" }),
          dependencyOn(FORMAT, BUTTON, { syntax: "export-from" }),
          dependencyOn(FORMAT, BUTTON, { syntax: "require" }),
          dependencyOn(FORMAT, BUTTON, { syntax: "dynamic-import" }),
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
          dependencyOn(FORMAT, BUTTON, { syntax: "require" }),
          OTHER_SELECTOR_SETTINGS
        );

        // Assert
        expect(verdict).toEqual({ status: "not-checked", reason: "not-read" });
      });

      it("should keep reading the syntaxes that the setting selects", () => {
        // Act
        const verdict = verdictOf(
          QUICK_START_RULE,
          dependencyOn(FORMAT, BUTTON),
          OTHER_SELECTOR_SETTINGS
        );

        // Assert
        expect(verdict.status).toBe("disallowed");
      });

      it.each<[SketchDependencySyntax, string, string]>([
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
        [
          "require",
          "TSImportEqualsDeclaration[importKind=type] > TSExternalModuleReference > Literal",
          "require",
        ],
        ["dynamic-import", "ImportExpression > Literal", "dynamic-import"],
      ])(
        "should read the syntax %s through a built-in selector that an additional node repeats: %s",
        (syntax, selector, nodeName) => {
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
            dependencyOn(FORMAT, BUTTON, { syntax }),
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
            dependencyOn(FORMAT, BUTTON, { syntax: "import" }),
            dependencyOn(FORMAT, BUTTON, { syntax: "export-from" }),
            dependencyOn(FORMAT, BUTTON, { syntax: "require" }),
            dependencyOn(FORMAT, BUTTON, { syntax: "dynamic-import" }),
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

      it("should not read a syntax through a built-in selector that an additional node gives another name", () => {
        // Arrange
        const settings = {
          ...SETTINGS,
          "boundaries/dependency-nodes": [],
          "boundaries/additional-dependency-nodes": [
            {
              selector: "CallExpression[callee.name=require] > Literal",
              kind: "value",
              name: "custom",
            },
          ],
        };

        // Act
        const verdict = verdictOf(
          QUICK_START_RULE,
          dependencyOn(FORMAT, BUTTON, { syntax: "require" }),
          settings
        );

        // Assert
        expect(verdict).toEqual({ status: "not-checked", reason: "not-read" });
      });
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
            dependencyOn(FORMAT, BUTTON)
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
        const input = createInput(
          { rules: { "boundaries/dependencies": rule } },
          [dependencyOn(FORMAT, BUTTON)]
        );

        // Act
        const [{ verdict }] = evaluateDependencies(input);

        // Assert
        expect(verdict).toEqual({
          status: "allowed",
          policy: { index: null, range: expect.any(Object) },
        });
        expect(readRange(input, (verdict as AllowedVerdict).policy.range)).toBe(
          '"allow"'
        );
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
        const verdict = verdictOf(rule, dependencyOn(CHECKOUT, SPEC));

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
        const verdict = verdictOf(rule, dependencyOn(CHECKOUT, SPEC));

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
        const verdict = verdictOf(rule, dependencyOn(CHECKOUT, SPEC));

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
        const verdict = verdictOf(rule, dependencyOn(FORMAT, BUTTON));

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
        const verdict = verdictOf(rule, dependencyOn(FORMAT, BUTTON));

        // Assert
        expect(verdict).toEqual({
          status: "disallowed",
          policy: { index: null, range: expect.any(Object) },
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
        const verdict = verdictOf(rule, dependencyOn(CHECKOUT, SPEC));

        // Assert
        expect(verdict).toEqual({
          status: "disallowed",
          policy: { index: 0, range: expect.any(Object) },
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
        const verdict = verdictOf(rule, dependencyOn(CHECKOUT, SPEC));

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
        const verdict = verdictOf(rule, dependencyOn(CHECKOUT, SPEC));

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
        const verdict = verdictOf(rule, dependencyOn(FORMAT, BUTTON));

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
        const verdict = verdictOf(rule, dependencyOn(FORMAT, BUTTON));

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
        const verdict = verdictOf(rule, dependencyOn(CHECKOUT, SPEC));

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
        const verdict = verdictOf(rule, dependencyOn(FORMAT, BUTTON));

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
        const verdict = verdictOf(rule, dependencyOn(FORMAT, BUTTON));

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
              dependencyOn(CHECKOUT, FORMAT, { syntax: "import" }),
              dependencyOn(CHECKOUT, FORMAT, { syntax: "export-from" }),
              dependencyOn(CHECKOUT, FORMAT, { syntax: "require" }),
              dependencyOn(CHECKOUT, FORMAT, { syntax: "dynamic-import" }),
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
          const verdict = verdictOf(
            rule,
            dependencyOn(CHECKOUT, FORMAT, { importKind })
          );

          // Assert
          expect(verdict.status).toBe(expected);
        }
      );

      it.each([
        ["../../helpers/*", "disallowed"],
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

      it.each([
        ["react", "external"],
        ["node:fs", "core"],
      ])(
        "should describe an external target by its name: %s is of the origin %s, and a file of the sketch is local",
        (moduleName, moduleOrigin) => {
          // Arrange
          const rule = disallowing(
            { to: { module: { origin: moduleOrigin } } },
            { checkAllOrigins: true }
          );
          const input = createInput(
            { rules: { "boundaries/dependencies": rule } },
            [
              MODULE_ON_HELPER,
              {
                ...MODULE_ON_HELPER,
                target: { kind: "external", name: moduleName },
              },
            ]
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
      const named = (imported: string, alias?: string): SketchSpecifier => ({
        kind: "named",
        name: imported,
        ...(alias === undefined ? {} : { alias }),
      });

      it.each<[string, Partial<SketchDependency>, string, string]>([
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

    describe("while no dependency is evaluated", () => {
      it("should give every dependency the verdict not evaluated, with its place and its source", () => {
        // Arrange
        const dependencies = [
          dependencyOn(CHECKOUT, FORMAT),
          dependencyOn(CHECKOUT, SPEC),
        ];
        const input = createInput({ rules: {} }, dependencies);

        // Act
        const results = evaluateDependencies(input);

        // Assert
        expect(input.rule).toBeUndefined();
        expect(results).toEqual([
          {
            dependency: dependencies[0],
            ref: { path: CHECKOUT, index: 0 },
            source: "../../helpers/format",
            verdict: { status: "not-evaluated" },
          },
          {
            dependency: dependencies[1],
            ref: { path: CHECKOUT, index: 1 },
            source: "../../components/atoms/Button/Button.spec",
            verdict: { status: "not-evaluated" },
          },
        ]);
      });

      it("should return no result for a sketch with no dependencies", () => {
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
