import { evaluate, parse } from "@humanwhocodes/momoa";

import {
  getDependencyError,
  getFiles,
  toText,
} from "@/domains/project/helpers/sketch";

import { POLICIES_EXAMPLE } from "./policies";

// The expected values below are copied from the page `packages/website/docs/policies/policies.mdx`: the settings of the canonical demo setup and the policies of its "Complete Example".

/** The settings of the canonical demo setup of the page */
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
    { pattern: "**/*.css", category: "style" },
  ],
};

/** The policies of the "Complete Example" of the page, where the last message is written on one line */
const PAGE_POLICIES = [
  {
    from: { element: { type: "helper" } },
    allow: { to: { element: { type: "helper" } } },
  },
  {
    from: { element: { type: "component" } },
    allow: {
      to: [
        {
          element: {
            type: "component",
            captured: { family: "{{from.element.captured.family}}" },
          },
        },
        { element: { type: "helper", captured: { family: "data" } } },
      ],
    },
  },
  {
    from: {
      element: { type: "component", captured: { family: "molecules" } },
    },
    allow: {
      to: { element: { type: "component", captured: { family: "atoms" } } },
    },
  },
  {
    from: { element: { type: "component", captured: { family: "atoms" } } },
    disallow: {
      to: { element: { type: "helper", captured: { family: "data" } } },
    },
    message: "Atom components can't import data helpers",
  },
  {
    disallow: { to: { file: { categories: "test" } } },
    message:
      "Do not import test files ({{to.file.categories}}) from production code",
  },
  {
    from: { element: { type: "module" } },
    allow: {
      to: { element: { type: ["helper", "component"] } },
    },
  },
  {
    from: { element: { type: "module" } },
    disallow: {
      to: { module: { origin: "external", source: "redux" } },
    },
    message: "Modules must not import {{to.module.source}} directly",
  },
  {
    from: {
      element: { type: "module", captured: { elementName: "page-*" } },
    },
    disallow: {
      to: { element: { type: "component", captured: { family: "!layout" } } },
    },
    message:
      "Modules with a name starting by 'page-' can only import layout components. You tried to import a component of family {{to.element.captured.family}} from a module named {{from.element.captured.elementName}}",
  },
];

describe("POLICIES_EXAMPLE", () => {
  it("should have the id and the title that a picker shows", () => {
    // Assert
    expect(POLICIES_EXAMPLE.id).toBe("policies");
    expect(POLICIES_EXAMPLE.title).toBe("Policies");
  });

  it("should have nine files, one of each kind that the policies tell apart, and no folder nodes", () => {
    // Act
    const files = getFiles(POLICIES_EXAMPLE.sketch);

    // Assert
    expect(files).toEqual([
      "src/components/atoms/atom-a/index.js",
      "src/components/atoms/atom-b/index.js",
      "src/components/layout/header/index.js",
      "src/components/molecules/molecule-a/index.js",
      "src/helpers/data/sort.js",
      "src/helpers/data/sort.spec.js",
      "src/helpers/format/index.js",
      "src/modules/checkout/index.js",
      "src/modules/page-home/index.js",
    ]);
    expect(
      new Set(POLICIES_EXAMPLE.sketch.tree.map((node) => node.kind))
    ).toEqual(new Set(["file"]));
  });

  it("should have the ten dependencies that the policies explain, grouped by file in the order of the tree", () => {
    // Act
    const { dependencies } = POLICIES_EXAMPLE.sketch;

    // Assert
    expect(dependencies.map(({ from }) => from)).toEqual([
      ...Array<string>(3).fill("src/components/atoms/atom-a/index.js"),
      ...Array<string>(2).fill("src/components/molecules/molecule-a/index.js"),
      "src/helpers/data/sort.js",
      ...Array<string>(2).fill("src/modules/checkout/index.js"),
      ...Array<string>(2).fill("src/modules/page-home/index.js"),
    ]);
  });

  it("should have only dependencies that the sketch can hold", () => {
    // Arrange
    const { sketch } = POLICIES_EXAMPLE;

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
    const text = toText(POLICIES_EXAMPLE.sketch);

    // Assert
    expect(text).toBe(
      [
        "eslint.config.js",
        "src/components/atoms/atom-a/index.js",
        '  import AtomB from "../atom-b/index.js";',
        '  import { sortAscending } from "../../../helpers/data/sort.js";',
        '  import { format } from "../../../helpers/format/index.js";',
        "src/components/atoms/atom-b/index.js",
        "src/components/layout/header/index.js",
        "src/components/molecules/molecule-a/index.js",
        '  import { sortCases } from "../../../helpers/data/sort.spec.js";',
        '  import AtomA from "../../atoms/atom-a/index.js";',
        "src/helpers/data/sort.js",
        '  import { format } from "../format/index.js";',
        "src/helpers/data/sort.spec.js",
        "src/helpers/format/index.js",
        "src/modules/checkout/index.js",
        '  import AtomA from "../../components/atoms/atom-a/index.js";',
        '  import { createStore } from "redux";',
        "src/modules/page-home/index.js",
        '  import AtomA from "../../components/atoms/atom-a/index.js";',
        '  import Header from "../../components/layout/header/index.js";',
        "",
      ].join("\n")
    );
  });

  it("should have a config whose value is the settings and the policies of the page, with the option that checks packages", () => {
    // Act
    const value = evaluate(
      parse(POLICIES_EXAMPLE.sketch.config, { mode: "json5" })
    );

    // Assert
    expect(value).toEqual({
      settings: PAGE_SETTINGS,
      rules: {
        "boundaries/dependencies": [
          2,
          {
            checkAllOrigins: true,
            default: "disallow",
            policies: PAGE_POLICIES,
          },
        ],
      },
    });
  });

  it("should keep the comments of the page in its config, and say which option is not on the page", () => {
    // Arrange
    const { config } = POLICIES_EXAMPLE.sketch;

    // Assert
    expect(config).toContain("// Disallow every dependency by default");
    expect(config).toContain(
      '// Components of family "atoms" cannot import "data" helpers'
    );
    expect(config).toContain("// No file may import a test file");
    expect(config).toContain(
      "// Modules cannot import external state libraries directly"
    );
    expect(config).toContain("// Not on the page: ");
  });

  it("should write the keys that are identifiers without quotes", () => {
    // Arrange
    const { config } = POLICIES_EXAMPLE.sketch;

    // Assert
    expect(config).toContain("  settings: {");
    expect(config).toContain("  rules: {");
    expect(config).toContain('{ type: "helper", pattern: "helpers/*"');
  });
});
