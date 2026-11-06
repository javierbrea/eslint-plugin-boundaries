import { evaluate, parse } from "@humanwhocodes/momoa";

import {
  buildTree,
  fromText,
  getFiles,
  toText,
} from "@/domains/project/helpers/sketch";

import { QUICK_START_EXAMPLE } from "./quickStart";

// The expected values below are copied from `test/browser-e2e/src/scenarios/quick-start.js`, where the e2e tests check the plugin against them. They are inlined because a relative import out of `src/` is a lint error.

/** `QUICK_START_SETTINGS` of the scenario `quick-start.js` */
const QUICK_START_SETTINGS = {
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

/** `QUICK_START_RULES` of the scenario `quick-start.js` */
const QUICK_START_RULES = {
  "boundaries/dependencies": [
    2,
    {
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
        {
          disallow: { to: { file: { categories: "test" } } },
        },
      ],
    },
  ],
};

/** `QUICK_START_FILES` of the scenario `quick-start.js` */
const QUICK_START_FILES = [
  "src/helpers/format/index.js",
  "src/components/atoms/Button/index.js",
  "src/components/atoms/Button/Button.spec.js",
  "src/components/atoms/Button/Button.css",
  "src/modules/checkout/index.js",
  "src/index.js",
];

/**
 * Compares two paths, to compare lists of them without their order.
 * @param first A path.
 * @param second Another path.
 */
function compare(first: string, second: string): number {
  return first.localeCompare(second);
}

describe("QUICK_START_EXAMPLE", () => {
  it("should have the id and the title that a picker shows", () => {
    // Assert
    expect(QUICK_START_EXAMPLE.id).toBe("quick-start");
    expect(QUICK_START_EXAMPLE.title).toBe("Quick start");
  });

  it("should have the six files of the quick start scenario", () => {
    // Act
    const files = getFiles(QUICK_START_EXAMPLE.sketch);

    // Assert
    expect([...files].sort(compare)).toEqual(
      [...QUICK_START_FILES].sort(compare)
    );
  });

  it("should have no folder nodes, because the files imply every folder", () => {
    // Act
    const kinds = QUICK_START_EXAMPLE.sketch.tree.map((node) => node.kind);

    // Assert
    expect(new Set(kinds)).toEqual(new Set(["file"]));
  });

  it("should have its tree in the order that the project pane shows", () => {
    // Arrange
    const { sketch } = QUICK_START_EXAMPLE;

    // Act
    const { sketch: sorted } = fromText(toText(sketch), sketch);

    // Assert
    expect(sketch.tree).toEqual(sorted.tree);
    expect(buildTree(sketch)).toHaveLength(1);
  });

  it("should have no dependencies yet", () => {
    // Assert
    expect(QUICK_START_EXAMPLE.sketch.dependencies).toEqual([]);
  });

  it("should have a config whose value is the settings and the rules of the scenario", () => {
    // Act
    const value = evaluate(
      parse(QUICK_START_EXAMPLE.sketch.config, { mode: "json5" })
    );

    // Assert
    expect(value).toEqual({
      settings: QUICK_START_SETTINGS,
      rules: QUICK_START_RULES,
    });
  });

  it("should keep the comment of the guide in its config", () => {
    // Assert
    expect(QUICK_START_EXAMPLE.sketch.config).toContain(
      "// No element may import a test file, whatever element it belongs to"
    );
  });

  it("should write the keys that are identifiers without quotes", () => {
    // Arrange
    const { config } = QUICK_START_EXAMPLE.sketch;

    // Assert
    expect(config).toContain("  settings: {");
    expect(config).toContain("  rules: {");
    expect(config).toContain('"boundaries/elements": [');
    expect(config).toContain('{ type: "helper", pattern: "helpers/*" }');
  });
});
