import type {
  Sketch,
  SketchDependency,
  SketchNode,
  SketchSpecifier,
} from "@/contract";
import { QUICK_START_EXAMPLE } from "@/domains/examples/data/examples";

import { addDependency, replaceDependency } from "./dependencies";
import type { EditResult } from "./sketch.types";
import { fromText, readTextProblems, toText } from "./textMode";

/**
 * Creates a dependency of a file on a node of the sketch, with the fields given.
 * @param from The file that has the dependency.
 * @param path The node it points to.
 * @param fields The fields to set besides the target.
 */
function toNode(
  from: string,
  path: string,
  fields: Partial<SketchDependency> = {}
): SketchDependency {
  return {
    from,
    target: { kind: "node", path },
    syntax: "import",
    importKind: "value",
    specifiers: [],
    ...fields,
  };
}

/**
 * Creates a dependency of a file on an external module, with the fields given.
 * @param from The file that has the dependency.
 * @param moduleName The module it points to.
 * @param fields The fields to set besides the target.
 */
function toExternal(
  from: string,
  moduleName: string,
  fields: Partial<SketchDependency> = {}
): SketchDependency {
  return {
    from,
    target: { kind: "external", name: moduleName },
    syntax: "import",
    importKind: "value",
    specifiers: [],
    ...fields,
  };
}

/**
 * Creates a sketch with the nodes and the dependencies given.
 * @param tree The nodes of the sketch.
 * @param dependencies The dependencies of the sketch.
 */
function createSketch(
  tree: readonly SketchNode[],
  dependencies: readonly SketchDependency[] = []
): Sketch {
  return { config: "{ settings: {}, rules: {} }", tree, dependencies };
}

/**
 * Gets the paths of the nodes of a sketch.
 * @param sketch The sketch to read.
 */
function paths(sketch: Sketch): string[] {
  return sketch.tree.map(({ path, kind }) =>
    kind === "folder" ? `${path}/` : path
  );
}

/**
 * Creates the specifiers of the kind and the names given.
 * @param kind The kind of the specifiers.
 * @param names The names; `a as b` sets the alias.
 */
function specifiers(
  kind: SketchSpecifier["kind"],
  ...names: string[]
): SketchSpecifier[] {
  return names.map((entry) => {
    const [local, alias] = entry.split(" as ");

    return alias === undefined
      ? { kind, name: local }
      : { kind, name: local, alias };
  });
}

/** The text of the `text` state of the mockup of the playground, without its last line (`src/pages/`), which the mockup adds as typing in progress, and with the sources in full, which the mockup writes shorter */
const QUICK_START_TEXT = [
  "eslint.config.js",
  "src/components/atoms/Button/Button.css",
  "src/components/atoms/Button/Button.spec.js",
  '  import { Button } from "./index.js";',
  "src/components/atoms/Button/index.js",
  '  import { format } from "../../../helpers/format/index.js";',
  '  import "./Button.css";',
  "src/helpers/format/index.js",
  '  import { Button } from "../../components/atoms/Button/index.js";',
  "src/modules/checkout/index.js",
  '  import { Button } from "../../components/atoms/Button/index.js";',
  '  import { format } from "../../helpers/format/index.js";',
  '  import { renderButton } from "../../components/atoms/Button/Button.spec.js";',
  '  import React from "react";',
  "src/index.js",
  '  import "./modules/checkout/index.js";',
  "",
].join("\n");

/**
 * Gets the sketch of an edit that is not refused.
 * @param result The result of adding or replacing a dependency.
 */
function getEdited(result: EditResult): Sketch {
  if ("error" in result) {
    throw new Error(`The edit was refused: ${result.error}`);
  }
  return result.sketch;
}

const SKETCH = createSketch([
  { path: "src/components/Price/index.js", kind: "file" },
  { path: "src/helpers/format.js", kind: "file" },
  { path: "src/pages", kind: "folder" },
  { path: "src/index.js", kind: "file" },
  { path: "docs/guides", kind: "folder" },
]);

const TWO_FILES = createSketch([
  { path: "src/a.js", kind: "file" },
  { path: "src/b.js", kind: "file" },
]);

/** The names as the picker appends them: the named ones first, then the default */
const UNORDERED = {
  specifiers: [...specifiers("named", "c", "a"), ...specifiers("default", "b")],
};

/** The names of {@link UNORDERED} as a statement writes them */
const ORDERED = [
  ...specifiers("default", "b"),
  ...specifiers("named", "c", "a"),
];

