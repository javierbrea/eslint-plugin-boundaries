import { analyzeConfig, evaluateProject } from "./index";
import type { ProjectConfig, ProjectDependency } from "./index";

/**
 * The configuration of the quick-start guide of the docs.
 */
const QUICK_START_CONFIG: ProjectConfig = {
  settings: {
    "boundaries/elements": [
      { type: "helper", pattern: "helpers/*" },
      { type: "component", pattern: "components/*/*" },
      { type: "module", pattern: "modules/*" },
    ],
    "boundaries/files": [
      { pattern: "**/*.spec.js", category: "test" },
      { pattern: "**/*.css", category: "style" },
    ],
  },
  rules: {
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
  },
};

const FORMAT = "src/helpers/format/index.js";
const PRICE = "src/components/atoms/Price/index.js";
const PRICE_SPEC = "src/components/atoms/Price/Price.spec.js";
const CART = "src/modules/cart/index.js";

/** The files of the quick-start example */
const FILES = [FORMAT, PRICE, PRICE_SPEC, CART];

/**
 * Builds an `import` of a value with no names.
 * @param from The file that has it.
 * @param target What it points to.
 * @param source The source its statement writes.
 * @returns The dependency.
 */
function importOf(
  from: string,
  target: ProjectDependency["target"],
  source: string
): ProjectDependency {
  return {
    from,
    target,
    syntax: "import",
    importKind: "value",
    specifiers: [],
    source,
  };
}

/**
 * Dependencies of the quick-start example: a helper importing a component, a component importing a helper, a module importing a test file, and a component importing an external package.
 */
const DEPENDENCIES = [
  importOf(
    FORMAT,
    { kind: "file", path: PRICE },
    "../../components/atoms/Price"
  ),
  importOf(PRICE, { kind: "file", path: FORMAT }, "../../../helpers/format"),
  importOf(
    CART,
    { kind: "file", path: PRICE_SPEC },
    "../../components/atoms/Price/Price.spec"
  ),
  importOf(PRICE, { kind: "external", name: "react" }, "react"),
];

const OPTIONS_PATH = ["rules", "boundaries/dependencies", 1];

describe("analysis", () => {
  it("should expose only analyzeConfig and evaluateProject as values", async () => {
    // Act
    const names = Object.keys(await import("./index"));

    // Assert
    expect(new Set(names)).toEqual(
      new Set(["analyzeConfig", "evaluateProject"])
    );
  });

  describe("analyzeConfig", () => {
    it("should select the rule of the quick-start guide and summarize its policies", () => {
      // Act
      const { rulesValid, notEvaluated, policies } =
        analyzeConfig(QUICK_START_CONFIG);

      // Assert
      expect(rulesValid).toBe(true);
      expect(notEvaluated).toBeUndefined();
      expect(
        policies.map(({ action, from, to }) => [action, from, to])
      ).toEqual([
        ["allow", ["component"], ["helper"]],
        ["allow", ["module"], ["component", "helper"]],
        ["disallow", [], ["test"]],
        ["disallow", [], []],
      ]);
    });
  });

  describe("evaluateProject", () => {
    it("should describe the files of the quick-start example", () => {
      // Arrange
      const configAnalysis = analyzeConfig(QUICK_START_CONFIG);

      // Act
      const { files } = evaluateProject(configAnalysis, {
        files: FILES,
        dependencies: DEPENDENCIES,
      });

      // Assert
      expect(
        [...files].map(([path, { element, file }]) => [
          path,
          element.types,
          file.categories,
        ])
      ).toEqual([
        [FORMAT, ["helper"], null],
        [PRICE, ["component"], null],
        [PRICE_SPEC, ["component"], ["test"]],
        [CART, ["module"], null],
      ]);
    });

    it("should report what the plugin reports for the dependencies of the quick-start example", () => {
      // Arrange
      const configAnalysis = analyzeConfig(QUICK_START_CONFIG);

      // Act
      const { dependencies } = evaluateProject(configAnalysis, {
        files: FILES,
        dependencies: DEPENDENCIES,
      });

      // Assert
      expect(dependencies.map(({ verdict }) => verdict)).toEqual([
        {
          status: "disallowed",
          policy: { index: null, path: [...OPTIONS_PATH, "default"] },
          message:
            'There is no policy allowing dependencies from elements of type "helper" to elements of type "component"',
          level: "error",
        },
        {
          status: "allowed",
          policy: { index: 0, path: [...OPTIONS_PATH, "policies", 0] },
        },
        {
          status: "disallowed",
          policy: { index: 2, path: [...OPTIONS_PATH, "policies", 2] },
          message:
            'Dependencies to file of category "test" are not allowed. Denied by policy at index 2',
          level: "error",
        },
        { status: "not-checked", reason: "not-local" },
      ]);
    });

    it("should count the files of each descriptor and the dependencies that each policy decided", () => {
      // Arrange
      const configAnalysis = analyzeConfig(QUICK_START_CONFIG);

      // Act
      const { elementTypes, fileCategories, policies } = evaluateProject(
        configAnalysis,
        { files: FILES, dependencies: DEPENDENCIES }
      );

      // Assert
      expect(elementTypes.map(({ type, files }) => [type, files])).toEqual([
        ["helper", 1],
        ["component", 2],
        ["module", 1],
      ]);
      expect(
        fileCategories.map(({ category, files }) => [category, files])
      ).toEqual([
        ["test", 1],
        ["style", 0],
      ]);
      expect(
        policies.map(({ index, decided, disallowed, errors }) => [
          index,
          decided,
          disallowed,
          errors,
        ])
      ).toEqual([
        [0, 1, 0, 0],
        [1, 0, 0, 0],
        [2, 1, 1, 1],
        [null, 1, 1, 1],
      ]);
    });
  });
});
