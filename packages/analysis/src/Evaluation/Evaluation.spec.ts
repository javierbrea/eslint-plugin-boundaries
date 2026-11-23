// cspell:ignore patern -- a deliberate typo, the mistake of the config that makes an element descriptor ignored
import {
  describeDependency,
  describeEntity,
  evaluateDependency,
  evaluatePolicies,
  getMatcher,
  Policies,
} from "@boundaries/policies";

import { analyzeConfig } from "../Config";
import type { NotEvaluatedReason, ProjectConfig } from "../Config";

import { evaluateDependencies } from "./Dependencies";
import { describeFiles } from "./DescribeFiles";
import { evaluateProject } from "./Evaluation";
import type { Project, ProjectDependency } from "./Evaluation.types";
import { getPolicies } from "./PoliciesInstances";

/** The functions of `@boundaries/policies` that keep what they build for the life of the module */
type ModuleFunctions = {
  getMatcher: typeof getMatcher;
  describeEntity: typeof describeEntity;
  describeDependency: typeof describeDependency;
  evaluatePolicies: typeof evaluatePolicies;
  evaluateDependency: typeof evaluateDependency;
};

// The real functions of the module, which the tests only count, to prove that the evaluation never calls them
jest.mock<ModuleFunctions>("@boundaries/policies", () => {
  const actual = jest.requireActual<ModuleFunctions>("@boundaries/policies");
  return {
    ...actual,
    getMatcher: jest.fn(actual.getMatcher),
    describeEntity: jest.fn(actual.describeEntity),
    describeDependency: jest.fn(actual.describeDependency),
    evaluatePolicies: jest.fn(actual.evaluatePolicies),
    evaluateDependency: jest.fn(actual.evaluateDependency),
  };
});

const FORMAT = "src/helpers/format/index.js";
const BUTTON = "src/components/atoms/Button/index.js";
const SPEC = "src/components/atoms/Button/Button.spec.js";
const STYLE = "src/components/atoms/Button/Button.css";
const CHECKOUT = "src/modules/checkout/index.js";
const CART = "src/modules/cart/index.js";
const INDEX = "src/index.js";
const INDEX_STYLE = "src/index.css";

const FILES = [FORMAT, BUTTON, SPEC, STYLE, CHECKOUT, CART, INDEX, INDEX_STYLE];

/** The settings of the quick start, with an element descriptor that is ignored between the helper and the component */
const SETTINGS = {
  "boundaries/elements": [
    { type: "helper", pattern: "helpers/*" },
    { type: "legacy", patern: "legacy/*" },
    { type: "component", pattern: "components/*/*" },
    { type: "module", pattern: "modules/*" },
  ],
  "boundaries/files": [
    { pattern: "**/*.spec.js", category: "test" },
    { pattern: "**/*.css", category: "style" },
  ],
};

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

const CONFIG: ProjectConfig = {
  settings: SETTINGS,
  rules: { "boundaries/dependencies": [2, QUICK_START_OPTIONS] },
};

/** The path of the options of the `dependencies` rule in the config objects of the spec */
const OPTIONS_PATH = ["rules", "boundaries/dependencies", 1] as const;

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

const DEPENDENCIES: ProjectDependency[] = [
  dependencyOn(FORMAT, BUTTON, "../../components/atoms/Button"),
  dependencyOn(BUTTON, FORMAT, "../../../helpers/format"),
  dependencyOn(CHECKOUT, SPEC, "../../components/atoms/Button/Button.spec"),
  dependencyOn(CHECKOUT, BUTTON, "../../components/atoms/Button"),
  {
    from: CHECKOUT,
    target: { kind: "external", name: "react" },
    syntax: "import",
    importKind: "value",
    specifiers: [],
    source: "react",
  },
  dependencyOn(CART, FORMAT, "../../helpers/format"),
];

const PROJECT: Pick<Project, "files" | "dependencies"> = {
  files: FILES,
  dependencies: DEPENDENCIES,
};

