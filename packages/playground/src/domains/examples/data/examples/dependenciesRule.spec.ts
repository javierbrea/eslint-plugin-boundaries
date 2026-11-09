import { evaluate, parse } from "@humanwhocodes/momoa";

import {
  getDependencyError,
  getFiles,
  toText,
} from "@/domains/project/helpers/sketch";

import { DEPENDENCIES_RULE_EXAMPLE } from "./dependenciesRule";

// The expected values below are copied from the page `packages/website/docs/rules/dependencies.md` (the "Configuration Example" and the "Settings" of the rule), without the `import/resolver` setting.

/** The settings of the page, as it writes them */
const PAGE_SETTINGS = {
  "boundaries/elements": [
    { type: "helper", pattern: "helpers/*", capture: ["family"] },
    {
      type: "component",
      pattern: "components/*/*",
      capture: ["family", "elementName"],
    },
    { type: "module", pattern: "modules/*", capture: ["elementName"] },
  ],
  "boundaries/files": [
    { pattern: "**/*.spec.js", category: "test" },
    { pattern: "src/helpers/**/*.js", category: "util" },
    { pattern: "src/helpers/permissions/**/*.js", category: "internal" },
  ],
};

/** The rule of the "Configuration Example" of the page */
const PAGE_RULES = {
  "boundaries/dependencies": [
    2,
    {
      default: "disallow",
      policies: [
        {
          from: { element: { type: "helper" } },
          allow: {
            to: {
              element: { type: "helper" },
              file: { categories: { anyOf: ["util"], noneOf: ["internal"] } },
            },
            dependency: { kind: "value" },
          },
        },
        {
          from: { element: { type: "component" } },
          allow: {
            to: [
              {
                element: {
                  type: "component",
                  captured: { family: "{{ from.element.captured.family }}" },
                },
              },
              { element: { type: "helper", fileInternalPath: "sort.js" } },
            ],
          },
        },
        {
          from: {
            element: { type: "component", captured: { family: "molecules" } },
          },
          allow: {
            to: {
              element: { type: "component", captured: { family: "atoms" } },
            },
          },
        },
        {
          from: { element: { type: "module" } },
          allow: {
            to: { element: { type: ["helper", "component", "module"] } },
          },
        },
        {
          from: { element: { type: "*" } },
          disallow: {
            to: { file: { categories: "test" } },
          },
        },
      ],
    },
  ],
};

/** The files of the "Project structure" of the page, in the order that it lists them */
const PAGE_FILES = [
  "src/components/atoms/atom-a/index.js",
  "src/components/atoms/atom-a/AtomA.js",
  "src/components/atoms/atom-b/index.js",
  "src/components/atoms/atom-b/AtomB.js",
  "src/components/molecules/molecule-a/index.js",
  "src/components/molecules/molecule-a/MoleculeA.js",
  "src/components/molecules/molecule-b/index.js",
  "src/components/molecules/molecule-b/MoleculeB.js",
  "src/helpers/data/sort.js",
  "src/helpers/data/sort.spec.js",
  "src/helpers/data/parse.js",
  "src/helpers/permissions/roles.js",
  "src/modules/module-a/index.js",
  "src/modules/module-a/ModuleA.js",
  "src/modules/module-b/index.js",
  "src/modules/module-b/ModuleB.js",
];

/**
 * Compares two paths, to compare lists of them without their order.
 * @param first A path.
 * @param second Another path.
 */
function compare(first: string, second: string): number {
  return first.localeCompare(second);
}

