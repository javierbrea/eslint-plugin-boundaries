import { evaluate, parse } from "@humanwhocodes/momoa";

import {
  getDependencyError,
  getFiles,
  toText,
} from "@/domains/project/helpers/sketch";

import { OVERVIEW_EXAMPLE } from "./overview";

// The expected values below are copied from the page `packages/website/docs/overview.md`: `elementDescriptors` and `fileDescriptors` of its "Usage" section, which are the values of `boundaries/elements` and `boundaries/files`, and its `dependencyRulePolicies`.

/** The descriptors of the page, as the settings hold them */
const PAGE_SETTINGS = {
  "boundaries/elements": [
    { type: "controller", pattern: "controllers/*" },
    { type: "model", pattern: "models/*" },
    { type: "view", pattern: "views/*" },
    { type: "shared", pattern: "shared/*" },
  ],
  "boundaries/files": [{ category: "test", pattern: "**/*.spec.js" }],
};

/** `dependencyRulePolicies` of the page */
const PAGE_POLICIES = [
  {
    from: { element: { type: "controller" } },
    allow: {
      to: { element: { types: { anyOf: ["model", "view"] } } },
    },
  },
  {
    from: { element: { type: "view" } },
    allow: {
      to: { element: { type: "model" } },
    },
  },
  {
    disallow: {
      to: { file: { categories: "test" } },
    },
  },
  {
    from: { element: { type: "!controller" } },
    disallow: {
      to: { module: { origin: "external", source: "axios" } },
    },
  },
];

describe("OVERVIEW_EXAMPLE", () => {
  it("should have the id and the title that a picker shows", () => {
    // Assert
    expect(OVERVIEW_EXAMPLE.id).toBe("overview");
    expect(OVERVIEW_EXAMPLE.title).toBe("Overview");
  });

  it("should have the four files of the page, and no folder nodes", () => {
    // Act
    const files = getFiles(OVERVIEW_EXAMPLE.sketch);

    // Assert
    expect(files).toEqual([
      "src/controllers/controller-a/index.js",
      "src/models/model-a/index.js",
      "src/models/model-a/model-a.spec.js",
      "src/views/view-a/index.js",
    ]);
    expect(
      new Set(OVERVIEW_EXAMPLE.sketch.tree.map((node) => node.kind))
    ).toEqual(new Set(["file"]));
  });

  it("should have the six dependencies that the policies explain, grouped by file in the order of the tree", () => {
    // Act
    const { dependencies } = OVERVIEW_EXAMPLE.sketch;

    // Assert
    expect(dependencies.map(({ from }) => from)).toEqual([
      "src/controllers/controller-a/index.js",
      "src/controllers/controller-a/index.js",
      "src/models/model-a/index.js",
      "src/models/model-a/index.js",
      "src/views/view-a/index.js",
      "src/views/view-a/index.js",
    ]);
  });

  it("should have only dependencies that the sketch can hold", () => {
    // Arrange
    const { sketch } = OVERVIEW_EXAMPLE;

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
    const text = toText(OVERVIEW_EXAMPLE.sketch);

    // Assert
    expect(text).toBe(
      [
        "eslint.config.js",
        "src/controllers/controller-a/index.js",
        '  import { ModelA } from "../../models/model-a/index.js";',
        '  import { ViewA } from "../../views/view-a/index.js";',
        "src/models/model-a/index.js",
        '  import View from "../../views/view-a/index.js";',
        '  import axios from "axios";',
        "src/models/model-a/model-a.spec.js",
        "src/views/view-a/index.js",
        '  import { ModelA } from "../../models/model-a/index.js";',
        '  import { createModel } from "../../models/model-a/model-a.spec.js";',
        "",
      ].join("\n")
    );
  });

  it("should have a config whose value is the descriptors and the policies of the page, with the option that checks packages", () => {
    // Act
    const value = evaluate(
      parse(OVERVIEW_EXAMPLE.sketch.config, { mode: "json5" })
    );

    // Assert
    expect(value).toEqual({
      settings: PAGE_SETTINGS,
      rules: {
        "boundaries/dependencies": [
          2,
          { checkAllOrigins: true, policies: PAGE_POLICIES },
        ],
      },
    });
  });

  it("should keep the comments of the page in its config, and say which option is not on the page", () => {
    // Arrange
    const { config } = OVERVIEW_EXAMPLE.sketch;

    // Assert
    expect(config).toContain(
      "// Allow controllers to depend on models and views"
    );
    expect(config).toContain("// Allow views to depend on models");
    expect(config).toContain(
      "// Disallow any element from importing a test file"
    );
    expect(config).toContain("// Only controllers may use the `axios` package");
    expect(config).toContain("// Not on the page: ");
  });

  it("should write the keys that are identifiers without quotes", () => {
    // Arrange
    const { config } = OVERVIEW_EXAMPLE.sketch;

    // Assert
    expect(config).toContain("  settings: {");
    expect(config).toContain("  rules: {");
    expect(config).toContain(
      '{ type: "controller", pattern: "controllers/*" }'
    );
  });
});