describe("Evaluation", () => {
  describe("evaluateProject", () => {
    it("should describe every file of the project with the settings of the analysis", () => {
      // Arrange
      const analysis = analyzeConfig(CONFIG);

      // Act
      const { files } = evaluateProject(analysis, PROJECT);

      // Assert
      expect(files).toEqual(
        describeFiles(new Policies(), analysis.settings, FILES).files
      );
      expect([...files.keys()]).toEqual(FILES);
      expect(
        FILES.map((path) => [
          files.get(path)?.element.types,
          files.get(path)?.file.categories,
        ])
      ).toEqual([
        [["helper"], null],
        [["component"], null],
        [["component"], ["test"]],
        [["component"], ["style"]],
        [["module"], null],
        [["module"], null],
        [null, null],
        [null, ["style"]],
      ]);
    });

    it("should evaluate every dependency of the project with the rule of the analysis, in the order of the project, with the dependency itself", () => {
      // Arrange
      const analysis = analyzeConfig(CONFIG);

      // Act
      const { dependencies } = evaluateProject(analysis, PROJECT);

      // Assert
      expect(dependencies).toEqual(
        evaluateDependencies({
          dependencies: DEPENDENCIES,
          policies: new Policies(),
          settings: analysis.settings,
          rule: analysis.rule,
        })
      );
      expect(
        dependencies.map(({ dependency }) => DEPENDENCIES.indexOf(dependency))
      ).toEqual([0, 1, 2, 3, 4, 5]);
      expect(dependencies.map(({ ref }) => ref)).toEqual([
        { path: FORMAT, index: 0 },
        { path: BUTTON, index: 0 },
        { path: CHECKOUT, index: 0 },
        { path: CHECKOUT, index: 1 },
        { path: CHECKOUT, index: 2 },
        { path: CART, index: 0 },
      ]);
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
        {
          status: "allowed",
          policy: { index: 1, path: [...OPTIONS_PATH, "policies", 1] },
        },
        { status: "not-checked", reason: "not-local" },
        {
          status: "allowed",
          policy: { index: 1, path: [...OPTIONS_PATH, "policies", 1] },
        },
      ]);
    });

    it.each<[string, ProjectConfig, boolean, NotEvaluatedReason | undefined]>([
      ["evaluated", CONFIG, true, undefined],
      [
        "off",
        {
          settings: SETTINGS,
          rules: { "boundaries/dependencies": [0, QUICK_START_OPTIONS] },
        },
        true,
        "rule-off",
      ],
      [
        "invalid",
        {
          settings: SETTINGS,
          rules: { "boundaries/dependencies": [2, { default: "maybe" }] },
        },
        false,
        "rules-invalid",
      ],
    ])(
      "should give the validity of the rules and the reason of the analysis when the rule is %s",
      (_title, config, rulesValid, notEvaluated) => {
        // Arrange
        const analysis = analyzeConfig(config);

        // Act
        const result = evaluateProject(analysis, PROJECT);

        // Assert
        expect(analysis.rulesValid).toBe(rulesValid);
        expect(result.rulesValid).toBe(rulesValid);
        expect(analysis.notEvaluated).toBe(notEvaluated);
        expect(result.notEvaluated).toBe(notEvaluated);
      }
    );

    it.each<[string, ProjectConfig, boolean]>([
      ["the default nodes", CONFIG, true],
      [
        "an additional node with a selector that is not built-in",
        {
          settings: {
            ...SETTINGS,
            "boundaries/additional-dependency-nodes": [
              {
                selector: "ImportDeclaration > Literal",
                kind: "value",
                name: "custom",
              },
            ],
          },
          rules: CONFIG.rules,
        },
        false,
      ],
    ])(
      "should give whether the analysis reads the dependency nodes as ESLint does with %s",
      (_title, config, dependencyNodesReadAsESLint) => {
        // Arrange
        const analysis = analyzeConfig(config);

        // Act
        const result = evaluateProject(analysis, PROJECT);

        // Assert
        expect(analysis.dependencyNodesReadAsESLint).toBe(
          dependencyNodesReadAsESLint
        );
        expect(result.dependencyNodesReadAsESLint).toBe(
          dependencyNodesReadAsESLint
        );
      }
    );

    it("should give the diagnostics and the summaries of the rules of the analysis, the same objects", () => {
      // Arrange
      const analysis = analyzeConfig(CONFIG);

      // Act
      const result = evaluateProject(analysis, PROJECT);

      // Assert
      expect(result.diagnostics).toBe(analysis.diagnostics);
      expect(result.diagnostics).not.toEqual([]);
      expect(result.rules).toBe(analysis.rules);
      expect(result.rules.map(({ name }) => name)).toEqual([
        "boundaries/dependencies",
      ]);
    });

    it("should count the files of each element descriptor, giving those after an ignored one the files of their own", () => {
      // Arrange
      const analysis = analyzeConfig(CONFIG);

      // Act
      const { elementTypes } = evaluateProject(analysis, PROJECT);

      // Assert
      expect(
        elementTypes.map(({ type, files, ignored }) => [type, files, ignored])
      ).toEqual([
        ["helper", 1, false],
        ["legacy", 0, true],
        ["component", 3, false],
        ["module", 2, false],
      ]);
      expect(elementTypes).toEqual(
        analysis.elementTypes.map((summary, index) => ({
          ...summary,
          files: [1, 0, 3, 2][index],
        }))
      );
    });

    it("should count the files of each file descriptor", () => {
      // Arrange
      const analysis = analyzeConfig(CONFIG);

      // Act
      const { fileCategories } = evaluateProject(analysis, PROJECT);

      // Assert
      expect(fileCategories).toEqual([
        {
          index: 0,
          category: "test",
          patterns: ["**/*.spec.js"],
          files: 1,
          path: ["settings", "boundaries/files", 0],
        },
        {
          index: 1,
          category: "style",
          patterns: ["**/*.css"],
          files: 2,
          path: ["settings", "boundaries/files", 1],
        },
      ]);
    });

    it("should count the dependencies that each policy and the default decided", () => {
      // Arrange
      const analysis = analyzeConfig(CONFIG);

      // Act
      const { policies } = evaluateProject(analysis, PROJECT);

      // Assert
      expect(
        policies.map(({ index, decided, disallowed, errors }) => [
          index,
          decided,
          disallowed,
          errors,
        ])
      ).toEqual([
        [0, 1, 0, 0],
        [1, 2, 0, 0],
        [2, 1, 1, 1],
        [null, 1, 1, 1],
      ]);
      expect(policies).toEqual(
        analysis.policies.map((summary) => expect.objectContaining(summary))
      );
    });

    it("should summarize no policy and evaluate no dependency when no rule is evaluated, and still count the files", () => {
      // Arrange
      const analysis = analyzeConfig({
        settings: SETTINGS,
        rules: { "boundaries/dependencies": [0, QUICK_START_OPTIONS] },
      });

      // Act
      const result = evaluateProject(analysis, PROJECT);

      // Assert
      expect(result.policies).toEqual([]);
      expect(result.notEvaluated).toBe("rule-off");
      expect(result.dependencies.map(({ verdict }) => verdict)).toEqual(
        DEPENDENCIES.map(() => ({ status: "not-evaluated" }))
      );
      expect(result.elementTypes.map(({ files }) => files)).toEqual([
        1, 0, 3, 2,
      ]);
      expect(result.fileCategories.map(({ files }) => files)).toEqual([1, 2]);
    });

    it("should give equal results that are not the same objects when it is called twice with the same analysis and project", () => {
      // Arrange
      const analysis = analyzeConfig(CONFIG);

      // Act
      const first = evaluateProject(analysis, PROJECT);
      const second = evaluateProject(analysis, PROJECT);

      // Assert
      expect(second).toEqual(first);
      expect(second).not.toBe(first);
    });

    it("should build every part of the result again when it is called twice with the same analysis and project", () => {
      // Arrange
      const analysis = analyzeConfig(CONFIG);

      // Act
      const first = evaluateProject(analysis, PROJECT);
      const second = evaluateProject(analysis, PROJECT);

      // Assert
      expect(second.files).not.toBe(first.files);
      expect(second.dependencies).not.toBe(first.dependencies);
      expect(second.elementTypes).not.toBe(first.elementTypes);
      expect(second.fileCategories).not.toBe(first.fileCategories);
      expect(second.policies).not.toBe(first.policies);
    });

    it("should evaluate each project on its own with the same analysis", () => {
      // Arrange
      const analysis = analyzeConfig(CONFIG);
      const other = { files: [FORMAT], dependencies: [DEPENDENCIES[0]] };

      // Act
      const first = evaluateProject(analysis, PROJECT);
      const otherResult = evaluateProject(analysis, other);
      const again = evaluateProject(analysis, PROJECT);

      // Assert
      expect([...otherResult.files.keys()]).toEqual([FORMAT]);
      expect(
        otherResult.dependencies.map(({ dependency }) => dependency)
      ).toEqual([DEPENDENCIES[0]]);
      expect(otherResult.elementTypes.map(({ files }) => files)).toEqual([
        1, 0, 0, 0,
      ]);
      expect(
        otherResult.policies.map(({ decided, disallowed }) => [
          decided,
          disallowed,
        ])
      ).toEqual([
        [0, 0],
        [0, 0],
        [0, 0],
        [1, 1],
      ]);
      expect(again).toEqual(first);
    });

    it("should leave the analysis as it was, so that it evaluates other projects", () => {
      // Arrange
      const analysis = analyzeConfig(CONFIG);

      // Act
      evaluateProject(analysis, PROJECT);

      // Assert
      expect(analysis).toEqual(analyzeConfig(CONFIG));
    });

    describe("with the Policies instance of the settings of the analysis", () => {
      let instanceDescribeEntity: jest.SpiedFunction<
        Policies["describeEntity"]
      >;
      let instanceDescribeDependency: jest.SpiedFunction<
        Policies["describeDependency"]
      >;
      let instanceEvaluateDependency: jest.SpiedFunction<
        Policies["evaluateDependency"]
      >;

      /**
       * Lists the `Policies` instances that described a file, described a dependency or decided one since the mocks were last cleared.
       * @returns The instances, each once.
       */
      function usedInstances(): unknown[] {
        return [
          ...new Set([
            ...instanceDescribeEntity.mock.contexts,
            ...instanceDescribeDependency.mock.contexts,
            ...instanceEvaluateDependency.mock.contexts,
          ]),
        ];
      }

      beforeEach(() => {
        jest.restoreAllMocks();
        instanceDescribeEntity = jest.spyOn(
          Policies.prototype,
          "describeEntity"
        );
        instanceDescribeDependency = jest.spyOn(
          Policies.prototype,
          "describeDependency"
        );
        instanceEvaluateDependency = jest.spyOn(
          Policies.prototype,
          "evaluateDependency"
        );
      });

      it("should describe and decide with one instance in every evaluation of one analysis, the instance of its settings", () => {
        // Arrange
        const analysis = analyzeConfig(CONFIG);
        const other = { files: [FORMAT], dependencies: [DEPENDENCIES[0]] };

        // Act
        evaluateProject(analysis, PROJECT);
        evaluateProject(analysis, other);

        // Assert
        expect(instanceDescribeEntity).toHaveBeenCalled();
        expect(instanceDescribeDependency).toHaveBeenCalled();
        expect(instanceEvaluateDependency).toHaveBeenCalled();
        expect(
          usedInstances().map(
            (instance) => instance === getPolicies(analysis.settings)
          )
        ).toEqual([true]);
      });

      it("should describe and decide with another instance for another analysis of the same config", () => {
        // Arrange
        const analysis = analyzeConfig(CONFIG);
        const otherAnalysis = analyzeConfig(CONFIG);

        // Act
        evaluateProject(analysis, PROJECT);
        const instances = usedInstances();
        jest.clearAllMocks();
        evaluateProject(otherAnalysis, PROJECT);
        const otherInstances = usedInstances();

        // Assert
        expect(otherAnalysis.settings).not.toBe(analysis.settings);
        expect(otherAnalysis.settings).toEqual(analysis.settings);
        expect(
          instances.map(
            (instance) => instance === getPolicies(analysis.settings)
          )
        ).toEqual([true]);
        expect(
          otherInstances.map(
            (instance) => instance === getPolicies(otherAnalysis.settings)
          )
        ).toEqual([true]);
        expect(otherInstances[0]).not.toBe(instances[0]);
      });

      it("should never call the functions of @boundaries/policies, which keep what they build for the life of the module", () => {
        // Arrange
        const analysis = analyzeConfig(CONFIG);

        // Act
        evaluateProject(analysis, PROJECT);

        // Assert
        expect(usedInstances()).toHaveLength(1);
        expect(
          Object.entries({
            getMatcher,
            describeEntity,
            describeDependency,
            evaluatePolicies,
            evaluateDependency,
          }).map(([name, fn]) => [name, jest.mocked(fn).mock.calls.length])
        ).toEqual([
          ["getMatcher", 0],
          ["describeEntity", 0],
          ["describeDependency", 0],
          ["evaluatePolicies", 0],
          ["evaluateDependency", 0],
        ]);
      });
    });
  });
});