describe("DEPENDENCIES_RULE_EXAMPLE", () => {
  it("should have the id and the title that a picker shows", () => {
    // Assert
    expect(DEPENDENCIES_RULE_EXAMPLE.id).toBe("dependencies-rule");
    expect(DEPENDENCIES_RULE_EXAMPLE.title).toBe("Dependencies rule");
  });

  it("should have the sixteen files of the project structure of the page, and no folder nodes", () => {
    // Act
    const files = getFiles(DEPENDENCIES_RULE_EXAMPLE.sketch);

    // Assert
    expect([...files].sort(compare)).toEqual([...PAGE_FILES].sort(compare));
    expect(
      new Set(DEPENDENCIES_RULE_EXAMPLE.sketch.tree.map((n) => n.kind))
    ).toEqual(new Set(["file"]));
  });

  it("should have the fourteen dependencies of the examples of the page, grouped by file in the order of the tree", () => {
    // Act
    const { dependencies } = DEPENDENCIES_RULE_EXAMPLE.sketch;

    // Assert
    expect(dependencies.map(({ from }) => from)).toEqual([
      ...Array<string>(6).fill("src/components/atoms/atom-a/AtomA.js"),
      "src/components/molecules/molecule-a/MoleculeA.js",
      "src/helpers/data/sort.js",
      ...Array<string>(3).fill("src/helpers/permissions/roles.js"),
      ...Array<string>(3).fill("src/modules/module-a/ModuleA.js"),
    ]);
  });

  it("should have only dependencies that the sketch can hold", () => {
    // Arrange
    const { sketch } = DEPENDENCIES_RULE_EXAMPLE;

    // Act
    const errors = sketch.dependencies.map((dependency, position) =>
      getDependencyError(
        {
          ...sketch,
          dependencies: sketch.dependencies.filter(
            (_other, index) => index !== position
          ),
        },
        dependency
      )
    );

    // Assert
    expect(errors).toEqual(sketch.dependencies.map(() => undefined));
  });

  it("should write its dependencies in text mode under their files, with their sources in full", () => {
    // Act
    const text = toText(DEPENDENCIES_RULE_EXAMPLE.sketch);

    // Assert
    expect(text).toBe(
      [
        "eslint.config.js",
        "src/components/atoms/atom-a/AtomA.js",
        '  import MoleculeA from "../../molecules/molecule-a/index.js";',
        '  import { roleHasPermissions } from "../../../helpers/permissions/roles.js";',
        '  import ModuleA from "../../../modules/module-a/index.js";',
        '  import { sortDescending } from "../../../helpers/data/sort.spec.js";',
        '  import AtomB from "../atom-b/index.js";',
        '  import { someSorter } from "../../../helpers/data/sort.js";',
        "src/components/atoms/atom-a/index.js",
        "src/components/atoms/atom-b/AtomB.js",
        "src/components/atoms/atom-b/index.js",
        "src/components/molecules/molecule-a/index.js",
        "src/components/molecules/molecule-a/MoleculeA.js",
        '  import AtomA from "../../atoms/atom-a/index.js";',
        "src/components/molecules/molecule-b/index.js",
        "src/components/molecules/molecule-b/MoleculeB.js",
        "src/helpers/data/parse.js",
        "src/helpers/data/sort.js",
        '  import { roleHasPermissions } from "../permissions/roles.js";',
        "src/helpers/data/sort.spec.js",
        "src/helpers/permissions/roles.js",
        '  import AtomA from "../../components/atoms/atom-a/index.js";',
        '  import ModuleA from "../../modules/module-a/index.js";',
        '  import { someParser } from "../data/parse.js";',
        "src/modules/module-a/index.js",
        "src/modules/module-a/ModuleA.js",
        '  import { someParser } from "../../helpers/data/parse.js";',
        '  import AtomA from "../../components/atoms/atom-a/index.js";',
        '  import ModuleB from "../module-b/index.js";',
        "src/modules/module-b/index.js",
        "src/modules/module-b/ModuleB.js",
        "",
      ].join("\n")
    );
  });

  it("should have a config whose value is the settings and the rules of the page", () => {
    // Act
    const value = evaluate(
      parse(DEPENDENCIES_RULE_EXAMPLE.sketch.config, { mode: "json5" })
    );

    // Assert
    expect(value).toEqual({ settings: PAGE_SETTINGS, rules: PAGE_RULES });
  });

  it("should keep the comments of the page in its config", () => {
    // Arrange
    const { config } = DEPENDENCIES_RULE_EXAMPLE.sketch;

    // Assert
    expect(config).toContain("// disallow all local imports by default");
    expect(config).toContain(
      '// allow only files categorized as "util" and not "internal" (array query)'
    );
    expect(config).toContain(
      '// disallow importing files categorized as "test" (file selector)'
    );
  });

  it("should write the keys that are identifiers without quotes, and leave out the resolver of the page", () => {
    // Arrange
    const { config } = DEPENDENCIES_RULE_EXAMPLE.sketch;

    // Assert
    expect(config).toContain("  settings: {");
    expect(config).toContain("  rules: {");
    expect(config).toContain('{ type: "helper", pattern: "helpers/*"');
    expect(config).not.toContain("import/resolver");
  });
});
