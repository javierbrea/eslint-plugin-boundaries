// cspell:ignore patern -- deliberate typos, the mistakes of the config that the tests evaluate
import { normalizeConfig } from "@boundaries/config";

import { describeFiles } from "./describeFiles";
import type { TextRange } from "./engine.types";
import { parseConfig } from "./parseConfig";
import {
  summarizeElementTypes,
  summarizeFileCategories,
  summarizeRules,
} from "./summaries";
import type { SummariesInput } from "./summaries.types";

const QUICK_START_CONFIG = `{
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
    "boundaries/dependencies": [2, {
      default: "disallow",
      policies: [
        { from: { element: { type: "component" } }, allow: { to: { element: { type: "helper" } } } },
        { from: { element: { type: "module" } }, allow: { to: { element: { types: ["component", "helper"] } } } },
        { disallow: { to: { file: { categories: "test" } } } },
      ],
    }],
    "import/no-cycle": 2,
  },
}`;

const QUICK_START_FILES = [
  "src/helpers/format/index.js",
  "src/components/atoms/Button/index.js",
  "src/components/atoms/Button/Button.spec.js",
  "src/components/atoms/Button/Button.css",
  "src/modules/checkout/index.js",
  "src/index.js",
];

/**
 * Builds the input of the summaries the way the evaluation does.
 * @param text The config text, which must be one JSON5 object.
 * @param files The paths of the files of the sketch.
 * @returns The input of the summaries.
 */
function createInput(text: string, files: string[] = []): SummariesInput {
  const config = parseConfig(text);
  if (!config.parsed) {
    throw new Error("The config text should be one JSON5 object");
  }
  const { value, diagnostics } = normalizeConfig({
    settings: config.value.settings,
    rules: config.value.rules,
  });
  return {
    config,
    settings: value.settings,
    diagnostics,
    described: describeFiles(value.settings, files),
  };
}

/**
 * Reads the text a range covers.
 * @param text The config text.
 * @param range A range of the text.
 * @param range.from
 * @param range.to
 * @returns The text in the range.
 */
function slice(text: string, { from, to }: TextRange): string {
  return text.slice(from, to);
}

