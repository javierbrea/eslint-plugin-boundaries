import type {
  Sketch,
  SketchDependency,
  SketchNode,
  SketchSpecifier,
} from "@/contract";
import { QUICK_START_EXAMPLE } from "@/domains/examples/data/examples";

import { addDependency, replaceDependency } from "./dependencies";
import { DEFAULT_RESOLVERS } from "./sketch.constants";
import type { EditResult, SourceResolver } from "./sketch.types";
import { fromText, readTextProblems, toText } from "./textMode";

/** The `typescript` resolver with its default extensions, written out so that the specs say what it tries */
const TYPESCRIPT_RESOLVERS: readonly SourceResolver[] = [
  {
    name: "typescript",
    extensions: [".ts", ".tsx", ".d.ts", ".js", ".jsx", ".json", ".node"],
  },
];

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

/** The text of the `text` state of the mockup of the playground, without its last line (`src/pages/`), which the mockup adds as typing in progress */
const QUICK_START_TEXT = [
  "eslint.config.js",
  "src/components/atoms/Button/Button.css",
  "src/components/atoms/Button/Button.spec.js",
  '  import { Button } from "./index";',
  "src/components/atoms/Button/index.js",
  '  import { format } from "../../../helpers/format";',
  '  import "./Button.css";',
  "src/helpers/format/index.js",
  '  import { Button } from "../../components/atoms/Button";',
  "src/modules/checkout/index.js",
  '  import { Button } from "../../components/atoms/Button";',
  '  import { format } from "../../helpers/format";',
  '  import { renderButton } from "../../components/atoms/Button/Button.spec";',
  '  import React from "react";',
  "src/index.js",
  '  import "./modules/checkout";',
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
      const text = toText(SKETCH, DEFAULT_RESOLVERS);

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
      const text = toText(QUICK_START_EXAMPLE.sketch, DEFAULT_RESOLVERS);

      // Assert
      expect(text).toBe(QUICK_START_TEXT);
    });

    it("should write only the config line for an empty sketch", () => {
      // Act
      const text = toText(createSketch([]), DEFAULT_RESOLVERS);

      // Assert
      expect(text).toBe("eslint.config.js\n");
    });

    it("should write the sources that the resolvers of the config find back", () => {
      // Arrange
      const sketch = createSketch(
        [
          { path: "src/a.ts", kind: "file" },
          { path: "src/b.ts", kind: "file" },
          { path: "src/c.mjs", kind: "file" },
        ],
        [toNode("src/a.ts", "src/b.ts"), toNode("src/a.ts", "src/c.mjs")]
      );

      // Act
      const [typescript, node, both] = [
        TYPESCRIPT_RESOLVERS,
        DEFAULT_RESOLVERS,
        [...TYPESCRIPT_RESOLVERS, ...DEFAULT_RESOLVERS],
      ].map((resolvers) => toText(sketch, resolvers));

      // Assert
      expect(typescript).toBe(
        'eslint.config.js\nsrc/a.ts\n  import "./b";\n  import "./c.mjs";\nsrc/b.ts\nsrc/c.mjs\n'
      );
      expect(node).toBe(
        'eslint.config.js\nsrc/a.ts\n  import "./b.ts";\n  import "./c";\nsrc/b.ts\nsrc/c.mjs\n'
      );
      expect(both).toBe(
        'eslint.config.js\nsrc/a.ts\n  import "./b";\n  import "./c";\nsrc/b.ts\nsrc/c.mjs\n'
      );
    });

    it("should write the dependencies of a file under its line, indented two spaces, in order", () => {
      // Arrange
      const sketch = createSketch(SKETCH.tree, [
        toNode("src/index.js", "src/helpers/format.js"),
        toExternal("src/index.js", "react"),
      ]);

      // Act
      const text = toText(sketch, DEFAULT_RESOLVERS);

      // Assert
      expect(text).toBe(
        [
          "eslint.config.js",
          "docs/guides/",
          "src/components/Price/index.js",
          "src/helpers/format.js",
          "src/pages/",
          "src/index.js",
          '  import "./helpers/format";',
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
      const text = toText(sketch, DEFAULT_RESOLVERS);

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
      const text = toText(sketch, DEFAULT_RESOLVERS);

      // Assert
      expect(text).toBe(
        [
          "eslint.config.js",
          "docs/guides/",
          "src/components/Price/index.js",
          "src/helpers/format.js",
          "src/pages/",
          "src/index.js",
          '  import format, { round as r } from "./helpers/format";',
          '  export type * from "./helpers/format";',
          '  require("./helpers/format");',
          '  import("./helpers/format");',
          "",
        ].join("\n")
      );
    });

    it("should write the source that resolves back to the file when another file would resolve first", () => {
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
      const text = toText(sketch, DEFAULT_RESOLVERS);

      // Assert
      expect(text).toBe(
        [
          "eslint.config.js",
          "src/Button/index.js",
          "src/Button.js",
          "src/index.js",
          '  import "./Button";',
          '  import "./Button/index";',
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
      const text = toText(sketch, DEFAULT_RESOLVERS);

      // Assert
      expect(text).toBe(toText(SKETCH, DEFAULT_RESOLVERS));
    });

    it("should not list a folder that the nodes under it imply", () => {
      // Arrange
      const sketch = createSketch([
        { path: "src", kind: "folder" },
        { path: "src/index.js", kind: "file" },
      ]);

      // Act
      const text = toText(sketch, DEFAULT_RESOLVERS);

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
      const { sketch, problems } = fromText(text, createSketch([]), {
        resolvers: DEFAULT_RESOLVERS,
      });

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
      const { sketch, problems } = fromText(text, createSketch([]), {
        resolvers: DEFAULT_RESOLVERS,
      });

      // Assert
      expect(paths(sketch)).toEqual(["src/index.js"]);
      expect(problems).toEqual([]);
    });

    it("should clean up each path", () => {
      // Arrange
      const text = "./src\\index.js \t\n/src//helpers/\n";

      // Act
      const { sketch, problems } = fromText(text, createSketch([]), {
        resolvers: DEFAULT_RESOLVERS,
      });

      // Assert
      expect(paths(sketch)).toEqual(["src/helpers/", "src/index.js"]);
      expect(problems).toEqual([]);
    });

    it("should read Windows line endings", () => {
      // Arrange
      const text = "eslint.config.js\r\nsrc/index.js\r\nsrc/pages/\r\n";

      // Act
      const { sketch, problems } = fromText(text, createSketch([]), {
        resolvers: DEFAULT_RESOLVERS,
      });

      // Assert
      expect(paths(sketch)).toEqual(["src/pages/", "src/index.js"]);
      expect(problems).toEqual([]);
    });

    it("should read text without a final newline", () => {
      // Act
      const { sketch } = fromText("src/index.js", createSketch([]), {
        resolvers: DEFAULT_RESOLVERS,
      });

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
      const { sketch, problems } = fromText(text, createSketch([]), {
        resolvers: DEFAULT_RESOLVERS,
      });

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
      const { sketch, problems } = fromText(text, createSketch([]), {
        resolvers: DEFAULT_RESOLVERS,
      });

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
      const { sketch } = fromText(text, createSketch([]), {
        resolvers: DEFAULT_RESOLVERS,
      });

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
      const { sketch, problems } = fromText(text, createSketch([]), {
        resolvers: TYPESCRIPT_RESOLVERS,
      });

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

    it("should read a source with the resolvers it is given, and leave out the one that none of them resolves", () => {
      // Arrange
      const text = 'src/a.js\n  import "./b";\nsrc/b.tsx\n';

      // Act
      const withTypescript = fromText(text, createSketch([]), {
        resolvers: TYPESCRIPT_RESOLVERS,
      });
      const withNode = fromText(text, createSketch([]), {
        resolvers: DEFAULT_RESOLVERS,
      });

      // Assert
      expect(withTypescript.problems).toEqual([]);
      expect(withTypescript.sketch.dependencies).toEqual([
        toNode("src/a.js", "src/b.tsx"),
      ]);
      expect(withNode.problems).toEqual([
        {
          line: 2,
          text: '  import "./b";',
          reason: '"./b" does not resolve to a file of the sketch.',
        },
      ]);
      expect(withNode.sketch.dependencies).toEqual([]);
    });

    it("should read a source that ends with / as the index of the folder", () => {
      // Arrange
      const text = 'src/a.js\n  import "./b/";\nsrc/b.js\nsrc/b/index.js\n';

      // Act
      const { sketch, problems } = fromText(text, createSketch([]), {
        resolvers: DEFAULT_RESOLVERS,
      });

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
      const { sketch, problems } = fromText(text, createSketch([]), {
        resolvers: DEFAULT_RESOLVERS,
      });

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

    it("should read a relative source as the file a resolver finds", () => {
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
      const { sketch, problems } = fromText(text, createSketch([]), {
        resolvers: [...TYPESCRIPT_RESOLVERS, ...DEFAULT_RESOLVERS],
      });

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
      const { sketch, problems } = fromText(text, createSketch([]), {
        resolvers: DEFAULT_RESOLVERS,
      });

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
      const { sketch, problems } = fromText(text, createSketch([]), {
        resolvers: DEFAULT_RESOLVERS,
      });

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
      const { sketch, problems } = fromText(text, createSketch([]), {
        resolvers: DEFAULT_RESOLVERS,
      });

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
      const { sketch, problems } = fromText(text, createSketch([]), {
        resolvers: DEFAULT_RESOLVERS,
      });

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
      const { sketch, problems } = fromText(text, createSketch([]), {
        resolvers: DEFAULT_RESOLVERS,
      });

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
      const { sketch, problems } = fromText(text, createSketch([]), {
        resolvers: DEFAULT_RESOLVERS,
      });

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
      const { sketch, problems } = fromText(text, createSketch([]), {
        resolvers: DEFAULT_RESOLVERS,
      });

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
      const { sketch, problems } = fromText(text, createSketch([]), {
        resolvers: DEFAULT_RESOLVERS,
      });

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
        '  import "..";',
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
      const { sketch, problems } = fromText(text, createSketch([]), {
        resolvers: DEFAULT_RESOLVERS,
      });

      // Assert
      expect(sketch.dependencies).toEqual([]);
      expect(problems.map(({ line, reason }) => ({ line, reason }))).toEqual([
        { line: 2, reason: "A file cannot depend on itself." },
        { line: 3, reason: "The module name is empty." },
        {
          line: 4,
          reason:
            '".." is not a module name: names do not start with "." or "/". Point to a file of the sketch instead.',
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
      const { problems } = fromText(text, createSketch([]), {
        resolvers: DEFAULT_RESOLVERS,
      });

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
      const { sketch } = fromText(text, original, {
        resolvers: DEFAULT_RESOLVERS,
      });

      // Assert
      expect(sketch.dependencies).toEqual([]);
    });

    it("should leave out a duplicate as a problem and keep the first", () => {
      // Arrange
      const text = "src/index.js\nsrc/helpers/\nsrc/index.js\n./src/helpers/\n";

      // Act
      const { sketch, problems } = fromText(text, createSketch([]), {
        resolvers: DEFAULT_RESOLVERS,
      });

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
      const { sketch, problems } = fromText(text, createSketch([]), {
        resolvers: DEFAULT_RESOLVERS,
      });

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
      const { sketch, problems } = fromText(text, createSketch([]), {
        resolvers: DEFAULT_RESOLVERS,
      });

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
      const { sketch, problems } = fromText(text, createSketch([]), {
        resolvers: DEFAULT_RESOLVERS,
      });

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
      const { sketch, problems } = fromText(text, createSketch([]), {
        resolvers: DEFAULT_RESOLVERS,
      });

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
      const { sketch, problems } = fromText(text, createSketch([]), {
        resolvers: DEFAULT_RESOLVERS,
      });

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
      const { sketch, problems } = fromText(text, createSketch([]), {
        resolvers: DEFAULT_RESOLVERS,
      });

      // Assert
      expect(sketch.tree).toEqual([{ path: "src/index.js", kind: "file" }]);
      expect(problems).toEqual([]);
    });

    it("should keep the config of the sketch given", () => {
      // Arrange
      const original = createSketch([]);

      // Act
      const { sketch } = fromText("src/index.js\n", original, {
        resolvers: DEFAULT_RESOLVERS,
      });

      // Assert
      expect(sketch.config).toBe(original.config);
    });

    it("should not change the sketch given", () => {
      // Arrange
      const before = JSON.stringify(SKETCH);

      // Act
      fromText("src/other.js\n", SKETCH, { resolvers: DEFAULT_RESOLVERS });

      // Assert
      expect(JSON.stringify(SKETCH)).toBe(before);
    });

    describe("without reading the dependencies", () => {
      const NO_DEPENDENCIES = {
        dependencies: false,
        resolvers: DEFAULT_RESOLVERS,
      };
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
          resolvers: DEFAULT_RESOLVERS,
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
      const problems = readTextProblems(text, { resolvers: DEFAULT_RESOLVERS });

      // Assert
      expect(problems).toEqual(
        fromText(text, SKETCH, { resolvers: DEFAULT_RESOLVERS }).problems
      );
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
      const problems = readTextProblems(text, { resolvers: DEFAULT_RESOLVERS });

      // Assert
      expect(problems).toEqual(
        fromText(text, SKETCH, { resolvers: DEFAULT_RESOLVERS }).problems
      );
      expect(problems.map(({ line }) => line)).toEqual([2, 5]);
    });

    it("should report the sources that none of the resolvers resolves to a file", () => {
      // Arrange
      const text = 'src/a.js\n  import "./b";\nsrc/b.tsx\n';

      // Act
      const withTypescript = readTextProblems(text, {
        resolvers: TYPESCRIPT_RESOLVERS,
      });
      const withNode = readTextProblems(text, { resolvers: DEFAULT_RESOLVERS });

      // Assert
      expect(withTypescript).toEqual([]);
      expect(withNode).toEqual([
        {
          line: 2,
          text: '  import "./b";',
          reason: '"./b" does not resolve to a file of the sketch.',
        },
      ]);
    });

    it("should report nothing for the text of the quick start example, dependencies included", () => {
      // Act
      const problems = readTextProblems(QUICK_START_TEXT, {
        resolvers: DEFAULT_RESOLVERS,
      });

      // Assert
      expect(problems).toEqual([]);
    });

    it("should report the same lines whatever the sketch is", () => {
      // Arrange
      const text = "src/a.js/\nsrc/a.js\n";

      // Act
      const problems = readTextProblems(text, { resolvers: DEFAULT_RESOLVERS });

      // Assert
      expect(problems).toEqual(
        fromText(text, createSketch([]), { resolvers: DEFAULT_RESOLVERS })
          .problems
      );
    });

    it("should report nothing for a text whose lines can all be read", () => {
      // Act
      const problems = readTextProblems(toText(SKETCH, DEFAULT_RESOLVERS), {
        resolvers: DEFAULT_RESOLVERS,
      });

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
      const problems = readTextProblems(text, {
        resolvers: DEFAULT_RESOLVERS,
        dependencies: false,
      });

      // Assert
      expect(problems).toEqual([
        { line: 5, text: "src/a.js", reason: "That path already exists." },
      ]);
    });

    it("should report the lines of dependencies when the option says to read them", () => {
      // Arrange
      const text = 'src/a.js\n  import "./missing";\n';

      // Act
      const problems = readTextProblems(text, {
        resolvers: DEFAULT_RESOLVERS,
        dependencies: true,
      });

      // Assert
      expect(problems.map(({ line }) => line)).toEqual([2]);
    });
  });

  describe("round trip", () => {
    it("should return the quick start example from its own text", () => {
      // Act
      const { sketch, problems } = fromText(
        toText(QUICK_START_EXAMPLE.sketch, DEFAULT_RESOLVERS),
        QUICK_START_EXAMPLE.sketch,
        { resolvers: DEFAULT_RESOLVERS }
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
      const { sketch, problems } = fromText(
        toText(original, DEFAULT_RESOLVERS),
        original,
        { resolvers: DEFAULT_RESOLVERS }
      );

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
      const { sketch } = fromText(QUICK_START_TEXT, createSketch([]), {
        resolvers: DEFAULT_RESOLVERS,
      });

      // Assert
      expect(toText(sketch, DEFAULT_RESOLVERS)).toBe(QUICK_START_TEXT);
      expect(sketch.tree).toEqual(QUICK_START_EXAMPLE.sketch.tree);
      expect(sketch.dependencies).toEqual(
        QUICK_START_EXAMPLE.sketch.dependencies
      );
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
            syntax: "export-from",
            specifiers: specifiers("named", "c as default"),
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
          toNode("index.js", "src/app.tsx"),
        ]
      );

      // Act
      const { sketch, problems } = fromText(
        toText(original, DEFAULT_RESOLVERS),
        original,
        { resolvers: DEFAULT_RESOLVERS }
      );

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
      const { sketch, problems } = fromText(
        toText(stored, DEFAULT_RESOLVERS),
        stored,
        { resolvers: DEFAULT_RESOLVERS }
      );

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
      const { sketch, problems } = fromText(
        toText(stored, DEFAULT_RESOLVERS),
        stored,
        { resolvers: DEFAULT_RESOLVERS }
      );

      // Assert
      expect(problems).toEqual([]);
      expect(stored.dependencies[0].specifiers).toEqual(ORDERED);
      expect(sketch.dependencies).toEqual(stored.dependencies);
    });

    it("should keep the same files and folders when the nodes are in another order", () => {
      // Arrange
      const original = createSketch([...SKETCH.tree].reverse());

      // Act
      const { sketch } = fromText(
        toText(original, DEFAULT_RESOLVERS),
        original,
        { resolvers: DEFAULT_RESOLVERS }
      );

      // Assert
      expect(
        [...sketch.tree].sort((a, b) => a.path.localeCompare(b.path))
      ).toEqual(
        [...original.tree].sort((a, b) => a.path.localeCompare(b.path))
      );
    });

    it("should return a sketch from its own text for each of the resolvers that wrote it", () => {
      // Arrange
      const original = createSketch(
        [
          { path: "src/a.ts", kind: "file" },
          { path: "src/b.ts", kind: "file" },
          { path: "src/c.mjs", kind: "file" },
          { path: "src/d/index.tsx", kind: "file" },
        ],
        [
          toNode("src/a.ts", "src/b.ts"),
          toNode("src/a.ts", "src/c.mjs"),
          toNode("src/a.ts", "src/d/index.tsx"),
        ]
      );

      // Act
      const results = [
        TYPESCRIPT_RESOLVERS,
        DEFAULT_RESOLVERS,
        [...TYPESCRIPT_RESOLVERS, ...DEFAULT_RESOLVERS],
      ].map((resolvers) =>
        fromText(toText(original, resolvers), createSketch([]), { resolvers })
      );

      // Assert
      expect(results.map(({ sketch }) => sketch.dependencies)).toEqual([
        original.dependencies,
        original.dependencies,
        original.dependencies,
      ]);
      expect(results.map(({ problems }) => problems)).toEqual([[], [], []]);
    });

    it("should return an empty sketch from its own text", () => {
      // Arrange
      const original = createSketch([]);

      // Act
      const { sketch, problems } = fromText(
        toText(original, DEFAULT_RESOLVERS),
        original,
        { resolvers: DEFAULT_RESOLVERS }
      );

      // Assert
      expect(sketch).toEqual(original);
      expect(problems).toEqual([]);
    });
  });
});