describe("TextMode", () => {
  describe("toText", () => {
    it("should write the config first, then a line per file and per empty folder", () => {
      // Act
      const text = toText(SKETCH);

      // Assert
      expect(text).toBe(
        [
          "eslint.config.js",
          "docs/guides/",
          "src/components/Price/index.js",
          "src/helpers/format.js",
          "src/pages/",
          "src/index.js",
          "",
        ].join("\n")
      );
    });

    it("should write the quick start example as the text of the mockup, with its dependencies under their files", () => {
      // Act
      const text = toText(QUICK_START_EXAMPLE.sketch);

      // Assert
      expect(text).toBe(QUICK_START_TEXT);
    });

    it("should write only the config line for an empty sketch", () => {
      // Act
      const text = toText(createSketch([]));

      // Assert
      expect(text).toBe("eslint.config.js\n");
    });

    it("should write the sources in full, with their extension", () => {
      // Arrange
      const sketch = createSketch(
        [
          { path: "src/a.ts", kind: "file" },
          { path: "src/b.ts", kind: "file" },
          { path: "src/c.mjs", kind: "file" },
          { path: "src/d/index.d.ts", kind: "file" },
          { path: "lib/e.css", kind: "file" },
        ],
        [
          toNode("src/a.ts", "src/b.ts"),
          toNode("src/a.ts", "src/c.mjs"),
          toNode("src/a.ts", "src/d/index.d.ts"),
          toNode("src/a.ts", "lib/e.css"),
        ]
      );

      // Act
      const text = toText(sketch);

      // Assert
      expect(text).toBe(
        [
          "eslint.config.js",
          "lib/e.css",
          "src/d/index.d.ts",
          "src/a.ts",
          '  import "./b.ts";',
          '  import "./c.mjs";',
          '  import "./d/index.d.ts";',
          '  import "../lib/e.css";',
          "src/b.ts",
          "src/c.mjs",
          "",
        ].join("\n")
      );
    });

    it("should write the dependencies of a file under its line, indented two spaces, in order", () => {
      // Arrange
      const sketch = createSketch(SKETCH.tree, [
        toNode("src/index.js", "src/helpers/format.js"),
        toExternal("src/index.js", "react"),
      ]);

      // Act
      const text = toText(sketch);

      // Assert
      expect(text).toBe(
        [
          "eslint.config.js",
          "docs/guides/",
          "src/components/Price/index.js",
          "src/helpers/format.js",
          "src/pages/",
          "src/index.js",
          '  import "./helpers/format.js";',
          '  import "react";',
          "",
        ].join("\n")
      );
    });

    it("should write each dependency under its own file whatever the order of the dependencies", () => {
      // Arrange
      const sketch = createSketch(SKETCH.tree, [
        toExternal("src/index.js", "react"),
        toExternal("src/helpers/format.js", "lodash"),
        toExternal("src/index.js", "vue"),
        toExternal("src/helpers/format.js", "ramda"),
      ]);

      // Act
      const text = toText(sketch);

      // Assert
      expect(text).toBe(
        [
          "eslint.config.js",
          "docs/guides/",
          "src/components/Price/index.js",
          "src/helpers/format.js",
          '  import "lodash";',
          '  import "ramda";',
          "src/pages/",
          "src/index.js",
          '  import "react";',
          '  import "vue";',
          "",
        ].join("\n")
      );
    });

    it("should write each syntax as its statement", () => {
      // Arrange
      const from = "src/index.js";
      const sketch = createSketch(SKETCH.tree, [
        toNode(from, "src/helpers/format.js", {
          specifiers: [
            ...specifiers("default", "format"),
            ...specifiers("named", "round as r"),
          ],
        }),
        toNode(from, "src/helpers/format.js", {
          syntax: "export-from",
          importKind: "type",
        }),
        toNode(from, "src/helpers/format.js", { syntax: "require" }),
        toNode(from, "src/helpers/format.js", { syntax: "dynamic-import" }),
      ]);

      // Act
      const text = toText(sketch);

      // Assert
      expect(text).toBe(
        [
          "eslint.config.js",
          "docs/guides/",
          "src/components/Price/index.js",
          "src/helpers/format.js",
          "src/pages/",
          "src/index.js",
          '  import format, { round as r } from "./helpers/format.js";',
          '  export type * from "./helpers/format.js";',
          '  require("./helpers/format.js");',
          '  import("./helpers/format.js");',
          "",
        ].join("\n")
      );
    });

    it("should write the file beside a folder with the same name, and the index of that folder, apart", () => {
      // Arrange
      const sketch = createSketch(
        [
          { path: "src/Button.js", kind: "file" },
          { path: "src/Button/index.js", kind: "file" },
          { path: "src/index.js", kind: "file" },
        ],
        [
          toNode("src/index.js", "src/Button.js"),
          toNode("src/index.js", "src/Button/index.js"),
        ]
      );

      // Act
      const text = toText(sketch);

      // Assert
      expect(text).toBe(
        [
          "eslint.config.js",
          "src/Button/index.js",
          "src/Button.js",
          "src/index.js",
          '  import "./Button.js";',
          '  import "./Button/index.js";',
          "",
        ].join("\n")
      );
    });

    it("should not write the dependencies of something that is not a file of the tree", () => {
      // Arrange
      const sketch = createSketch(SKETCH.tree, [
        toNode("src/pages", "src/index.js"),
        toNode("src/missing.js", "src/index.js"),
      ]);

      // Act
      const text = toText(sketch);

      // Assert
      expect(text).toBe(toText(SKETCH));
    });

    it("should not list a folder that the nodes under it imply", () => {
      // Arrange
      const sketch = createSketch([
        { path: "src", kind: "folder" },
        { path: "src/index.js", kind: "file" },
      ]);

      // Act
      const text = toText(sketch);

      // Assert
      expect(text).toBe("eslint.config.js\nsrc/index.js\n");
    });
  });

  describe("fromText", () => {
    it("should read a path per line, with a trailing slash for a folder", () => {
      // Arrange
      const text =
        "eslint.config.js\nsrc/index.js\nsrc/helpers/format.js\ndocs/\n";

      // Act
      const { sketch, problems } = fromText(text, createSketch([]));

      // Assert
      expect(paths(sketch)).toEqual([
        "docs/",
        "src/helpers/format.js",
        "src/index.js",
      ]);
      expect(problems).toEqual([]);
    });

    it("should skip blank lines and the config line, however it is written", () => {
      // Arrange
      const text =
        "\n   \n./eslint.config.js\n\t\nsrc/index.js\n\\eslint.config.js\n";

      // Act
      const { sketch, problems } = fromText(text, createSketch([]));

      // Assert
      expect(paths(sketch)).toEqual(["src/index.js"]);
      expect(problems).toEqual([]);
    });

    it("should clean up each path", () => {
      // Arrange
      const text = "./src\\index.js \t\n/src//helpers/\n";

      // Act
      const { sketch, problems } = fromText(text, createSketch([]));

      // Assert
      expect(paths(sketch)).toEqual(["src/helpers/", "src/index.js"]);
      expect(problems).toEqual([]);
    });

    it("should read Windows line endings", () => {
      // Arrange
      const text = "eslint.config.js\r\nsrc/index.js\r\nsrc/pages/\r\n";

      // Act
      const { sketch, problems } = fromText(text, createSketch([]));

      // Assert
      expect(paths(sketch)).toEqual(["src/pages/", "src/index.js"]);
      expect(problems).toEqual([]);
    });

    it("should read text without a final newline", () => {
      // Act
      const { sketch } = fromText("src/index.js", createSketch([]));

      // Assert
      expect(paths(sketch)).toEqual(["src/index.js"]);
    });

    it("should read an indented line as a dependency of the file above it", () => {
      // Arrange
      const text = [
        "src/index.js",
        '  import { format } from "./helpers/format";',
        "src/helpers/format.js",
        '  import React from "react";',
        '  export * from "../index";',
      ].join("\n");

      // Act
      const { sketch, problems } = fromText(text, createSketch([]));

      // Assert
      expect(problems).toEqual([]);
      expect(sketch.dependencies).toEqual([
        toNode("src/index.js", "src/helpers/format.js", {
          specifiers: specifiers("named", "format"),
        }),
        toExternal("src/helpers/format.js", "react", {
          specifiers: specifiers("default", "React"),
        }),
        toNode("src/helpers/format.js", "src/index.js", {
          syntax: "export-from",
        }),
      ]);
    });

    it("should read a dependency to a file that is written below it, with a tab or a space as indent", () => {
      // Arrange
      const text = [
        "src/index.js",
        '  import "./helpers";',
        '\timport React from "react";',
        ' require("./helpers/index.js")',
        "src/helpers/index.js",
      ].join("\n");

      // Act
      const { sketch, problems } = fromText(text, createSketch([]));

      // Assert
      expect(problems).toEqual([]);
      expect(paths(sketch)).toEqual(["src/helpers/index.js", "src/index.js"]);
      expect(sketch.dependencies).toEqual([
        toNode("src/index.js", "src/helpers/index.js"),
        toExternal("src/index.js", "react", {
          specifiers: specifiers("default", "React"),
        }),
        toNode("src/index.js", "src/helpers/index.js", { syntax: "require" }),
      ]);
    });

    it("should keep the dependencies in the order of the text, not of the tree", () => {
      // Arrange
      const text = [
        "src/z.js",
        '  import "react";',
        "src/a.js",
        '  import "vue";',
        '  import "react";',
      ].join("\n");

      // Act
      const { sketch } = fromText(text, createSketch([]));

      // Assert
      expect(sketch.dependencies).toEqual([
        toExternal("src/z.js", "react"),
        toExternal("src/a.js", "vue"),
        toExternal("src/a.js", "react"),
      ]);
    });

    it("should read the four syntaxes and the types", () => {
      // Arrange
      const text = [
        "src/a.ts",
        '  import type { T } from "./b";',
        '  export { x as y } from "./b";',
        "  export type * as ns from './b'",
        '  require("./b");',
        '  import("./b");',
        "src/b.ts",
      ].join("\n");

      // Act
      const { sketch, problems } = fromText(text, createSketch([]));

      // Assert
      expect(problems).toEqual([]);
      expect(sketch.dependencies).toEqual([
        toNode("src/a.ts", "src/b.ts", {
          importKind: "type",
          specifiers: specifiers("named", "T"),
        }),
        toNode("src/a.ts", "src/b.ts", {
          syntax: "export-from",
          specifiers: specifiers("named", "x as y"),
        }),
        toNode("src/a.ts", "src/b.ts", {
          syntax: "export-from",
          importKind: "type",
          specifiers: specifiers("namespace", "ns"),
        }),
        toNode("src/a.ts", "src/b.ts", { syntax: "require" }),
        toNode("src/a.ts", "src/b.ts", { syntax: "dynamic-import" }),
      ]);
    });

    describe("a relative source", () => {
      it("should be read as the file it names exactly, whatever the extension of the file", () => {
        // Arrange
        const text = [
          "src/a.js",
          '  import "./b.js";',
          '  import "./Button.css";',
          '  import "./LICENSE";',
          '  import "./x/index";',
          "src/b.js",
          "src/Button.css",
          "src/LICENSE",
          "src/x/index",
        ].join("\n");

        // Act
        const { sketch, problems } = fromText(text, createSketch([]));

        // Assert
        expect(problems).toEqual([]);
        expect(sketch.dependencies.map(({ target }) => target)).toEqual([
          { kind: "node", path: "src/b.js" },
          { kind: "node", path: "src/Button.css" },
          { kind: "node", path: "src/LICENSE" },
          { kind: "node", path: "src/x/index" },
        ]);
      });

      it("should be read as the file it names exactly, though other files add an extension to it", () => {
        // Arrange
        const text = [
          "src/a.js",
          '  import "./b";',
          '  import "./c.js";',
          "src/b",
          "src/b.js",
          "src/b.ts",
          "src/c.js",
          "src/c.js.ts",
        ].join("\n");

        // Act
        const { sketch, problems } = fromText(text, createSketch([]));

        // Assert
        expect(problems).toEqual([]);
        expect(sketch.dependencies.map(({ target }) => target)).toEqual([
          { kind: "node", path: "src/b" },
          { kind: "node", path: "src/c.js" },
        ]);
      });

      it.each([
        ".js",
        ".jsx",
        ".ts",
        ".tsx",
        ".mjs",
        ".cjs",
        ".mts",
        ".cts",
        ".d.ts",
      ])(
        "should be read without extension as the only file that adds the extension %s",
        (extension) => {
          // Arrange
          const text = `src/a.js\n  import "./b";\nsrc/b${extension}\n`;

          // Act
          const { sketch, problems } = fromText(text, createSketch([]));

          // Assert
          expect(problems).toEqual([]);
          expect(sketch.dependencies.map(({ target }) => target)).toEqual([
            { kind: "node", path: `src/b${extension}` },
          ]);
        }
      );

      it.each([
        ".js",
        ".jsx",
        ".ts",
        ".tsx",
        ".mjs",
        ".cjs",
        ".mts",
        ".cts",
        ".d.ts",
      ])(
        "should be read without extension as the index of a folder with the extension %s",
        (extension) => {
          // Arrange
          const text = `src/a.js\n  import "./b";\nsrc/b/index${extension}\n`;

          // Act
          const { sketch, problems } = fromText(text, createSketch([]));

          // Assert
          expect(problems).toEqual([]);
          expect(sketch.dependencies.map(({ target }) => target)).toEqual([
            { kind: "node", path: `src/b/index${extension}` },
          ]);
        }
      );

      it("should not be read as a file with another extension than the ones it names", () => {
        // Arrange
        const text = [
          "src/a.js",
          '  import "./b.js";',
          '  import "./b.jsx";',
          "src/b.ts",
          "src/b.tsx",
        ].join("\n");

        // Act
        const { sketch, problems } = fromText(text, createSketch([]));

        // Assert
        expect(sketch.dependencies).toEqual([]);
        expect(problems.map(({ line, reason }) => ({ line, reason }))).toEqual([
          {
            line: 2,
            reason: '"./b.js" does not resolve to a file of the sketch.',
          },
          {
            line: 3,
            reason: '"./b.jsx" does not resolve to a file of the sketch.',
          },
        ]);
      });

      it.each([
        ["./", "src/x/index.js"],
        [".", "src/x/index.js"],
        ["..", "src/index.js"],
        ["../", "src/index.js"],
        ["./..", "src/index.js"],
        ["../..", "index.js"],
        ["../../", "index.js"],
      ])(
        "should be read as the index of the folder when it is %s, from src/x/a.js",
        (source, expected) => {
          // Arrange
          const text = [
            "index.js",
            "src/index.js",
            "src/x/index.js",
            "src/x/a.js",
            `  import "${source}";`,
          ].join("\n");

          // Act
          const { sketch, problems } = fromText(text, createSketch([]));

          // Assert
          expect(problems).toEqual([]);
          expect(sketch.dependencies.map(({ target }) => target)).toEqual([
            { kind: "node", path: expected },
          ]);
        }
      );

      it("should be read as the index of the root when it names the root, from a file at the root", () => {
        // Arrange
        const text = 'a.js\n  import "./";\n  import ".";\nindex.js\n';

        // Act
        const { sketch, problems } = fromText(text, createSketch([]));

        // Assert
        expect(problems).toEqual([]);
        expect(sketch.dependencies.map(({ target }) => target)).toEqual([
          { kind: "node", path: "index.js" },
          { kind: "node", path: "index.js" },
        ]);
      });

      it("should be read as the index of the folder, and not as the file with the name of the folder, when it ends with /", () => {
        // Arrange
        const text = [
          "src/a.js",
          '  import "./b/";',
          "src/b.js",
          "src/b/index.js",
        ].join("\n");

        // Act
        const { sketch, problems } = fromText(text, createSketch([]));

        // Assert
        expect(problems).toEqual([]);
        expect(sketch.dependencies.map(({ target }) => target)).toEqual([
          { kind: "node", path: "src/b/index.js" },
        ]);
      });

      it("should not be read as a file when it names a folder, though a file has the name of the folder", () => {
        // Arrange
        const text = [
          "src/a.js",
          '  import "./b/";',
          '  import "../src";',
          '  import ".";',
          "src/b",
          "src.js",
        ].join("\n");

        // Act
        const { sketch, problems } = fromText(text, createSketch([]));

        // Assert
        expect(problems.map(({ line, reason }) => ({ line, reason }))).toEqual([
          {
            line: 2,
            reason: '"./b/" does not resolve to a file of the sketch.',
          },
          { line: 4, reason: '"." does not resolve to a file of the sketch.' },
        ]);
        expect(sketch.dependencies.map(({ target }) => target)).toEqual([
          { kind: "node", path: "src.js" },
        ]);
      });

      it("should be left out as a problem of its line when it goes above the root of the sketch", () => {
        // Arrange
        const text = [
          "src/a.js",
          '  import "../../b";',
          '  import "../..";',
          "b.js",
          "index.js",
          "root.js",
          '  import "..";',
          '  import "../b";',
        ].join("\n");

        // Act
        const { sketch, problems } = fromText(text, createSketch([]));

        // Assert
        expect(sketch.dependencies).toEqual([]);
        expect(problems.map(({ line, reason }) => ({ line, reason }))).toEqual([
          {
            line: 2,
            reason: '"../../b" does not resolve to a file of the sketch.',
          },
          {
            line: 3,
            reason: '"../.." does not resolve to a file of the sketch.',
          },
          { line: 7, reason: '".." does not resolve to a file of the sketch.' },
          {
            line: 8,
            reason: '"../b" does not resolve to a file of the sketch.',
          },
        ]);
      });

      it("should be left out, with the sources it can be in full, when it matches two files", () => {
        // Arrange
        const text = 'src/a.js\n  import "./b";\nsrc/b.js\nsrc/b.ts\n';

        // Act
        const { sketch, problems } = fromText(text, createSketch([]));

        // Assert
        expect(sketch.dependencies).toEqual([]);
        expect(problems).toEqual([
          {
            line: 2,
            text: '  import "./b";',
            reason:
              '"./b" can be "./b.js" or "./b.ts". Write the one you mean, with its extension.',
          },
        ]);
      });

      it("should be left out, with the sources it can be in the order of the rule, when it matches three files", () => {
        // Arrange
        const text = [
          "src/a.js",
          '  import "./b";',
          "src/b/index.js",
          "src/b.ts",
          "src/b.js",
        ].join("\n");

        // Act
        const { sketch, problems } = fromText(text, createSketch([]));

        // Assert
        expect(sketch.dependencies).toEqual([]);
        expect(problems.map(({ reason }) => reason)).toEqual([
          '"./b" can be "./b.js", "./b.ts" or "./b/index.js". Write the one you mean, with its extension.',
        ]);
      });

      it("should be left out when it matches a file and the index of a folder with the same name", () => {
        // Arrange
        const text = 'src/a.js\n  import "./b";\nsrc/b.js\nsrc/b/index.js\n';

        // Act
        const { sketch, problems } = fromText(text, createSketch([]));

        // Assert
        expect(sketch.dependencies).toEqual([]);
        expect(problems.map(({ reason }) => reason)).toEqual([
          '"./b" can be "./b.js" or "./b/index.js". Write the one you mean, with its extension.',
        ]);
      });

      it("should be left out when it matches two indexes of a folder", () => {
        // Arrange
        const text =
          'src/a.js\n  import "./b";\nsrc/b/index.ts\nsrc/b/index.js\n';

        // Act
        const { sketch, problems } = fromText(text, createSketch([]));

        // Assert
        expect(sketch.dependencies).toEqual([]);
        expect(problems.map(({ reason }) => reason)).toEqual([
          '"./b" can be "./b/index.js" or "./b/index.ts". Write the one you mean, with its extension.',
        ]);
      });

      it("should be left out with the candidates written as the file that has the source would write them", () => {
        // Arrange
        const text = [
          "src/x/a.js",
          '  import "../b";',
          "src/b/index.cts",
          "src/b.mts",
        ].join("\n");

        // Act
        const { problems } = fromText(text, createSketch([]));

        // Assert
        expect(problems.map(({ reason }) => reason)).toEqual([
          '"../b" can be "../b.mts" or "../b/index.cts". Write the one you mean, with its extension.',
        ]);
      });

      it("should be read once the user writes the one they mean", () => {
        // Arrange
        const text = 'src/a.js\n  import "./b.ts";\nsrc/b.js\nsrc/b.ts\n';

        // Act
        const { sketch, problems } = fromText(text, createSketch([]));

        // Assert
        expect(problems).toEqual([]);
        expect(sketch.dependencies).toEqual([toNode("src/a.js", "src/b.ts")]);
      });
    });

    it("should read a source that ends with / as the index of the folder", () => {
      // Arrange
      const text = 'src/a.js\n  import "./b/";\nsrc/b.js\nsrc/b/index.js\n';

      // Act
      const { sketch, problems } = fromText(text, createSketch([]));

      // Assert
      expect(problems).toEqual([]);
      expect(sketch.dependencies).toEqual([
        toNode("src/a.js", "src/b/index.js"),
      ]);
    });

    it("should read a keyword as the name of a named import with an alias, and as the name or the alias of an export", () => {
      // Arrange
      const text = [
        "src/a.js",
        '  import { if as condition } from "./b";',
        '  export { value as class } from "./b";',
        "src/b.js",
      ].join("\n");

      // Act
      const { sketch, problems } = fromText(text, createSketch([]));

      // Assert
      expect(problems).toEqual([]);
      expect(sketch.dependencies).toEqual([
        toNode("src/a.js", "src/b.js", {
          specifiers: specifiers("named", "if as condition"),
        }),
        toNode("src/a.js", "src/b.js", {
          syntax: "export-from",
          specifiers: specifiers("named", "value as class"),
        }),
      ]);
    });

    it("should read a relative source as the file the rule of the playground finds", () => {
      // Arrange
      const text = [
        "src/a/spec.js",
        '  import "./index";',
        '  import "../b";',
        '  import "../c/d.css";',
        '  import "../../lib";',
        "src/a/index.js",
        "src/b.tsx",
        "src/c/d.css",
        "lib/index.mjs",
      ].join("\n");

      // Act
      const { sketch, problems } = fromText(text, createSketch([]));

      // Assert
      expect(problems).toEqual([]);
      expect(sketch.dependencies.map(({ target }) => target)).toEqual([
        { kind: "node", path: "src/a/index.js" },
        { kind: "node", path: "src/b.tsx" },
        { kind: "node", path: "src/c/d.css" },
        { kind: "node", path: "lib/index.mjs" },
      ]);
    });

    it("should read a source that is not relative as an external module", () => {
      // Arrange
      const text = [
        "src/a.js",
        '  import "react";',
        '  import "@scope/pkg/sub";',
        '  import "node:fs";',
        '  import "src/a";',
      ].join("\n");

      // Act
      const { sketch, problems } = fromText(text, createSketch([]));

      // Assert
      expect(problems).toEqual([]);
      expect(sketch.dependencies.map(({ target }) => target)).toEqual([
        { kind: "external", name: "react" },
        { kind: "external", name: "@scope/pkg/sub" },
        { kind: "external", name: "node:fs" },
        { kind: "external", name: "src/a" },
      ]);
    });

    it("should keep a dependency under a file after blank lines and under a file read with Windows line endings", () => {
      // Arrange
      const text = 'src/a.js\r\n\r\n  \r\n  import "react";\r\nsrc/b.js\r\n';

      // Act
      const { sketch, problems } = fromText(text, createSketch([]));

      // Assert
      expect(problems).toEqual([]);
      expect(sketch.dependencies).toEqual([toExternal("src/a.js", "react")]);
    });

    it("should leave out a dependency under a folder as a problem", () => {
      // Arrange
      const text = [
        "src/",
        '  import "react";',
        "src/a.js",
        "docs/",
        "",
        '\timport "vue";',
      ].join("\n");

      // Act
      const { sketch, problems } = fromText(text, createSketch([]));

      // Assert
      expect(sketch.dependencies).toEqual([]);
      expect(problems).toEqual([
        {
          line: 2,
          text: '  import "react";',
          reason: "A folder has no dependencies: indent them under a file.",
        },
        {
          line: 6,
          text: '\timport "vue";',
          reason: "A folder has no dependencies: indent them under a file.",
        },
      ]);
    });

    it("should leave out a dependency above every file, and one under the config line, as a problem", () => {
      // Arrange
      const text = [
        '  import "react";',
        "eslint.config.js",
        '  import "vue";',
        "src/a.js",
      ].join("\n");

      // Act
      const { sketch, problems } = fromText(text, createSketch([]));

      // Assert
      expect(paths(sketch)).toEqual(["src/a.js"]);
      expect(sketch.dependencies).toEqual([]);
      expect(problems).toEqual([
        {
          line: 1,
          text: '  import "react";',
          reason:
            "A dependency is indented under the file that has it, and there is no file above this line.",
        },
        {
          line: 3,
          text: '  import "vue";',
          reason:
            "A dependency is indented under the file that has it, and there is no file above this line.",
        },
      ]);
    });

    it("should leave out a dependency under a line that was left out, instead of giving it to the file above", () => {
      // Arrange
      const text = [
        "src/a.js",
        '  import "react";',
        "src/../b.js",
        '  import "vue";',
        "src/a.js",
        '  import "svelte";',
      ].join("\n");

      // Act
      const { sketch, problems } = fromText(text, createSketch([]));

      // Assert
      expect(sketch.dependencies).toEqual([toExternal("src/a.js", "react")]);
      expect(problems.map(({ line }) => line)).toEqual([3, 4, 5, 6]);
      expect(problems[1].reason).toBe(
        "A dependency is indented under the file that has it, and there is no file above this line."
      );
      expect(problems[3].reason).toBe(
        "A dependency is indented under the file that has it, and there is no file above this line."
      );
    });

    it("should leave out a line that is not a statement, with the forms that are read", () => {
      // Arrange
      const text = [
        "src/a.js",
        "  const a = 1;",
        '  import a = require("react");',
        '  import { a } from "react"; // note',
        "  ",
      ].join("\n");

      // Act
      const { sketch, problems } = fromText(text, createSketch([]));

      // Assert
      expect(sketch.dependencies).toEqual([]);
      expect(problems).toEqual(
        [
          "  const a = 1;",
          '  import a = require("react");',
          '  import { a } from "react"; // note',
        ].map((line, index) => ({
          line: index + 2,
          text: line,
          reason:
            'Text mode reads the statements import, export … from, require("…") and import("…"), such as import { a } from "./a";',
        }))
      );
    });

    it("should leave out a relative source that resolves to no file as a problem", () => {
      // Arrange
      const text = [
        "src/a.js",
        '  import "./missing";',
        '  import "../../above";',
        '  import "./pages";',
        "src/pages/",
      ].join("\n");

      // Act
      const { sketch, problems } = fromText(text, createSketch([]));

      // Assert
      expect(sketch.dependencies).toEqual([]);
      expect(problems.map(({ line, reason }) => ({ line, reason }))).toEqual([
        {
          line: 2,
          reason: '"./missing" does not resolve to a file of the sketch.',
        },
        {
          line: 3,
          reason: '"../../above" does not resolve to a file of the sketch.',
        },
        {
          line: 4,
          reason: '"./pages" does not resolve to a file of the sketch.',
        },
      ]);
    });

    it("should leave out an absolute source as a problem", () => {
      // Arrange
      const text = ["src/a.js", '  import "/src/b";', "src/b.js"].join("\n");

      // Act
      const { sketch, problems } = fromText(text, createSketch([]));

      // Assert
      expect(sketch.dependencies).toEqual([]);
      expect(problems).toEqual([
        {
          line: 2,
          text: '  import "/src/b";',
          reason:
            '"/src/b" is an absolute path: write the source relative to the file, starting with ./ or ../.',
        },
      ]);
    });

    it("should leave out a dependency that the sketch cannot hold, with the reason", () => {
      // Arrange
      const text = [
        "src/a.js",
        '  import "./a";',
        '  import "";',
        '  import ".react";',
        '  import { default } from "react";',
        '  import { a, a as a } from "react";',
        '  import { a b-c } from "react";',
        "  import { 1a } from 'react'",
        '  import { a as class } from "react";',
        '  import 1 from "react";',
        '  import type A, { B } from "react";',
        '  import type A, * as ns from "react";',
        '  import eval from "react";',
      ].join("\n");

      // Act
      const { sketch, problems } = fromText(text, createSketch([]));

      // Assert
      expect(sketch.dependencies).toEqual([]);
      expect(problems.map(({ line, reason }) => ({ line, reason }))).toEqual([
        { line: 2, reason: "A file cannot depend on itself." },
        { line: 3, reason: "The module name is empty." },
        {
          line: 4,
          reason:
            '".react" is not a module name: names do not start with "." or "/". Point to a file of the sketch instead.',
        },
        { line: 5, reason: 'An import of "default" needs an alias.' },
        { line: 6, reason: 'The name "a" is used twice in the statement.' },
        {
          line: 7,
          reason:
            'Text mode reads the statements import, export … from, require("…") and import("…"), such as import { a } from "./a";',
        },
        { line: 8, reason: '"1a" is not a valid name.' },
        { line: 9, reason: '"class" is not a valid name.' },
        { line: 10, reason: '"1" is not a valid name.' },
        {
          line: 11,
          reason:
            "A type import cannot hold a default name together with named names or a namespace.",
        },
        {
          line: 12,
          reason:
            "A type import cannot hold a default name together with named names or a namespace.",
        },
        { line: 13, reason: '"eval" is not a valid name.' },
      ]);
    });

    it("should list the problems of nodes and of dependencies together, in the order of the lines", () => {
      // Arrange
      const text = [
        "src/a.js",
        '  import "./missing";',
        "src/../b.js",
        "src/c.js",
        "  nonsense",
        "src/a.js",
      ].join("\n");

      // Act
      const { problems } = fromText(text, createSketch([]));

      // Assert
      expect(problems.map(({ line }) => line)).toEqual([2, 3, 5, 6]);
    });

    it("should not keep the dependencies of the sketch given", () => {
      // Arrange
      const original = createSketch(SKETCH.tree, [
        toNode("src/index.js", "src/helpers/format.js"),
        toExternal("src/index.js", "react"),
      ]);
      const text = "src/index.js\nsrc/helpers/format.js\n";

      // Act
      const { sketch } = fromText(text, original);

      // Assert
      expect(sketch.dependencies).toEqual([]);
    });

    it("should leave out a duplicate as a problem and keep the first", () => {
      // Arrange
      const text = "src/index.js\nsrc/helpers/\nsrc/index.js\n./src/helpers/\n";

      // Act
      const { sketch, problems } = fromText(text, createSketch([]));

      // Assert
      expect(paths(sketch)).toEqual(["src/helpers/", "src/index.js"]);
      expect(problems).toEqual([
        { line: 3, text: "src/index.js", reason: "That path already exists." },
        {
          line: 4,
          text: "./src/helpers/",
          reason: "That path already exists.",
        },
      ]);
    });

    it("should leave out an invalid path as a problem", () => {
      // Arrange
      const text =
        "src/../index.js\neslint.config.js/\nsrc/a\u0001b.js\n/\neslint.config.js/index.js\n";

      // Act
      const { sketch, problems } = fromText(text, createSketch([]));

      // Assert
      expect(sketch.tree).toEqual([]);
      expect(problems).toEqual([
        {
          line: 1,
          text: "src/../index.js",
          reason: "The path cannot have `.` or `..` segments.",
        },
        {
          line: 2,
          text: "eslint.config.js/",
          reason:
            "eslint.config.js at the root is the config node, not a file or a folder.",
        },
        {
          line: 3,
          text: "src/a\u0001b.js",
          reason: "The path cannot have control characters.",
        },
        { line: 4, text: "/", reason: "The path is empty." },
        {
          line: 5,
          text: "eslint.config.js/index.js",
          reason:
            "eslint.config.js at the root is the config node, not a file or a folder.",
        },
      ]);
    });

    it("should leave out a path with a quote as a problem, as a statement cannot write it", () => {
      // Arrange
      const text = 'src/it\'s.js\nsrc/say"hi".js\nsrc/index.js\n';

      // Act
      const { sketch, problems } = fromText(text, createSketch([]));

      // Assert
      expect(paths(sketch)).toEqual(["src/index.js"]);
      expect(problems).toEqual([
        {
          line: 1,
          text: "src/it's.js",
          reason: "A path cannot have quotes or backslashes.",
        },
        {
          line: 2,
          text: 'src/say"hi".js',
          reason: "A path cannot have quotes or backslashes.",
        },
      ]);
    });

    it("should leave out a path that starts with a space after its slash as a problem, as the next read would take its line for a dependency", () => {
      // Arrange
      const text = "src/a.js\n/ c.js\n./ d/\nsrc/b.js\n";

      // Act
      const { sketch, problems } = fromText(text, createSketch([]));

      // Assert
      expect(paths(sketch)).toEqual(["src/a.js", "src/b.js"]);
      expect(problems).toEqual([
        {
          line: 2,
          text: "/ c.js",
          reason: "A path cannot start with a space.",
        },
        {
          line: 3,
          text: "./ d/",
          reason: "A path cannot start with a space.",
        },
      ]);
    });

    it("should leave out a path under a file as a problem", () => {
      // Arrange
      const text = "src/index.js\nsrc/index.js/other.js\n";

      // Act
      const { sketch, problems } = fromText(text, createSketch([]));

      // Assert
      expect(paths(sketch)).toEqual(["src/index.js"]);
      expect(problems).toEqual([
        {
          line: 2,
          text: "src/index.js/other.js",
          reason: '"src/index.js" is a file, so nothing can be added under it.',
        },
      ]);
    });

    it("should leave out a file where a folder is, and the other way round", () => {
      // Arrange
      const text = "src/a.js\nsrc/a.js/\nsrc/b/c.js\nsrc/b\n";

      // Act
      const { sketch, problems } = fromText(text, createSketch([]));

      // Assert
      expect(paths(sketch)).toEqual(["src/b/c.js", "src/a.js"]);
      expect(problems.map(({ line, reason }) => ({ line, reason }))).toEqual([
        { line: 2, reason: "A file already exists at that path." },
        { line: 4, reason: "A folder already exists at that path." },
      ]);
    });

    it("should not repeat a folder that the files of other lines imply", () => {
      // Arrange
      const text = "src/\nsrc/index.js\n";

      // Act
      const { sketch, problems } = fromText(text, createSketch([]));

      // Assert
      expect(sketch.tree).toEqual([{ path: "src/index.js", kind: "file" }]);
      expect(problems).toEqual([]);
    });

    it("should keep the config of the sketch given", () => {
      // Arrange
      const original = createSketch([]);

      // Act
      const { sketch } = fromText("src/index.js\n", original);

      // Assert
      expect(sketch.config).toBe(original.config);
    });

    it("should not change the sketch given", () => {
      // Arrange
      const before = JSON.stringify(SKETCH);

      // Act
      fromText("src/other.js\n", SKETCH);

      // Assert
      expect(JSON.stringify(SKETCH)).toBe(before);
    });

    describe("a name that another line of the file declares", () => {
      it("should leave out the later of two lines that import the same name, and read the earlier one", () => {
        // Arrange
        const text = [
          "src/a.js",
          '  import x from "./b.js";',
          '  import { y as x } from "./c.js";',
          "src/b.js",
          "src/c.js",
          "",
        ].join("\n");

        // Act
        const { sketch, problems } = fromText(text, createSketch([]));

        // Assert
        expect(sketch.dependencies).toEqual([
          toNode("src/a.js", "src/b.js", {
            specifiers: specifiers("default", "x"),
          }),
        ]);
        expect(problems).toEqual([
          {
            line: 3,
            text: '  import { y as x } from "./c.js";',
            reason:
              'The name "x" is already imported by another statement of the file.',
          },
        ]);
      });

      it("should leave out the later of two lines that export the same name, and read the earlier one", () => {
        // Arrange
        const text = [
          "src/a.js",
          '  export { a } from "./b.js";',
          '  export * as ns from "./b.js";',
          '  export { a } from "./c.js";',
          '  export { x as ns } from "./c.js";',
          "src/b.js",
          "src/c.js",
          "",
        ].join("\n");

        // Act
        const { sketch, problems } = fromText(text, createSketch([]));

        // Assert
        expect(sketch.dependencies).toEqual([
          toNode("src/a.js", "src/b.js", {
            syntax: "export-from",
            specifiers: specifiers("named", "a"),
          }),
          toNode("src/a.js", "src/b.js", {
            syntax: "export-from",
            specifiers: specifiers("namespace", "ns"),
          }),
        ]);
        expect(problems).toEqual([
          {
            line: 4,
            text: '  export { a } from "./c.js";',
            reason:
              'The name "a" is already exported by another statement of the file.',
          },
          {
            line: 5,
            text: '  export { x as ns } from "./c.js";',
            reason:
              'The name "ns" is already exported by another statement of the file.',
          },
        ]);
      });

      it("should leave out an import of a name that an earlier line imports as a type", () => {
        // Arrange
        const text = [
          "src/a.js",
          '  import type { A } from "./b.js";',
          '  import { A } from "./c.js";',
          "src/b.js",
          "src/c.js",
        ].join("\n");

        // Act
        const { problems } = fromText(text, createSketch([]));

        // Assert
        expect(problems.map(({ line }) => line)).toEqual([3]);
      });

      it("should not count a line that was left out for another reason", () => {
        // Arrange
        const text = [
          "src/a.js",
          '  import { x } from "./missing.js";',
          '  import { x } from "./b.js";',
          '  import { x } from "./c.js";',
          "src/b.js",
          "src/c.js",
        ].join("\n");

        // Act
        const { sketch, problems } = fromText(text, createSketch([]));

        // Assert
        expect(sketch.dependencies).toEqual([
          toNode("src/a.js", "src/b.js", {
            specifiers: specifiers("named", "x"),
          }),
        ]);
        expect(problems.map(({ line }) => line)).toEqual([2, 4]);
        expect(problems[0].reason).toBe(
          '"./missing.js" does not resolve to a file of the sketch.'
        );
      });

      it("should count the lines of a file that is written after the one that points to it", () => {
        // Arrange
        const text = [
          "src/a.js",
          '  import { x } from "./b.js";',
          "src/b.js",
          '  import { x } from "./c.js";',
          '  import { x } from "./a.js";',
          "src/c.js",
        ].join("\n");

        // Act
        const { problems } = fromText(text, createSketch([]));

        // Assert
        expect(problems.map(({ line }) => line)).toEqual([5]);
      });

      it("should read the same name in two files, a name that is imported and exported, and statements that name nothing", () => {
        // Arrange
        const text = [
          "src/a.js",
          '  import { a } from "./b.js";',
          '  export { a } from "./c.js";',
          '  export * from "./b.js";',
          '  export * from "./c.js";',
          '  import "./b.js";',
          '  import "./b.js";',
          '  require("./b.js");',
          '  import("./b.js");',
          "src/b.js",
          '  import { a } from "./c.js";',
          "src/c.js",
          "",
        ].join("\n");

        // Act
        const { sketch, problems } = fromText(text, createSketch([]));

        // Assert
        expect(problems).toEqual([]);
        expect(sketch.dependencies).toHaveLength(9);
      });

      it("should report the same lines as readTextProblems", () => {
        // Arrange
        const text = [
          "src/a.js",
          '  import x from "./b.js";',
          '  import { y as x } from "./c.js";',
          '  export { x } from "./b.js";',
          '  export { z as x } from "./c.js";',
          "src/b.js",
          "src/c.js",
        ].join("\n");

        // Act
        const problems = readTextProblems(text);

        // Assert
        expect(problems.map(({ line }) => line)).toEqual([3, 5]);
        expect(problems).toEqual(fromText(text, SKETCH).problems);
      });
    });

    describe("without reading the dependencies", () => {
      const NO_DEPENDENCIES = { dependencies: false };
      const WITH_DEPENDENCIES = createSketch(
        [
          { path: "src/a.js", kind: "file" },
          { path: "src/b.js", kind: "file" },
          { path: "src/c.js", kind: "file" },
        ],
        [
          toNode("src/a.js", "src/b.js"),
          toExternal("src/a.js", "react"),
          toNode("src/b.js", "src/c.js"),
          toNode("src/c.js", "src/a.js"),
        ]
      );

      /**
       * Lists what the dependencies of a sketch point to, to tell which one is which.
       * @param sketch The sketch to read.
       * @returns One `from -> to` entry per dependency, in order.
       */
      function listEdges(sketch: Sketch): string[] {
        return sketch.dependencies.map(
          ({ from, target }) =>
            `${from} -> ${target.kind === "node" ? target.path : target.name}`
        );
      }

      it("should ignore the dependency lines of the text and keep the dependencies of the sketch given", () => {
        // Arrange
        const text = [
          "src/a.js",
          '  import "lodash";',
          "src/b.js",
          "src/c.js",
          '  import { a } from "./a";',
          '  import { b } from "./b";',
          "",
        ].join("\n");

        // Act
        const { sketch } = fromText(text, WITH_DEPENDENCIES, NO_DEPENDENCIES);

        // Assert
        expect(listEdges(sketch)).toEqual([
          "src/a.js -> src/b.js",
          "src/a.js -> react",
          "src/b.js -> src/c.js",
          "src/c.js -> src/a.js",
        ]);
        expect(paths(sketch)).toEqual(["src/a.js", "src/b.js", "src/c.js"]);
      });

      it("should keep the dependencies of the sketch when the text has no dependency lines", () => {
        // Act
        const { sketch } = fromText(
          "src/c.js\nsrc/b.js\nsrc/a.js\n",
          WITH_DEPENDENCIES,
          NO_DEPENDENCIES
        );

        // Assert
        expect(sketch.dependencies).toEqual(WITH_DEPENDENCIES.dependencies);
      });

      it("should drop the dependencies from a file that the text no longer has, and the ones to it, and keep the external ones", () => {
        // Act
        const { sketch } = fromText(
          "src/a.js\nsrc/c.js\n",
          WITH_DEPENDENCIES,
          NO_DEPENDENCIES
        );

        // Assert
        expect(listEdges(sketch)).toEqual([
          "src/a.js -> react",
          "src/c.js -> src/a.js",
        ]);
      });

      it("should read the nodes as it does with the dependencies", () => {
        // Arrange
        const text = "src/a.js\n  import bad\nsrc/pages/\nsrc/a.js\n";

        // Act
        const { sketch } = fromText(text, WITH_DEPENDENCIES, NO_DEPENDENCIES);

        // Assert
        expect(paths(sketch)).toEqual(["src/pages/", "src/a.js"]);
      });

      it("should report no dependency line as a problem, whatever it says, and report the lines of nodes", () => {
        // Arrange
        const text = [
          "src/a.js",
          '  import "./missing";',
          "  nonsense",
          "src/pages/",
          '  import "react";',
          "  import { x } from '/abs';",
          "src/a.js",
          "../up.js",
        ].join("\n");

        // Act
        const { problems } = fromText(text, WITH_DEPENDENCIES, NO_DEPENDENCIES);

        // Assert
        expect(problems).toEqual([
          { line: 7, text: "src/a.js", reason: "That path already exists." },
          {
            line: 8,
            text: "../up.js",
            reason: "The path cannot have `.` or `..` segments.",
          },
        ]);
      });

      it("should skip an indented line above every file, as it skips a blank line", () => {
        // Act
        const { sketch, problems } = fromText(
          '  import "react";\nsrc/a.js\n',
          WITH_DEPENDENCIES,
          NO_DEPENDENCIES
        );

        // Assert
        expect(problems).toEqual([]);
        expect(paths(sketch)).toEqual(["src/a.js"]);
      });

      it("should read the dependency lines when the option says so", () => {
        // Arrange
        const text = 'src/a.js\n  import "lodash";\n';

        // Act
        const { sketch } = fromText(text, WITH_DEPENDENCIES, {
          dependencies: true,
        });

        // Assert
        expect(listEdges(sketch)).toEqual(["src/a.js -> lodash"]);
      });
    });
  });

  describe("readTextProblems", () => {
    it("should report the lines that fromText leaves out", () => {
      // Arrange
      const text = "src/a.js\n  import x\nsrc/a.js\n../b.js\n";

      // Act
      const problems = readTextProblems(text);

      // Assert
      expect(problems).toEqual(fromText(text, SKETCH).problems);
    });

    it("should report the lines of dependencies that fromText leaves out", () => {
      // Arrange
      const text = [
        "src/a.js",
        '  import "./missing";',
        '  import "react";',
        "src/b.js/",
        '\timport "vue";',
      ].join("\n");

      // Act
      const problems = readTextProblems(text);

      // Assert
      expect(problems).toEqual(fromText(text, SKETCH).problems);
      expect(problems.map(({ line }) => line)).toEqual([2, 5]);
    });

    it("should report the sources that match no file or several files, with the reason of fromText", () => {
      // Arrange
      const text = [
        "src/a.js",
        '  import "./b";',
        '  import "./c";',
        '  import "./d";',
        "src/b.js",
        "src/b.ts",
        "src/c.tsx",
      ].join("\n");

      // Act
      const problems = readTextProblems(text);

      // Assert
      expect(problems).toEqual([
        {
          line: 2,
          text: '  import "./b";',
          reason:
            '"./b" can be "./b.js" or "./b.ts". Write the one you mean, with its extension.',
        },
        {
          line: 4,
          text: '  import "./d";',
          reason: '"./d" does not resolve to a file of the sketch.',
        },
      ]);
      expect(problems).toEqual(fromText(text, SKETCH).problems);
    });

    it("should report nothing for the text of the quick start example, dependencies included", () => {
      // Act
      const problems = readTextProblems(QUICK_START_TEXT);

      // Assert
      expect(problems).toEqual([]);
    });

    it("should report the same lines whatever the sketch is", () => {
      // Arrange
      const text = "src/a.js/\nsrc/a.js\n";

      // Act
      const problems = readTextProblems(text);

      // Assert
      expect(problems).toEqual(fromText(text, createSketch([])).problems);
    });

    it("should report nothing for a text whose lines can all be read", () => {
      // Act
      const problems = readTextProblems(toText(SKETCH));

      // Assert
      expect(problems).toEqual([]);
    });

    it("should not report the lines of dependencies when it does not read them, and report the other lines as it did", () => {
      // Arrange
      const text = [
        "src/a.js",
        '  import "./missing";',
        "src/b.js/",
        '\timport "vue";',
        "src/a.js",
      ].join("\n");

      // Act
      const problems = readTextProblems(text, { dependencies: false });

      // Assert
      expect(problems).toEqual([
        { line: 5, text: "src/a.js", reason: "That path already exists." },
      ]);
    });

    it("should report the lines of dependencies when the option says to read them", () => {
      // Arrange
      const text = 'src/a.js\n  import "./missing";\n';

      // Act
      const problems = readTextProblems(text, { dependencies: true });

      // Assert
      expect(problems.map(({ line }) => line)).toEqual([2]);
    });
  });

  describe("round trip", () => {
    it("should return the quick start example from its own text", () => {
      // Act
      const { sketch, problems } = fromText(
        toText(QUICK_START_EXAMPLE.sketch),
        QUICK_START_EXAMPLE.sketch
      );

      // Assert
      expect(sketch).toEqual(QUICK_START_EXAMPLE.sketch);
      expect(problems).toEqual([]);
    });

    it("should return a sketch with empty folders from its own text", () => {
      // Arrange
      const original = createSketch(
        [
          { path: "docs/guides", kind: "folder" },
          { path: "src/components/Price/index.js", kind: "file" },
          { path: "src/helpers/format.js", kind: "file" },
          { path: "src/pages", kind: "folder" },
          { path: "src/index.js", kind: "file" },
          { path: "empty", kind: "folder" },
        ],
        [
          toExternal("src/components/Price/index.js", "react"),
          toNode("src/index.js", "src/helpers/format.js"),
          toNode("src/index.js", "src/components/Price/index.js"),
        ]
      );

      // Act
      const { sketch, problems } = fromText(toText(original), original);

      // Assert
      expect(sketch).toEqual({
        ...original,
        tree: [
          { path: "docs/guides", kind: "folder" },
          { path: "empty", kind: "folder" },
          { path: "src/components/Price/index.js", kind: "file" },
          { path: "src/helpers/format.js", kind: "file" },
          { path: "src/pages", kind: "folder" },
          { path: "src/index.js", kind: "file" },
        ],
      });
      expect(problems).toEqual([]);
    });

    it("should return the text of the quick start example from the sketch it reads", () => {
      // Act
      const { sketch } = fromText(QUICK_START_TEXT, createSketch([]));

      // Assert
      expect(toText(sketch)).toBe(QUICK_START_TEXT);
      expect(sketch.tree).toEqual(QUICK_START_EXAMPLE.sketch.tree);
      expect(sketch.dependencies).toEqual(
        QUICK_START_EXAMPLE.sketch.dependencies
      );
    });

    it("should return the text of a file that imports and exports the same name from its own text", () => {
      // Arrange
      const text = [
        "src/a.js",
        '  import { a } from "./b.js";',
        '  export { a } from "./c.js";',
        '  export * from "./b.js";',
        '  export * from "./c.js";',
        "src/b.js",
        '  import { a } from "./c.js";',
        "src/c.js",
        "",
      ].join("\n");
      const withConfig = ["eslint.config.js", text].join("\n");

      // Act
      const { sketch, problems } = fromText(withConfig, createSketch([]));

      // Assert
      expect(problems).toEqual([]);
      expect(toText(sketch)).toBe(withConfig);
    });

    it("should return a sketch with every syntax, kind and kind of name from its own text", () => {
      // Arrange
      const original = createSketch(
        [
          { path: "src/Button/index.js", kind: "file" },
          { path: "src/lib/util.ts", kind: "file" },
          { path: "src/styles/main.css", kind: "file" },
          { path: "src/app.tsx", kind: "file" },
          { path: "src/Button.js", kind: "file" },
          { path: "index.js", kind: "file" },
        ],
        [
          toNode("src/Button/index.js", "src/lib/util.ts", {
            importKind: "type",
            specifiers: specifiers("named", "Options", "Config as C"),
          }),
          toNode("src/app.tsx", "src/Button.js", {
            specifiers: specifiers("namespace", "ButtonNs"),
          }),
          toNode("src/app.tsx", "src/Button/index.js"),
          toNode("src/app.tsx", "src/styles/main.css"),
          toNode("src/app.tsx", "index.js", { syntax: "require" }),
          toNode("src/app.tsx", "src/lib/util.ts", {
            syntax: "export-from",
            specifiers: specifiers("named", "default", "a as b"),
          }),
          toNode("src/app.tsx", "src/lib/util.ts", {
            syntax: "export-from",
            importKind: "type",
          }),
          toNode("src/app.tsx", "src/lib/util.ts", {
            syntax: "export-from",
            specifiers: specifiers("namespace", "util"),
          }),
          toNode("src/app.tsx", "src/lib/util.ts", {
            syntax: "dynamic-import",
          }),
          toExternal("src/app.tsx", "@scope/pkg/sub", {
            specifiers: [
              ...specifiers("default", "pkg"),
              ...specifiers("namespace", "ns"),
            ],
          }),
          toExternal("src/app.tsx", "node:fs", { syntax: "require" }),
          toNode("src/Button.js", "src/Button/index.js", {
            specifiers: [
              ...specifiers("default", "Button"),
              ...specifiers("named", "default as Default", "x as y"),
            ],
          }),
          // `app.tsx` exports `default` already, and a file exports it once
          toNode("src/Button.js", "src/lib/util.ts", {
            syntax: "export-from",
            specifiers: specifiers("named", "c as default"),
          }),
          toNode("index.js", "src/app.tsx"),
        ]
      );

      // Act
      const { sketch, problems } = fromText(toText(original), original);

      // Assert
      expect(problems).toEqual([]);
      expect(sketch.tree).toEqual(original.tree);
      expect(sketch.dependencies).toStrictEqual(original.dependencies);
    });

    it("should return the names of a dependency added in any order from its own text", () => {
      // Arrange
      const stored = getEdited(
        addDependency(TWO_FILES, toNode("src/a.js", "src/b.js", UNORDERED))
      );

      // Act
      const { sketch, problems } = fromText(toText(stored), stored);

      // Assert
      expect(problems).toEqual([]);
      expect(stored.dependencies[0].specifiers).toEqual(ORDERED);
      expect(sketch.dependencies).toEqual(stored.dependencies);
    });

    it("should return the names of a dependency replaced in any order from its own text", () => {
      // Arrange
      const stored = getEdited(
        replaceDependency(
          getEdited(addDependency(TWO_FILES, toNode("src/a.js", "src/b.js"))),
          { path: "src/a.js", index: 0 },
          toNode("src/a.js", "src/b.js", UNORDERED)
        )
      );

      // Act
      const { sketch, problems } = fromText(toText(stored), stored);

      // Assert
      expect(problems).toEqual([]);
      expect(stored.dependencies[0].specifiers).toEqual(ORDERED);
      expect(sketch.dependencies).toEqual(stored.dependencies);
    });

    it("should keep the same files and folders when the nodes are in another order", () => {
      // Arrange
      const original = createSketch([...SKETCH.tree].reverse());

      // Act
      const { sketch } = fromText(toText(original), original);

      // Assert
      expect(
        [...sketch.tree].sort((a, b) => a.path.localeCompare(b.path))
      ).toEqual(
        [...original.tree].sort((a, b) => a.path.localeCompare(b.path))
      );
    });

    it("should return a sketch from its own text when files of several extensions share a name", () => {
      // Arrange
      const original = createSketch(
        [
          { path: "src/a.ts", kind: "file" },
          { path: "src/b.js", kind: "file" },
          { path: "src/b.ts", kind: "file" },
          { path: "src/b/index.js", kind: "file" },
          { path: "src/b/index.ts", kind: "file" },
          { path: "src/c.d.ts", kind: "file" },
          { path: "src/c.css", kind: "file" },
        ],
        [
          toNode("src/a.ts", "src/b.js"),
          toNode("src/a.ts", "src/b.ts"),
          toNode("src/a.ts", "src/b/index.js"),
          toNode("src/a.ts", "src/b/index.ts"),
          toNode("src/a.ts", "src/c.d.ts"),
          toNode("src/a.ts", "src/c.css"),
        ]
      );

      // Act
      const { sketch, problems } = fromText(toText(original), createSketch([]));

      // Assert
      expect(sketch.dependencies).toEqual(original.dependencies);
      expect(problems).toEqual([]);
    });

    it("should return an empty sketch from its own text", () => {
      // Arrange
      const original = createSketch([]);

      // Act
      const { sketch, problems } = fromText(toText(original), original);

      // Assert
      expect(sketch).toEqual(original);
      expect(problems).toEqual([]);
    });
  });
});