describe("Summaries", () => {
  describe("summarizeElementTypes", () => {
    it("should summarize each element descriptor with the files whose element it gives its type to", () => {
      // Arrange
      const input = createInput(QUICK_START_CONFIG, QUICK_START_FILES);

      // Act
      const summaries = summarizeElementTypes(input);

      // Assert
      expect(
        summaries.map(({ index, type, patterns, files, ignored }) => ({
          index,
          type,
          patterns,
          files,
          ignored,
        }))
      ).toEqual([
        {
          index: 0,
          type: "helper",
          patterns: ["helpers/*"],
          files: 1,
          ignored: false,
        },
        {
          index: 1,
          type: "component",
          patterns: ["components/*/*"],
          files: 3,
          ignored: false,
        },
        {
          index: 2,
          type: "module",
          patterns: ["modules/*"],
          files: 1,
          ignored: false,
        },
      ]);
    });

    it("should place each summary at its descriptor", () => {
      // Arrange
      const input = createInput(QUICK_START_CONFIG, QUICK_START_FILES);

      // Act
      const summaries = summarizeElementTypes(input);

      // Assert
      expect(
        summaries.map(({ range }) => slice(QUICK_START_CONFIG, range))
      ).toEqual([
        '{ type: "helper", pattern: "helpers/*" }',
        '{ type: "component", pattern: "components/*/*" }',
        '{ type: "module", pattern: "modules/*" }',
      ]);
      expect(summaries[1].range.line).toBe(5);
      expect(summaries[1].range.column).toBe(7);
    });

    it("should mark as ignored the descriptors that a diagnostic says are invalid", () => {
      // Arrange
      const text = `{
  settings: {
    "boundaries/elements": [
      { type: "helper", pattern: "helpers/*" },
      { type: "component", patern: "components/*/*" },
    ],
  },
}`;
      const input = createInput(text, QUICK_START_FILES);

      // Act
      const summaries = summarizeElementTypes(input);

      // Assert
      expect(summaries).toEqual([
        expect.objectContaining({ type: "helper", files: 1, ignored: false }),
        expect.objectContaining({
          index: 1,
          type: "component",
          patterns: [],
          files: 0,
          ignored: true,
        }),
      ]);
    });

    it("should not mark as ignored a valid descriptor that has a warning about one of its options", () => {
      // Arrange
      const text = `{
  settings: {
    "boundaries/elements": [{ type: "helper", pattern: "helpers/*.js" }],
  },
}`;
      const input = createInput(text, QUICK_START_FILES);

      // Act
      const summaries = summarizeElementTypes(input);

      // Assert
      expect(input.diagnostics.map(({ title }) => title)).toContain(
        "Some element descriptors appear to use file patterns."
      );
      expect(summaries).toEqual([
        expect.objectContaining({ type: "helper", ignored: false }),
      ]);
    });

    it("should name a descriptor without a type by its index, and count the files it matches", () => {
      // Arrange
      const text = `{
  settings: {
    "boundaries/elements": [
      { type: "helper", pattern: "helpers/*" },
      { category: "legacy", pattern: ["legacy/*", "old/*"] },
    ],
  },
}`;
      const input = createInput(text, [
        "src/legacy/a/index.js",
        "src/helpers/format/index.js",
      ]);

      // Act
      const summaries = summarizeElementTypes(input);

      // Assert
      expect(summaries[1]).toEqual(
        expect.objectContaining({
          index: 1,
          type: "#1",
          patterns: ["legacy/*", "old/*"],
          files: 1,
          ignored: false,
        })
      );
    });

    it("should count the files of each descriptor when descriptors share a type", () => {
      // Arrange
      const text = `{
  settings: {
    "boundaries/elements": [
      { type: "helper", pattern: "helpers/*" },
      { type: "helper", pattern: "utils/*" },
      { type: "module", pattern: "modules/*" },
    ],
  },
}`;
      const input = createInput(text, [
        "src/helpers/format/index.js",
        "src/utils/dates/index.js",
        "src/utils/numbers/index.js",
      ]);

      // Act
      const summaries = summarizeElementTypes(input);

      // Assert
      expect(summaries.map(({ type, files }) => [type, files])).toEqual([
        ["helper", 1],
        ["helper", 2],
        ["module", 0],
      ]);
    });

    it.each([
      [
        "only for the first one, which is the only one that labels it",
        "",
        [1, 0],
      ],
      [
        "for each one when elements-single-match is off",
        '"boundaries/elements-single-match": false,',
        [1, 1],
      ],
    ])(
      "should count a file that two descriptors match %s",
      (_title, singleMatch, expected) => {
        // Arrange
        const text = `{
  settings: {
    ${singleMatch}
    "boundaries/elements": [
      { type: "helper", pattern: "helpers/*" },
      { type: "helper", pattern: "helpers/*" },
    ],
  },
}`;
        const input = createInput(text, ["src/helpers/format/index.js"]);

        // Act
        const summaries = summarizeElementTypes(input);

        // Assert
        expect(summaries.map(({ files }) => files)).toEqual(expected);
      }
    );

    it("should name an entry that is not an object by its index, as ignored", () => {
      // Arrange
      const text = `{ settings: { "boundaries/elements": [5, null, { type: 3, pattern: ["a", 3] }] } }`;
      const input = createInput(text);

      // Act
      const summaries = summarizeElementTypes(input);

      // Assert
      expect(summaries).toEqual([
        expect.objectContaining({ type: "#0", patterns: [], ignored: true }),
        expect.objectContaining({ type: "#1", patterns: [], ignored: true }),
        expect.objectContaining({ type: "#2", patterns: ["a"], ignored: true }),
      ]);
    });

    it("should read the legacy descriptors written as strings, in the deprecated setting", () => {
      // Arrange
      const text = `{ settings: { "boundaries/types": ["helper", "component"] } }`;
      const input = createInput(text, ["src/helper/format/index.js"]);

      // Act
      const summaries = summarizeElementTypes(input);

      // Assert
      expect(summaries).toEqual([
        expect.objectContaining({
          index: 0,
          type: "helper",
          patterns: ["helper/*"],
          files: 1,
          ignored: false,
        }),
        expect.objectContaining({ index: 1, type: "component", files: 0 }),
      ]);
      expect(slice(text, summaries[1].range)).toBe('"component"');
    });

    it("should prefer boundaries/elements over the deprecated boundaries/types", () => {
      // Arrange
      const text = `{ settings: { "boundaries/elements": [{ type: "new", pattern: "new/*" }], "boundaries/types": ["old"] } }`;
      const input = createInput(text);

      // Act
      const summaries = summarizeElementTypes(input);

      // Assert
      expect(summaries.map(({ type }) => type)).toEqual(["new"]);
    });

    it.each([
      ["settings that are not written", "{}"],
      ["settings that are an array", "{ settings: [] }"],
      ["settings that are null", "{ settings: null }"],
      ["settings that are a string", '{ settings: "boundaries" }'],
      ["no element descriptors", "{ settings: {} }"],
      [
        "element descriptors that are not an array",
        '{ settings: { "boundaries/elements": "helper" } }',
      ],
    ])("should return no summaries for %s", (_title, text) => {
      // Arrange
      const input = createInput(text);

      // Act
      const summaries = summarizeElementTypes(input);

      // Assert
      expect(summaries).toEqual([]);
    });
  });

  describe("summarizeFileCategories", () => {
    it("should summarize each file descriptor with the files it gives its category to", () => {
      // Arrange
      const input = createInput(QUICK_START_CONFIG, QUICK_START_FILES);

      // Act
      const summaries = summarizeFileCategories(input);

      // Assert
      expect(
        summaries.map(({ index, category, patterns, files, range }) => ({
          index,
          category,
          patterns,
          files,
          source: slice(QUICK_START_CONFIG, range),
        }))
      ).toEqual([
        {
          index: 0,
          category: "test",
          patterns: ["**/*.spec.js"],
          files: 1,
          source: '{ pattern: "**/*.spec.js", category: "test" }',
        },
        {
          index: 1,
          category: "style",
          patterns: ["**/*.css"],
          files: 1,
          source: '{ pattern: "**/*.css", category: "style" }',
        },
      ]);
    });

    it("should leave out the invalid descriptors and keep the index that the valid ones have in the text", () => {
      // Arrange
      const text = `{
  settings: {
    "boundaries/files": [
      { pattern: "**/*.spec.js" },
      { pattern: ["**/*.css", "**/*.scss"], category: "style" },
      { pattern: "**/*.md", category: 1 },
      { pattern: "**/*.js", category: "script" },
    ],
  },
}`;
      const input = createInput(text, ["a.css", "b.scss", "c.js"]);

      // Act
      const summaries = summarizeFileCategories(input);

      // Assert
      expect(
        summaries.map(({ index, category, patterns, files, range }) => ({
          index,
          category,
          patterns,
          files,
          line: range.line,
        }))
      ).toEqual([
        {
          index: 1,
          category: "style",
          patterns: ["**/*.css", "**/*.scss"],
          files: 2,
          line: 5,
        },
        {
          index: 3,
          category: "script",
          patterns: ["**/*.js"],
          files: 1,
          line: 7,
        },
      ]);
    });

    it("should count the files of each descriptor when descriptors share a category", () => {
      // Arrange
      const text = `{
  settings: {
    "boundaries/files": [
      { pattern: "**/*.css", category: "style" },
      { pattern: "**/*.scss", category: "style" },
    ],
  },
}`;
      const input = createInput(text, ["a.css", "b.scss", "c.scss"]);

      // Act
      const summaries = summarizeFileCategories(input);

      // Assert
      expect(summaries.map(({ category, files }) => [category, files])).toEqual(
        [
          ["style", 1],
          ["style", 2],
        ]
      );
    });

    it.each([
      ["no file descriptors", "{ settings: {} }"],
      [
        "file descriptors that are not an array",
        '{ settings: { "boundaries/files": { category: "test" } } }',
      ],
      ["settings that are not written", "{}"],
    ])("should return no summaries for %s", (_title, text) => {
      // Arrange
      const input = createInput(text);

      // Act
      const summaries = summarizeFileCategories(input);

      // Assert
      expect(summaries).toEqual([]);
    });
  });

  describe("summarizeRules", () => {
    it("should summarize the rules of the plugin, and no other", () => {
      // Arrange
      const input = createInput(QUICK_START_CONFIG, QUICK_START_FILES);

      // Act
      const summaries = summarizeRules(input);

      // Assert
      expect(summaries).toEqual([
        {
          name: "boundaries/dependencies",
          policies: 3,
          valid: true,
          range: expect.objectContaining({ line: 14, column: 32 }),
        },
      ]);
      expect(slice(QUICK_START_CONFIG, summaries[0].range)).toMatch(
        /^\[2, \{\n {6}default: "disallow",[\s\S]*\}\]$/
      );
    });

    it("should count the policies of the options, or the deprecated rules", () => {
      // Arrange
      const text = `{
  rules: {
    "boundaries/dependencies": ["error", { policies: [{ allow: "a" }, { allow: "b" }] }],
    "boundaries/element-types": ["warn", { rules: [{ from: "a", allow: "b" }] }],
    "boundaries/no-unknown-files": 2,
    "boundaries/no-unknown": ["error"],
    "boundaries/no-private": ["error", { allowUncles: false }],
  },
}`;
      const input = createInput(text);

      // Act
      const summaries = summarizeRules(input);

      // Assert
      expect(
        summaries.map(({ name: ruleName, policies, valid }) => [
          ruleName,
          policies,
          valid,
        ])
      ).toEqual([
        ["boundaries/dependencies", 2, true],
        ["boundaries/element-types", 1, true],
        ["boundaries/no-unknown-files", 0, true],
        ["boundaries/no-unknown", 0, true],
        ["boundaries/no-private", 0, true],
      ]);
    });

    it("should mark a rule whose options fail the schema as not valid, and count its policies as written", () => {
      // Arrange
      const text = `{
  rules: {
    "boundaries/dependencies": [2, { default: "maybe", policies: [{}, {}, {}] }],
  },
}`;
      const input = createInput(text);

      // Act
      const summaries = summarizeRules(input);

      // Assert
      expect(summaries).toEqual([
        expect.objectContaining({
          name: "boundaries/dependencies",
          policies: 3,
          valid: false,
        }),
      ]);
    });

    it("should count no policies when they are not a list", () => {
      // Arrange
      const text = `{ rules: { "boundaries/dependencies": [2, { policies: "all" }] } }`;
      const input = createInput(text);

      // Act
      const summaries = summarizeRules(input);

      // Assert
      expect(summaries).toEqual([
        expect.objectContaining({ policies: 0, valid: false }),
      ]);
    });

    it("should mark as not valid a rule that does not exist and a severity that is not known", () => {
      // Arrange
      const text = `{ rules: { "boundaries/typo": 2, "boundaries/no-private": "on", "boundaries/external": 0 } }`;
      const input = createInput(text);

      // Act
      const summaries = summarizeRules(input);

      // Assert
      expect(
        summaries.map(({ name: ruleName, valid }) => [ruleName, valid])
      ).toEqual([
        ["boundaries/typo", false],
        ["boundaries/no-private", false],
        ["boundaries/external", true],
      ]);
    });

    it("should not mark as not valid a rule that is off with options that fail the schema, as ESLint does not validate it", () => {
      // Arrange
      const text = `{ rules: { "boundaries/dependencies": ["off", { default: "maybe" }] } }`;
      const input = createInput(text);

      // Act
      const summaries = summarizeRules(input);

      // Assert
      expect(summaries).toEqual([
        expect.objectContaining({
          name: "boundaries/dependencies",
          valid: true,
        }),
      ]);
    });

    it.each([
      ["rules that are not written", "{}"],
      ["rules that are not an object", "{ rules: [2] }"],
      ["rules of other plugins", '{ rules: { "import/no-cycle": 2 } }'],
    ])("should return no summaries for %s", (_title, text) => {
      // Arrange
      const input = createInput(text);

      // Act
      const summaries = summarizeRules(input);

      // Assert
      expect(summaries).toEqual([]);
    });
  });
});
