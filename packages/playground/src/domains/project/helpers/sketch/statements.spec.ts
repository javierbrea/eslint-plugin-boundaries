import type { SketchDependency, SketchSpecifier } from "@/contract";
import { QUICK_START_EXAMPLE } from "@/domains/examples/data/examples";

import type { ParsedStatement, StatementToken } from "./sketch.types";
import {
  findSourceFiles,
  getDependencySource,
  isRelativeSource,
  parseStatement,
  resolveSource,
  toStatement,
  toStatementTokens,
} from "./statements";

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
 * Creates a statement that is not tied to a file, with the fields given.
 * @param fields The fields to set.
 */
function createStatement(
  fields: Partial<ParsedStatement> = {}
): ParsedStatement {
  return {
    syntax: "import",
    importKind: "value",
    specifiers: [],
    source: "./a",
    ...fields,
  };
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

const ROUND = specifiers("named", "round as r");

/** The statements that are written and read, with what each says */
const FORMS: readonly [string, ParsedStatement, string][] = [
  [
    "a default name and named names",
    createStatement({
      specifiers: [...specifiers("default", "format"), ...ROUND],
    }),
    'import format, { round as r } from "./a";',
  ],
  [
    "a default name and a namespace",
    createStatement({
      specifiers: [
        ...specifiers("default", "format"),
        ...specifiers("namespace", "ns"),
      ],
    }),
    'import format, * as ns from "./a";',
  ],
  [
    "a default name alone",
    createStatement({ specifiers: specifiers("default", "format") }),
    'import format from "./a";',
  ],
  [
    "a namespace alone",
    createStatement({ specifiers: specifiers("namespace", "ns") }),
    'import * as ns from "./a";',
  ],
  [
    "named names without alias",
    createStatement({ specifiers: specifiers("named", "a", "b") }),
    'import { a, b } from "./a";',
  ],
  [
    "the default as a named name",
    createStatement({ specifiers: specifiers("named", "default as x") }),
    'import { default as x } from "./a";',
  ],
  ["a side-effect import", createStatement(), 'import "./a";'],
  [
    "a type import",
    createStatement({
      importKind: "type",
      specifiers: specifiers("named", "A"),
    }),
    'import type { A } from "./a";',
  ],
  [
    "a type import of a default name",
    createStatement({
      importKind: "type",
      specifiers: specifiers("default", "A"),
    }),
    'import type A from "./a";',
  ],
  [
    "an export of named names",
    createStatement({
      syntax: "export-from",
      specifiers: specifiers("named", "round", "x as y"),
    }),
    'export { round, x as y } from "./a";',
  ],
  [
    "an export of the default",
    createStatement({
      syntax: "export-from",
      specifiers: specifiers("named", "default"),
    }),
    'export { default } from "./a";',
  ],
  [
    "an export of a namespace",
    createStatement({
      syntax: "export-from",
      specifiers: specifiers("namespace", "ns"),
    }),
    'export * as ns from "./a";',
  ],
  [
    "an export of everything",
    createStatement({ syntax: "export-from" }),
    'export * from "./a";',
  ],
  [
    "a type export of everything",
    createStatement({ syntax: "export-from", importKind: "type" }),
    'export type * from "./a";',
  ],
  [
    "a type export of named names",
    createStatement({
      syntax: "export-from",
      importKind: "type",
      specifiers: specifiers("named", "A"),
    }),
    'export type { A } from "./a";',
  ],
  ["a require", createStatement({ syntax: "require" }), 'require("./a");'],
  [
    "a dynamic import",
    createStatement({ syntax: "dynamic-import" }),
    'import("./a");',
  ],
];

/** The extensions that a source without one can add, in the order the rule tries them, written out so that the specs say it */
const CODE_EXTENSIONS = [
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".mjs",
  ".cjs",
  ".mts",
  ".cts",
  ".d.ts",
];

/**
 * Gets the pieces of a statement as pairs of kind and text, to compare them in one line.
 * @param tokens The pieces.
 */
function toPairs(tokens: readonly StatementToken[]): [string, string][] {
  return tokens.map(({ kind, text }) => [kind, text]);
}

describe("Statements", () => {
  describe("isRelativeSource", () => {
    it.each(["./a", "../a", "./", "../", ".", "..", "../..", "./.."])(
      "should tell that %s is relative",
      (source) => {
        // Act
        const isRelative = isRelativeSource(source);

        // Assert
        expect(isRelative).toBe(true);
      }
    );

    it.each([
      "react",
      "@scope/pkg",
      "/src/a",
      "src/a",
      ".react",
      "..react",
      "...",
    ])("should tell that %s is not relative", (source) => {
      // Act
      const isRelative = isRelativeSource(source);

      // Assert
      expect(isRelative).toBe(false);
    });
  });

  describe("getDependencySource", () => {
    it("should write the sources of the dependencies of the quick start example in full", () => {
      // Arrange
      const { sketch } = QUICK_START_EXAMPLE;

      // Act
      const sources = sketch.dependencies.map((dependency) =>
        getDependencySource(dependency)
      );

      // Assert
      expect(sources).toEqual([
        "./index.js",
        "../../../helpers/format/index.js",
        "./Button.css",
        "../../components/atoms/Button/index.js",
        "../../components/atoms/Button/index.js",
        "../../helpers/format/index.js",
        "../../components/atoms/Button/Button.spec.js",
        "react",
        "./modules/checkout/index.js",
      ]);
    });

    it("should write the name of an external target as it is", () => {
      // Act
      const source = getDependencySource({
        ...toNode("src/a.js", "x"),
        target: { kind: "external", name: "@scope/pkg/sub" },
      });

      // Assert
      expect(source).toBe("@scope/pkg/sub");
    });

    it("should start the source of a file in the same folder with ./", () => {
      // Act
      const source = getDependencySource(toNode("src/a.js", "src/b.js"));

      // Assert
      expect(source).toBe("./b.js");
    });

    it("should start the source of a file at the root with ./", () => {
      // Act
      const source = getDependencySource(toNode("a.js", "b.js"));

      // Assert
      expect(source).toBe("./b.js");
    });

    it("should go up with ../ for a file in a parent folder", () => {
      // Act
      const source = getDependencySource(toNode("src/a/b/c.js", "src/util.js"));

      // Assert
      expect(source).toBe("../../util.js");
    });

    it("should go up to the root with ../ for a file at the root", () => {
      // Act
      const source = getDependencySource(toNode("src/a/b/c.js", "root.js"));

      // Assert
      expect(source).toBe("../../../root.js");
    });

    it("should go up and down for a file of a sibling tree", () => {
      // Act
      const source = getDependencySource(toNode("src/a/b/c.js", "lib/x/y.js"));

      // Assert
      expect(source).toBe("../../../lib/x/y.js");
    });

    it("should go down from the folder of the file for a file below it", () => {
      // Act
      const source = getDependencySource(toNode("src/a.js", "src/b/c/d.js"));

      // Assert
      expect(source).toBe("./b/c/d.js");
    });

    it("should go down from the root for a file below the root", () => {
      // Act
      const source = getDependencySource(toNode("a.js", "src/b.js"));

      // Assert
      expect(source).toBe("./src/b.js");
    });

    it("should not count the name of the target as a folder in common", () => {
      // Act: a node target that is a folder, which the sketch refuses but a caller can pass
      const source = getDependencySource(toNode("src/b/x.js", "src/b"));

      // Assert
      expect(source).toBe("../b");
    });

    it("should write the /index of a file that is the index of its folder", () => {
      // Act
      const source = getDependencySource(
        toNode("src/a.js", "src/helpers/format/index.js")
      );

      // Assert
      expect(source).toBe("./helpers/format/index.js");
    });

    it("should write ./index.js for the index of the same folder", () => {
      // Act
      const source = getDependencySource(
        toNode("src/a/spec.js", "src/a/index.js")
      );

      // Assert
      expect(source).toBe("./index.js");
    });

    it("should write ../index.js for the index of the parent folder", () => {
      // Act
      const source = getDependencySource(toNode("src/a/b.js", "src/index.js"));

      // Assert
      expect(source).toBe("../index.js");
    });

    it("should write ../../index.js for the index of a folder two levels up", () => {
      // Act
      const source = getDependencySource(toNode("a/b/c.js", "index.js"));

      // Assert
      expect(source).toBe("../../index.js");
    });

    it("should write the index of a folder two levels up and then down", () => {
      // Act
      const source = getDependencySource(toNode("a/b/c.js", "d/index.js"));

      // Assert
      expect(source).toBe("../../d/index.js");
    });

    it("should write the index of a file that has no extension in full", () => {
      // Act
      const source = getDependencySource(toNode("src/main.js", "src/u/index"));

      // Assert
      expect(source).toBe("./u/index");
    });

    it.each(CODE_EXTENSIONS)(
      "should keep the extension %s of the file",
      (extension) => {
        // Act
        const source = getDependencySource(
          toNode("src/a.js", `src/b${extension}`)
        );

        // Assert
        expect(source).toBe(`./b${extension}`);
      }
    );

    it("should keep the extension of a declaration file", () => {
      // Act
      const source = getDependencySource(
        toNode("src/a.ts", "src/types/index.d.ts")
      );

      // Assert
      expect(source).toBe("./types/index.d.ts");
    });

    it("should keep the extension of a file that is not a module", () => {
      // Act
      const sources = [
        "src/styles.css",
        "src/data.json",
        "src/addon.node",
        "src/README.md",
        "src/Makefile",
      ].map((path) => getDependencySource(toNode("src/a.js", path)));

      // Assert
      expect(sources).toEqual([
        "./styles.css",
        "./data.json",
        "./addon.node",
        "./README.md",
        "./Makefile",
      ]);
    });

    it("should keep a name that is only an extension", () => {
      // Act
      const source = getDependencySource(toNode("src/a.js", "src/.js"));

      // Assert
      expect(source).toBe("./.js");
    });

    it("should write the file beside a folder that has the same name, and the index of that folder, apart", () => {
      // Act
      const file = getDependencySource(toNode("src/x.js", "src/Button.js"));
      const index = getDependencySource(
        toNode("src/x.js", "src/Button/index.js")
      );

      // Assert
      expect(file).toBe("./Button.js");
      expect(index).toBe("./Button/index.js");
    });

    it("should write the full path of a target whatever the other files of the sketch are", () => {
      // Act
      const sources = ["src/b.js", "src/b.ts", "src/b/index.js"].map((path) =>
        getDependencySource(toNode("src/a.js", path))
      );

      // Assert
      expect(sources).toEqual(["./b.js", "./b.ts", "./b/index.js"]);
    });

    it("should write a source that resolves back to the target for every file dependency of the quick start example", () => {
      // Arrange
      const { sketch } = QUICK_START_EXAMPLE;
      const files = sketch.tree.map(({ path }) => path);
      const fileDependencies = sketch.dependencies.filter(
        ({ target }) => target.kind === "node"
      );

      // Act
      const resolved = fileDependencies.map((dependency) =>
        resolveSource(files, dependency.from, getDependencySource(dependency))
      );

      // Assert
      expect(resolved).toEqual([
        "src/components/atoms/Button/index.js",
        "src/helpers/format/index.js",
        "src/components/atoms/Button/Button.css",
        "src/components/atoms/Button/index.js",
        "src/components/atoms/Button/index.js",
        "src/helpers/format/index.js",
        "src/components/atoms/Button/Button.spec.js",
        "src/modules/checkout/index.js",
      ]);
    });

    it("should write a source that resolves back to the target even when other files could be read from a shorter one", () => {
      // Arrange
      const files = [
        "src/a.js",
        "src/b.js",
        "src/b.ts",
        "src/b/index.js",
        "src/b/index.mjs",
      ];

      // Act
      const resolved = files.slice(1).map((path) => {
        const source = getDependencySource(toNode("src/a.js", path));

        return [source, resolveSource(files, "src/a.js", source)];
      });

      // Assert
      expect(resolved).toEqual([
        ["./b.js", "src/b.js"],
        ["./b.ts", "src/b.ts"],
        ["./b/index.js", "src/b/index.js"],
        ["./b/index.mjs", "src/b/index.mjs"],
      ]);
    });
  });

  describe("findSourceFiles", () => {
    it("should give the file that the source names exactly, alone, though longer names could be added to it", () => {
      // Arrange
      const files = new Set(["src/a.js", "src/b.js", "src/b.js.ts"]);

      // Act
      const found = findSourceFiles(files, "src/a.js", "./b.js");

      // Assert
      expect(found).toEqual(["src/b.js"]);
    });

    it("should give the files that add a code extension, in the order of the extensions, and then the indexes in the same order", () => {
      // Arrange
      const files = new Set([
        "src/a.js",
        "src/b/index.d.ts",
        "src/b.d.ts",
        "src/b/index.js",
        "src/b.cts",
        "src/b.js",
        "src/b/index.mjs",
        "src/b.ts",
      ]);

      // Act
      const found = findSourceFiles(files, "src/a.js", "./b");

      // Assert
      expect(found).toEqual([
        "src/b.js",
        "src/b.ts",
        "src/b.cts",
        "src/b.d.ts",
        "src/b/index.js",
        "src/b/index.mjs",
        "src/b/index.d.ts",
      ]);
    });

    it("should try every code extension in its order, for the files and for the indexes", () => {
      // Arrange
      const files = new Set([
        "src/a.js",
        ...[...CODE_EXTENSIONS]
          .reverse()
          .map((extension) => `src/b${extension}`),
        ...[...CODE_EXTENSIONS]
          .reverse()
          .map((extension) => `src/b/index${extension}`),
      ]);

      // Act
      const found = findSourceFiles(files, "src/a.js", "./b");

      // Assert
      expect(found).toEqual([
        "src/b.js",
        "src/b.jsx",
        "src/b.ts",
        "src/b.tsx",
        "src/b.mjs",
        "src/b.cjs",
        "src/b.mts",
        "src/b.cts",
        "src/b.d.ts",
        "src/b/index.js",
        "src/b/index.jsx",
        "src/b/index.ts",
        "src/b/index.tsx",
        "src/b/index.mjs",
        "src/b/index.cjs",
        "src/b/index.mts",
        "src/b/index.cts",
        "src/b/index.d.ts",
      ]);
    });

    it("should give only the indexes of the folder for a source that names a folder", () => {
      // Arrange
      const files = new Set([
        "src/a.js",
        "src/b.js",
        "src/b/index.ts",
        "src/b/index.js",
        "src/b/other.js",
      ]);

      // Act
      const found = [".", "./b/", "../src/b/"].map((source) =>
        findSourceFiles(files, "src/a.js", source)
      );

      // Assert
      expect(found).toEqual([
        [],
        ["src/b/index.js", "src/b/index.ts"],
        ["src/b/index.js", "src/b/index.ts"],
      ]);
    });

    it("should give nothing for a source that is not relative, that goes above the root or that matches no file", () => {
      // Arrange
      const files = new Set(["src/a.js", "src/react.js", "b.js"]);

      // Act
      const found = ["react", "./missing", "../../b", "../.."].map((source) =>
        findSourceFiles(files, "src/a.js", source)
      );

      // Assert
      expect(found).toEqual([[], [], [], []]);
    });
  });

  describe("resolveSource", () => {
    it("should resolve a source that names a file exactly to that file", () => {
      // Act
      const source = resolveSource(
        ["src/a.js", "src/b.js"],
        "src/a.js",
        "./b.js"
      );

      // Assert
      expect(source).toBe("src/b.js");
    });

    it("should resolve the path as written before a longer name that adds an extension to it", () => {
      // Arrange
      const files = ["src/a.js", "src/b.css", "src/b.css.js"];

      // Act
      const source = resolveSource(files, "src/a.js", "./b.css");

      // Assert
      expect(source).toBe("src/b.css");
    });

    it("should resolve a file that is not a module exactly, as written", () => {
      // Arrange
      const files = [
        "src/a.js",
        "src/Button.css",
        "src/data.json",
        "src/LICENSE",
      ];

      // Act
      const resolved = ["./Button.css", "./data.json", "./LICENSE"].map(
        (source) => resolveSource(files, "src/a.js", source)
      );

      // Assert
      expect(resolved).toEqual([
        "src/Button.css",
        "src/data.json",
        "src/LICENSE",
      ]);
    });

    it("should resolve a file named like an index, without extension, exactly", () => {
      // Arrange
      const files = ["src/a.js", "src/x/index"];

      // Act
      const source = resolveSource(files, "src/a.js", "./x/index");

      // Assert
      expect(source).toBe("src/x/index");
    });

    it.each(CODE_EXTENSIONS)(
      "should resolve a source without extension to a file with the extension %s",
      (extension) => {
        // Act
        const source = resolveSource(
          ["src/a.js", `src/b${extension}`],
          "src/a.js",
          "./b"
        );

        // Assert
        expect(source).toBe(`src/b${extension}`);
      }
    );

    it.each(CODE_EXTENSIONS)(
      "should resolve a source to the index of a folder with the extension %s",
      (extension) => {
        // Act
        const source = resolveSource(
          ["src/a.js", `src/b/index${extension}`],
          "src/a.js",
          "./b"
        );

        // Assert
        expect(source).toBe(`src/b/index${extension}`);
      }
    );

    it("should resolve a declaration file from its name without .d.ts", () => {
      // Act
      const source = resolveSource(
        ["src/a.ts", "src/types.d.ts"],
        "src/a.ts",
        "./types"
      );

      // Assert
      expect(source).toBe("src/types.d.ts");
    });

    it("should not resolve a source that names an extension to a file with another one", () => {
      // Act
      const resolved = ["./b.js", "./b.jsx", "./b.ts"].map((source) =>
        resolveSource(["src/a.js", "src/b.tsx"], "src/a.js", source)
      );

      // Assert
      expect(resolved).toEqual([undefined, undefined, undefined]);
    });

    it("should give undefined for a source that can be several files, and pick none", () => {
      // Arrange
      const files = [
        ["src/a.js", "src/b.ts", "src/b.js"],
        ["src/a.js", "src/b.js", "src/b/index.js"],
        ["src/a.js", "src/b/index.js", "src/b/index.ts"],
        ["src/a.js", "src/b.mts", "src/b.d.ts"],
      ];

      // Act
      const resolved = files.map((list) =>
        resolveSource(list, "src/a.js", "./b")
      );

      // Assert
      expect(resolved).toEqual([undefined, undefined, undefined, undefined]);
    });

    it("should resolve a source that ends with / to the index of the folder, beside a file with the same name", () => {
      // Arrange
      const files = ["src/a.js", "src/b.js", "src/b/index.js"];

      // Act
      const sources = ["./b/", "../src/b/"].map((source) =>
        resolveSource(files, "src/a.js", source)
      );

      // Assert
      expect(sources).toEqual(["src/b/index.js", "src/b/index.js"]);
    });

    it("should give undefined for a source without / that names a file and a folder with the same name", () => {
      // Arrange
      const files = ["src/a.js", "src/b.js", "src/b/index.js"];

      // Act
      const source = resolveSource(files, "src/a.js", "./b");

      // Assert
      expect(source).toBeUndefined();
    });

    it("should not resolve a source that ends with / to a file with the same name", () => {
      // Act
      const source = resolveSource(
        ["src/a.js", "src/b.js"],
        "src/a.js",
        "./b/"
      );

      // Assert
      expect(source).toBeUndefined();
    });

    it("should not add an extension to the name of a folder that a source names", () => {
      // Arrange: `src.js` is what `src` plus an extension would be, but `.`, `./` and `../src/.` name the folder
      const files = ["src.js", "src/a.js"];

      // Act
      const resolved = [".", "./", "../src/."].map((source) =>
        resolveSource(files, "src/a.js", source)
      );
      const asFile = resolveSource(files, "src/a.js", "../src");

      // Assert
      expect(resolved).toEqual([undefined, undefined, undefined]);
      expect(asFile).toBe("src.js");
    });

    it("should resolve a source that goes up", () => {
      // Arrange
      const files = ["src/a/b/c.js", "src/helpers/format/index.js"];

      // Act
      const source = resolveSource(
        files,
        "src/a/b/c.js",
        "../../helpers/format"
      );

      // Assert
      expect(source).toBe("src/helpers/format/index.js");
    });

    it("should skip . and empty segments and follow .. in the middle", () => {
      // Arrange
      const files = ["src/a.js", "src/c/d.js"];

      // Act
      const source = resolveSource(files, "src/a.js", "./b/../c//./d");

      // Assert
      expect(source).toBe("src/c/d.js");
    });

    it("should resolve a source that reaches the root to the index of the root", () => {
      // Arrange
      const files = ["a/b/c.js", "index.js"];

      // Act
      const sources = ["../..", "../../", "../../index", "../.././.."].map(
        (source) => resolveSource(files, "a/b/c.js", source)
      );

      // Assert
      expect(sources).toEqual(["index.js", "index.js", "index.js", undefined]);
    });

    it("should not add an extension to the root, which has no name", () => {
      // Arrange
      const files = ["a/b/c.js", ".js", "x.js"];

      // Act
      const source = resolveSource(files, "a/b/c.js", "../..");

      // Assert
      expect(source).toBeUndefined();
    });

    it.each([
      ["./", "src/index.js"],
      [".", "src/index.js"],
      ["..", "index.js"],
      ["../", "index.js"],
      ["../..", undefined],
      ["./..", "index.js"],
      ["./b/..", "src/index.js"],
      ["./b/.", "src/b/index.js"],
    ])(
      "should read the folder source %s of src/a.js as the index of that folder",
      (source, expected) => {
        // Arrange
        const files = [
          "src/a.js",
          "src/index.js",
          "src/b/index.js",
          "index.js",
        ];

        // Act
        const resolved = resolveSource(files, "src/a.js", source);

        // Assert
        expect(resolved).toBe(expected);
      }
    );

    it("should resolve a source of a file at the root", () => {
      // Act
      const source = resolveSource(["a.js", "b.js"], "a.js", "./b");

      // Assert
      expect(source).toBe("b.js");
    });

    it("should resolve the index of the root from a file at the root", () => {
      // Act
      const sources = [".", "./"].map((source) =>
        resolveSource(["a.js", "index.js"], "a.js", source)
      );

      // Assert
      expect(sources).toEqual(["index.js", "index.js"]);
    });

    it("should give undefined for a source that goes above the root", () => {
      // Act
      const sources = ["../../b", "..", "../b", "../.."].map((source) =>
        resolveSource(["src/a.js", "b.js", "a.js", "index.js"], "a.js", source)
      );
      const fromFolder = resolveSource(
        ["src/a.js", "b.js"],
        "src/a.js",
        "../../b"
      );

      // Assert
      expect(sources).toEqual([undefined, undefined, undefined, undefined]);
      expect(fromFolder).toBeUndefined();
    });

    it("should give undefined for a source that is not relative", () => {
      // Arrange
      const files = ["src/a.js", "src/react.js", "src/index.js"];

      // Act
      const sources = ["react", "/src/react", "src/react", ".react", "..."];

      // Assert
      expect(
        sources.map((source) => resolveSource(files, "src/a.js", source))
      ).toEqual([undefined, undefined, undefined, undefined, undefined]);
    });

    it("should give undefined for a source that resolves to no file", () => {
      // Act
      const source = resolveSource(["src/a.js"], "src/a.js", "./missing");

      // Assert
      expect(source).toBeUndefined();
    });

    it("should not resolve a folder", () => {
      // Act
      const source = resolveSource(
        ["src/a.js", "src/b/c.js"],
        "src/a.js",
        "./b"
      );

      // Assert
      expect(source).toBeUndefined();
    });
  });

  describe("toStatement", () => {
    it.each(FORMS)("should write %s", (_label, statement, expected) => {
      // Act
      const text = toStatement(statement, statement.source);

      // Assert
      expect(text).toBe(expected);
    });

    it("should write the source it is given", () => {
      // Act
      const text = toStatement(
        createStatement({ specifiers: specifiers("named", "Button") }),
        "../../components/atoms/Button"
      );

      // Assert
      expect(text).toBe(
        'import { Button } from "../../components/atoms/Button";'
      );
    });

    it("should write a default name before the named names, whatever the order of the specifiers", () => {
      // Act
      const text = toStatement(
        createStatement({
          specifiers: [
            ...specifiers("named", "a"),
            ...specifiers("default", "d"),
          ],
        }),
        "./a"
      );

      // Assert
      expect(text).toBe('import d, { a } from "./a";');
    });
  });

  describe("toStatementTokens", () => {
    it("should give a keyword, a source and text pieces for an import with names", () => {
      // Act
      const tokens = toStatementTokens(
        createStatement({ specifiers: specifiers("named", "Button") }),
        "./index"
      );

      // Assert
      expect(toPairs(tokens)).toEqual([
        ["keyword", "import"],
        ["text", " { Button } "],
        ["keyword", "from"],
        ["text", " "],
        ["source", '"./index"'],
        ["text", ";"],
      ]);
    });

    it("should color the as of an alias and the type of a type import", () => {
      // Act
      const tokens = toStatementTokens(
        createStatement({
          importKind: "type",
          specifiers: [
            ...specifiers("default", "d"),
            ...specifiers("named", "a as b"),
          ],
        }),
        "./a"
      );

      // Assert
      expect(toPairs(tokens)).toEqual([
        ["keyword", "import"],
        ["text", " "],
        ["keyword", "type"],
        ["text", " d, { a "],
        ["keyword", "as"],
        ["text", " b } "],
        ["keyword", "from"],
        ["text", " "],
        ["source", '"./a"'],
        ["text", ";"],
      ]);
    });

    it("should color the as of a namespace", () => {
      // Act
      const tokens = toStatementTokens(
        createStatement({
          syntax: "export-from",
          specifiers: specifiers("namespace", "ns"),
        }),
        "./a"
      );

      // Assert
      expect(toPairs(tokens)).toEqual([
        ["keyword", "export"],
        ["text", " * "],
        ["keyword", "as"],
        ["text", " ns "],
        ["keyword", "from"],
        ["text", " "],
        ["source", '"./a"'],
        ["text", ";"],
      ]);
    });

    it("should give a keyword and a source for a side-effect import", () => {
      // Act
      const tokens = toStatementTokens(createStatement(), "./Button.css");

      // Assert
      expect(toPairs(tokens)).toEqual([
        ["keyword", "import"],
        ["text", " "],
        ["source", '"./Button.css"'],
        ["text", ";"],
      ]);
    });

    it("should give the call as a keyword, a source and text", () => {
      // Act
      const required = toStatementTokens(
        createStatement({ syntax: "require" }),
        "fs"
      );
      const dynamic = toStatementTokens(
        createStatement({ syntax: "dynamic-import" }),
        "fs"
      );

      // Assert
      expect(toPairs(required)).toEqual([
        ["keyword", "require"],
        ["text", "("],
        ["source", '"fs"'],
        ["text", ");"],
      ]);
      expect(toPairs(dynamic)).toEqual([
        ["keyword", "import"],
        ["text", "("],
        ["source", '"fs"'],
        ["text", ");"],
      ]);
    });

    it("should color the export, the type and the from of a type export of everything", () => {
      // Act
      const tokens = toStatementTokens(
        createStatement({ syntax: "export-from", importKind: "type" }),
        "./a"
      );

      // Assert
      expect(toPairs(tokens)).toEqual([
        ["keyword", "export"],
        ["text", " "],
        ["keyword", "type"],
        ["text", " * "],
        ["keyword", "from"],
        ["text", " "],
        ["source", '"./a"'],
        ["text", ";"],
      ]);
    });

    it("should not color a name that looks like a keyword", () => {
      // Act
      const tokens = toStatementTokens(
        createStatement({ specifiers: specifiers("default", "from") }),
        "./a"
      );

      // Assert
      expect(toPairs(tokens)).toEqual([
        ["keyword", "import"],
        ["text", " from "],
        ["keyword", "from"],
        ["text", " "],
        ["source", '"./a"'],
        ["text", ";"],
      ]);
    });

    it.each(FORMS)(
      "should join the pieces of %s into its statement",
      (_label, statement, expected) => {
        // Act
        const tokens = toStatementTokens(statement, statement.source);

        // Assert
        expect(tokens.map(({ text }) => text).join("")).toBe(expected);
      }
    );

    it.each(FORMS)(
      "should never give two text pieces in a row for %s",
      (_label, statement) => {
        // Act
        const kinds = toStatementTokens(statement, statement.source).map(
          ({ kind }) => kind
        );

        // Assert
        expect(kinds.join(",")).not.toContain("text,text");
      }
    );
  });

  describe("parseStatement", () => {
    it.each(FORMS)("should read back %s", (_label, statement, text) => {
      // Act
      const parsed = parseStatement(text);

      // Assert
      expect(parsed).toStrictEqual(statement);
    });

    it("should read the source without its quotes", () => {
      // Act
      const parsed = parseStatement('import "../../a b/c.css";');

      // Assert
      expect(parsed?.source).toBe("../../a b/c.css");
    });

    it("should read a statement with extra spaces", () => {
      // Act
      const parsed = parseStatement(
        '   import   format ,  {  round   as   r  }   from   "./a"  ;   '
      );

      // Assert
      expect(parsed).toStrictEqual(
        createStatement({
          specifiers: [...specifiers("default", "format"), ...ROUND],
        })
      );
    });

    it("should read a statement with a tab", () => {
      // Act
      const parsed = parseStatement('\timport\t{ a }\tfrom\t"./a";');

      // Assert
      expect(parsed).toStrictEqual(
        createStatement({ specifiers: specifiers("named", "a") })
      );
    });

    it("should read single quotes", () => {
      // Act
      const parsed = parseStatement("import { a } from './a';");

      // Assert
      expect(parsed).toStrictEqual(
        createStatement({ specifiers: specifiers("named", "a") })
      );
    });

    it("should read a statement without the final semicolon", () => {
      // Act
      const parsed = parseStatement('export * from "./a"');

      // Assert
      expect(parsed).toStrictEqual(createStatement({ syntax: "export-from" }));
    });

    it("should read a statement without spaces around the braces and the quotes", () => {
      // Act
      const parsed = parseStatement('import{a,b as c}from"./a"');

      // Assert
      expect(parsed).toStrictEqual(
        createStatement({ specifiers: specifiers("named", "a", "b as c") })
      );
    });

    it("should read a call with spaces", () => {
      // Act
      const required = parseStatement(" require ( './a' ) ;");
      const dynamic = parseStatement('import ( "./a" )');

      // Assert
      expect(required).toStrictEqual(createStatement({ syntax: "require" }));
      expect(dynamic).toStrictEqual(
        createStatement({ syntax: "dynamic-import" })
      );
    });

    it("should read the source of a module and an empty source", () => {
      // Act
      const reactSource = parseStatement('import React from "react";');
      const empty = parseStatement('import "";');

      // Assert
      expect(reactSource?.source).toBe("react");
      expect(empty?.source).toBe("");
    });

    it("should read a name that is a keyword of the statement as a name", () => {
      // Act
      const parsed = parseStatement(
        'import from, { as, type as from, as as as } from "./a";'
      );

      // Assert
      expect(parsed).toStrictEqual(
        createStatement({
          specifiers: [
            ...specifiers("default", "from"),
            ...specifiers("named", "as", "type as from", "as as as"),
          ],
        })
      );
    });

    it("should read type as a default name when nothing makes it the kind", () => {
      // Act
      const plain = parseStatement('import type from "./a";');
      const withNamed = parseStatement('import type, { a } from "./a";');
      const typedFrom = parseStatement('import type from from "./a";');

      // Assert
      expect(plain).toStrictEqual(
        createStatement({ specifiers: specifiers("default", "type") })
      );
      expect(withNamed).toStrictEqual(
        createStatement({
          specifiers: [
            ...specifiers("default", "type"),
            ...specifiers("named", "a"),
          ],
        })
      );
      expect(typedFrom).toStrictEqual(
        createStatement({
          importKind: "type",
          specifiers: specifiers("default", "from"),
        })
      );
    });

    it("should read type as a named name of an export", () => {
      // Act
      const parsed = parseStatement('export { type } from "./a";');

      // Assert
      expect(parsed).toStrictEqual(
        createStatement({
          syntax: "export-from",
          specifiers: specifiers("named", "type"),
        })
      );
    });

    it("should read the words that are not valid names, so that the sketch refuses them with a reason", () => {
      // Act
      const parsed = parseStatement('import { 1a-b as @ } from "./a";');

      // Assert
      expect(parsed?.specifiers).toEqual(specifiers("named", "1a-b as @"));
    });

    it.each([
      ["an empty text", ""],
      ["blank text", "   "],
      ["only a semicolon", ";"],
      ["a word", "hello"],
      ["a call of another function", 'foo("./a");'],
      ["an assignment of a require", 'import a = require("./a");'],
      ["an export without from", "export { a };"],
      ["a default export", "export default a;"],
      ["an import of an empty list", 'import {} from "./a";'],
      ["an export of an empty list", 'export {} from "./a";'],
      ["an import without from", 'import { a } "./a";'],
      ["an import without names or source", "import;"],
      ["an import without a source", "import a from;"],
      ["an import with a trailing comma", 'import { a, } from "./a";'],
      ["an import with a leading comma", 'import { , a } from "./a";'],
      ["an import of two names without a comma", 'import { a b } from "./a";'],
      ["an alias without a name", 'import { a as } from "./a";'],
      ["a name with two aliases", 'import { a as b as c } from "./a";'],
      ["a nested list", 'import { { a } } from "./a";'],
      ["a list that is not closed", 'import { a from "./a";'],
      ["a default name followed by nothing", 'import a, from "./a";'],
      [
        "a default name and a list without a comma",
        'import a { b } from "./a";',
      ],
      ["a namespace without a name", 'import * as from "./a";'],
      ["a namespace named by a string", 'import * as "ns" from "./a";'],
      ["a namespace without as", 'import * ns from "./a";'],
      ["a namespace and a list", 'import * as ns, { a } from "./a";'],
      ["a list before the default name", 'import { a }, d from "./a";'],
      ["a type import without names", 'import type "./a";'],
      ["a type before nothing", 'export type from "./a";'],
      ["two sources", 'import "./a" "./b";'],
      ["a source that is not closed", 'import "./a;'],
      ["a template literal", "import a from `./a`;"],
      ["a backslash in a source", 'import "a\\b";'],
      ["a quote inside a source", "import a from 'a\"b';"],
      ["two semicolons", 'import "./a";;'],
      ["a semicolon inside", 'import a; from "./a";'],
      ["a require without a source", "require();"],
      ["a require with two arguments", 'require("./a", "./b");'],
      ["a require with a name instead of a source", "require(a);"],
      ["a require that is not closed", 'require("./a";'],
      ["a call with something after it", 'import("./a").then();'],
      ["a call of an import with a name", "import(a);"],
      ["a re-export of a namespace without a name", 'export * as from "./a";'],
    ])("should give undefined for %s", (_label, text) => {
      // Act
      const parsed = parseStatement(text);

      // Assert
      expect(parsed).toBeUndefined();
    });
  });
});
