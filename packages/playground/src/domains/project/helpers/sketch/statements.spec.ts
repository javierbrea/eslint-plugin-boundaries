import type { SketchDependency, SketchSpecifier } from "@/contract";
import { QUICK_START_EXAMPLE } from "@/domains/examples/data/examples";

import type {
  ParsedStatement,
  SourceResolver,
  StatementToken,
} from "./sketch.types";
import {
  getDependencySource,
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

/** The `node` resolver with its default extensions, written out so that the specs say what it tries */
const NODE: SourceResolver = {
  name: "node",
  extensions: [".mjs", ".js", ".json", ".node"],
};

/** The `typescript` resolver with its default extensions, written out so that the specs say what it tries */
const TYPESCRIPT: SourceResolver = {
  name: "typescript",
  extensions: [".ts", ".tsx", ".d.ts", ".js", ".jsx", ".json", ".node"],
};

const NODE_RESOLVERS: readonly SourceResolver[] = [NODE];

const TYPESCRIPT_RESOLVERS: readonly SourceResolver[] = [TYPESCRIPT];

/** The file of a source of `src/main.js` among some files, for each resolver alone, as `eslint-import-resolver-node` 0.3.9 and `eslint-import-resolver-typescript` 4.4.5 find it on real files. `undefined` is a source that the resolver does not find */
const RESOLUTIONS: readonly {
  readonly source: string;
  readonly files: readonly string[];
  readonly node: string | undefined;
  readonly typescript: string | undefined;
}[] = [
  {
    source: "./x/f-js",
    files: ["src/x/f-js.js"],
    node: "src/x/f-js.js",
    typescript: "src/x/f-js.js",
  },
  {
    source: "./x/f-jsx",
    files: ["src/x/f-jsx.jsx"],
    node: undefined,
    typescript: "src/x/f-jsx.jsx",
  },
  {
    source: "./x/f-mjs",
    files: ["src/x/f-mjs.mjs"],
    node: "src/x/f-mjs.mjs",
    typescript: undefined,
  },
  {
    source: "./x/f-cjs",
    files: ["src/x/f-cjs.cjs"],
    node: undefined,
    typescript: undefined,
  },
  {
    source: "./x/f-mts",
    files: ["src/x/f-mts.mts"],
    node: undefined,
    typescript: undefined,
  },
  {
    source: "./x/f-cts",
    files: ["src/x/f-cts.cts"],
    node: undefined,
    typescript: undefined,
  },
  {
    source: "./x/f-ts",
    files: ["src/x/f-ts.ts"],
    node: undefined,
    typescript: "src/x/f-ts.ts",
  },
  {
    source: "./x/f-tsx",
    files: ["src/x/f-tsx.tsx"],
    node: undefined,
    typescript: "src/x/f-tsx.tsx",
  },
  {
    source: "./x/f-json",
    files: ["src/x/f-json.json"],
    node: "src/x/f-json.json",
    typescript: "src/x/f-json.json",
  },
  {
    source: "./price",
    files: ["src/price.json", "src/price/index.js"],
    node: "src/price.json",
    typescript: "src/price.json",
  },
  {
    source: "./a",
    files: ["src/a.mjs", "src/a.js"],
    node: "src/a.mjs",
    typescript: "src/a.js",
  },
  {
    source: "./b",
    files: ["src/b.ts", "src/b.js"],
    node: "src/b.js",
    typescript: "src/b.ts",
  },
  {
    source: "./c",
    files: ["src/c.ts", "src/c.tsx"],
    node: undefined,
    typescript: "src/c.ts",
  },
  {
    source: "./q",
    files: ["src/q/index.json"],
    node: "src/q/index.json",
    typescript: "src/q/index.json",
  },
  {
    source: "./p",
    files: ["src/p/index.ts", "src/p/index.tsx", "src/p/index.js"],
    node: "src/p/index.js",
    typescript: "src/p/index.ts",
  },
  {
    source: "./r",
    files: ["src/r/index.mjs", "src/r/index.jsx"],
    node: "src/r/index.mjs",
    typescript: "src/r/index.jsx",
  },
  {
    source: "./s",
    files: ["src/s.js", "src/s/index.js"],
    node: "src/s.js",
    typescript: "src/s.js",
  },
  {
    source: "./s/",
    files: ["src/s.js", "src/s/index.js"],
    node: "src/s/index.js",
    typescript: "src/s/index.js",
  },
  {
    source: "./price/",
    files: ["src/price.json", "src/price/index.js"],
    node: "src/price/index.js",
    typescript: "src/price/index.js",
  },
  {
    source: "./b.js",
    files: ["src/b.ts", "src/b.js"],
    node: "src/b.js",
    typescript: "src/b.ts",
  },
  {
    source: "./only.js",
    files: ["src/only.ts"],
    node: undefined,
    typescript: "src/only.ts",
  },
  {
    source: "./m.mjs",
    files: ["src/m.mts", "src/m.mjs"],
    node: "src/m.mjs",
    typescript: "src/m.mts",
  },
  {
    source: "./m",
    files: ["src/m.mts", "src/m.mjs"],
    node: "src/m.mjs",
    typescript: undefined,
  },
  {
    source: "./d",
    files: ["src/d.d.ts"],
    node: undefined,
    typescript: "src/d.d.ts",
  },
  {
    source: "./folder",
    files: ["src/folder/index.d.ts"],
    node: undefined,
    typescript: "src/folder/index.d.ts",
  },
  {
    source: "./x/f-jsx.js",
    files: ["src/x/f-jsx.jsx"],
    node: undefined,
    typescript: undefined,
  },
  {
    source: "./x/f-tsx.js",
    files: ["src/x/f-tsx.tsx"],
    node: undefined,
    typescript: "src/x/f-tsx.tsx",
  },
  {
    source: "./a.jsx",
    files: ["src/a.js"],
    node: undefined,
    typescript: undefined,
  },
  {
    source: "./c.ts",
    files: ["src/c.js"],
    node: undefined,
    typescript: "src/c.js",
  },
  {
    source: "./d.tsx",
    files: ["src/d.jsx"],
    node: undefined,
    typescript: "src/d.jsx",
  },
  {
    source: "./e.cjs",
    files: ["src/e.cts"],
    node: undefined,
    typescript: "src/e.cts",
  },
  {
    source: "./f.mts",
    files: ["src/f.mjs"],
    node: undefined,
    typescript: "src/f.mjs",
  },
  {
    source: "./g.cts",
    files: ["src/g.cjs"],
    node: undefined,
    typescript: "src/g.cjs",
  },
  {
    source: "./h.js",
    files: ["src/h.d.ts"],
    node: undefined,
    typescript: "src/h.d.ts",
  },
  {
    source: "./u",
    files: ["src/u/index"],
    node: "src/u/index",
    typescript: "src/u/index",
  },
  {
    source: "./y.tsx",
    files: ["src/y.mjs"],
    node: undefined,
    typescript: undefined,
  },
  {
    source: "./z.ts",
    files: ["src/z.tsx"],
    node: undefined,
    typescript: undefined,
  },
  {
    source: "./price.json",
    files: ["src/price.json"],
    node: "src/price.json",
    typescript: "src/price.json",
  },
  {
    source: "./b.ts",
    files: ["src/b.ts"],
    node: "src/b.ts",
    typescript: "src/b.ts",
  },
  {
    source: "./c.tsx",
    files: ["src/c.tsx"],
    node: "src/c.tsx",
    typescript: "src/c.tsx",
  },
  {
    source: "./x/f-jsx.jsx",
    files: ["src/x/f-jsx.jsx"],
    node: "src/x/f-jsx.jsx",
    typescript: "src/x/f-jsx.jsx",
  },
  {
    source: "./a.mjs",
    files: ["src/a.mjs"],
    node: "src/a.mjs",
    typescript: "src/a.mjs",
  },
];

/**
 * Gets the pieces of a statement as pairs of kind and text, to compare them in one line.
 * @param tokens The pieces.
 */
function toPairs(tokens: readonly StatementToken[]): [string, string][] {
  return tokens.map(({ kind, text }) => [kind, text]);
}

describe("Statements", () => {
  describe("getDependencySource", () => {
    it("should write the sources of the dependencies of the quick start example", () => {
      // Arrange
      const { sketch } = QUICK_START_EXAMPLE;
      const files = sketch.tree.map(({ path }) => path);

      // Act
      const sources = sketch.dependencies.map((dependency) =>
        getDependencySource(files, dependency, NODE_RESOLVERS)
      );

      // Assert
      expect(sources).toEqual([
        "./index",
        "../../../helpers/format",
        "./Button.css",
        "../../components/atoms/Button",
        "../../components/atoms/Button",
        "../../helpers/format",
        "../../components/atoms/Button/Button.spec",
        "react",
        "./modules/checkout",
      ]);
    });

    it("should write the name of an external target as it is", () => {
      // Act
      const source = getDependencySource(
        ["src/a.js"],
        {
          ...toNode("src/a.js", "x"),
          target: { kind: "external", name: "@scope/pkg/sub" },
        },
        NODE_RESOLVERS
      );

      // Assert
      expect(source).toBe("@scope/pkg/sub");
    });

    it("should start the source of a file in the same folder with ./", () => {
      // Act
      const source = getDependencySource(
        ["src/a.js", "src/b.js"],
        toNode("src/a.js", "src/b.js"),
        NODE_RESOLVERS
      );

      // Assert
      expect(source).toBe("./b");
    });

    it("should start the source of a file at the root with ./", () => {
      // Act
      const source = getDependencySource(
        ["a.js", "b.js"],
        toNode("a.js", "b.js"),
        NODE_RESOLVERS
      );

      // Assert
      expect(source).toBe("./b");
    });

    it("should go up with ../ for a file in a parent folder", () => {
      // Act
      const source = getDependencySource(
        ["src/a/b/c.js", "src/util.js"],
        toNode("src/a/b/c.js", "src/util.js"),
        NODE_RESOLVERS
      );

      // Assert
      expect(source).toBe("../../util");
    });

    it("should go up and down for a file of a sibling tree", () => {
      // Act
      const source = getDependencySource(
        ["src/a/b/c.js", "lib/x/y.js"],
        toNode("src/a/b/c.js", "lib/x/y.js"),
        NODE_RESOLVERS
      );

      // Assert
      expect(source).toBe("../../../lib/x/y");
    });

    it("should go down from the folder of the file for a file below it", () => {
      // Act
      const source = getDependencySource(
        ["src/a.js", "src/b/c/d.js"],
        toNode("src/a.js", "src/b/c/d.js"),
        NODE_RESOLVERS
      );

      // Assert
      expect(source).toBe("./b/c/d");
    });

    it("should not count the name of the target as a folder in common", () => {
      // Act: a node target that is a folder, which the sketch refuses but a caller can pass
      const source = getDependencySource(
        ["src/b/x.js"],
        toNode("src/b/x.js", "src/b"),
        NODE_RESOLVERS
      );

      // Assert
      expect(source).toBe("../b");
    });

    it("should drop the /index of a file that is the index of its folder", () => {
      // Act
      const source = getDependencySource(
        ["src/a.js", "src/helpers/format/index.js"],
        toNode("src/a.js", "src/helpers/format/index.js"),
        NODE_RESOLVERS
      );

      // Assert
      expect(source).toBe("./helpers/format");
    });

    it("should keep ./index for the index of the same folder", () => {
      // Act
      const source = getDependencySource(
        ["src/a/spec.js", "src/a/index.js"],
        toNode("src/a/spec.js", "src/a/index.js"),
        NODE_RESOLVERS
      );

      // Assert
      expect(source).toBe("./index");
    });

    it("should keep ../index for the index of the parent folder", () => {
      // Act
      const source = getDependencySource(
        ["src/a/b.js", "src/index.js"],
        toNode("src/a/b.js", "src/index.js"),
        NODE_RESOLVERS
      );

      // Assert
      expect(source).toBe("../index");
    });

    it("should keep ../../index for the index of a folder two levels up", () => {
      // Act
      const source = getDependencySource(
        ["a/b/c.js", "index.js"],
        toNode("a/b/c.js", "index.js"),
        NODE_RESOLVERS
      );

      // Assert
      expect(source).toBe("../../index");
    });

    it("should drop the /index of a folder two levels up and then down", () => {
      // Act
      const source = getDependencySource(
        ["a/b/c.js", "d/index.js"],
        toNode("a/b/c.js", "d/index.js"),
        NODE_RESOLVERS
      );

      // Assert
      expect(source).toBe("../../d");
    });

    it.each([
      {
        resolver: "node",
        resolvers: NODE_RESOLVERS,
        extension: ".js",
        source: "./b",
      },
      {
        resolver: "node",
        resolvers: NODE_RESOLVERS,
        extension: ".mjs",
        source: "./b",
      },
      {
        resolver: "node",
        resolvers: NODE_RESOLVERS,
        extension: ".jsx",
        source: "./b.jsx",
      },
      {
        resolver: "node",
        resolvers: NODE_RESOLVERS,
        extension: ".cjs",
        source: "./b.cjs",
      },
      {
        resolver: "node",
        resolvers: NODE_RESOLVERS,
        extension: ".ts",
        source: "./b.ts",
      },
      {
        resolver: "node",
        resolvers: NODE_RESOLVERS,
        extension: ".tsx",
        source: "./b.tsx",
      },
      {
        resolver: "node",
        resolvers: NODE_RESOLVERS,
        extension: ".mts",
        source: "./b.mts",
      },
      {
        resolver: "node",
        resolvers: NODE_RESOLVERS,
        extension: ".cts",
        source: "./b.cts",
      },
      {
        resolver: "typescript",
        resolvers: TYPESCRIPT_RESOLVERS,
        extension: ".js",
        source: "./b",
      },
      {
        resolver: "typescript",
        resolvers: TYPESCRIPT_RESOLVERS,
        extension: ".jsx",
        source: "./b",
      },
      {
        resolver: "typescript",
        resolvers: TYPESCRIPT_RESOLVERS,
        extension: ".ts",
        source: "./b",
      },
      {
        resolver: "typescript",
        resolvers: TYPESCRIPT_RESOLVERS,
        extension: ".tsx",
        source: "./b",
      },
      {
        resolver: "typescript",
        resolvers: TYPESCRIPT_RESOLVERS,
        extension: ".mjs",
        source: "./b.mjs",
      },
      {
        resolver: "typescript",
        resolvers: TYPESCRIPT_RESOLVERS,
        extension: ".cjs",
        source: "./b.cjs",
      },
      {
        resolver: "typescript",
        resolvers: TYPESCRIPT_RESOLVERS,
        extension: ".mts",
        source: "./b.mts",
      },
      {
        resolver: "typescript",
        resolvers: TYPESCRIPT_RESOLVERS,
        extension: ".cts",
        source: "./b.cts",
      },
    ])(
      "should write a module of extension $extension as $source for the $resolver resolver",
      ({ resolvers, extension, source }) => {
        // Arrange
        const files = ["src/a.js", `src/b${extension}`];

        // Act
        const written = getDependencySource(
          files,
          toNode("src/a.js", `src/b${extension}`),
          resolvers
        );

        // Assert
        expect(written).toBe(source);
        expect(resolveSource(files, "src/a.js", written, resolvers)).toBe(
          `src/b${extension}`
        );
      }
    );

    it("should write the source of a TypeScript file without its extension when the typescript resolver is run", () => {
      // Act
      const source = getDependencySource(
        ["src/a.ts", "src/helpers/index.ts"],
        toNode("src/a.ts", "src/helpers/index.ts"),
        TYPESCRIPT_RESOLVERS
      );

      // Assert
      expect(source).toBe("./helpers");
    });

    it("should write the source of a TypeScript file with its extension when only the node resolver is run", () => {
      // Act
      const source = getDependencySource(
        ["src/a.ts", "src/helpers/index.ts"],
        toNode("src/a.ts", "src/helpers/index.ts"),
        NODE_RESOLVERS
      );

      // Assert
      expect(source).toBe("./helpers/index.ts");
    });

    it("should keep the extension of a file that is not a module", () => {
      // Act
      const sources = [
        "src/styles.css",
        "src/data.json",
        "src/README.md",
        "src/Makefile",
      ].map((path) =>
        getDependencySource(
          [path, "src/a.js"],
          toNode("src/a.js", path),
          NODE_RESOLVERS
        )
      );

      // Assert
      expect(sources).toEqual([
        "./styles.css",
        "./data.json",
        "./README.md",
        "./Makefile",
      ]);
    });

    it("should keep a name that is only an extension", () => {
      // Act
      const source = getDependencySource(
        ["src/.js", "src/a.js"],
        toNode("src/a.js", "src/.js"),
        NODE_RESOLVERS
      );

      // Assert
      expect(source).toBe("./.js");
    });

    it("should drop the whole extension of a declaration file when the typescript resolver is run", () => {
      // Arrange
      const files = ["src/a.ts", "src/types.d.ts"];

      // Act
      const source = getDependencySource(
        files,
        toNode("src/a.ts", "src/types.d.ts"),
        TYPESCRIPT_RESOLVERS
      );

      // Assert
      expect(source).toBe("./types");
      expect(
        resolveSource(files, "src/a.ts", source, TYPESCRIPT_RESOLVERS)
      ).toBe("src/types.d.ts");
    });

    it("should keep the extension of a declaration file when only the node resolver is run", () => {
      // Act
      const source = getDependencySource(
        ["src/a.ts", "src/types.d.ts"],
        toNode("src/a.ts", "src/types.d.ts"),
        NODE_RESOLVERS
      );

      // Assert
      expect(source).toBe("./types.d.ts");
    });

    it("should write the full path of a declaration file that another file of the same stem resolves before", () => {
      // Arrange
      const files = ["src/a.ts", "src/types.ts", "src/types.d.ts"];

      // Act
      const source = getDependencySource(
        files,
        toNode("src/a.ts", "src/types.d.ts"),
        TYPESCRIPT_RESOLVERS
      );

      // Assert
      expect(source).toBe("./types.d.ts");
      expect(
        resolveSource(files, "src/a.ts", source, TYPESCRIPT_RESOLVERS)
      ).toBe("src/types.d.ts");
    });

    it("should write the source of the file beside a folder that has the same name, and of the index of that folder", () => {
      // Arrange
      const files = ["src/x.js", "src/Button.js", "src/Button/index.js"];

      // Act
      const file = getDependencySource(
        files,
        toNode("src/x.js", "src/Button.js"),
        NODE_RESOLVERS
      );
      const index = getDependencySource(
        files,
        toNode("src/x.js", "src/Button/index.js"),
        NODE_RESOLVERS
      );

      // Assert
      expect(file).toBe("./Button");
      expect(index).toBe("./Button/index");
      expect(resolveSource(files, "src/x.js", file, NODE_RESOLVERS)).toBe(
        "src/Button.js"
      );
      expect(resolveSource(files, "src/x.js", index, NODE_RESOLVERS)).toBe(
        "src/Button/index.js"
      );
    });

    it("should write the extension when another extension resolves first", () => {
      // Arrange
      const files = ["src/x.js", "src/a.js", "src/a.ts"];

      // Act
      const first = getDependencySource(
        files,
        toNode("src/x.js", "src/a.js"),
        NODE_RESOLVERS
      );
      const second = getDependencySource(
        files,
        toNode("src/x.js", "src/a.ts"),
        NODE_RESOLVERS
      );

      // Assert
      expect(first).toBe("./a");
      expect(second).toBe("./a.ts");
    });

    it("should write the index with its extension when another index resolves first", () => {
      // Arrange
      const files = [
        "src/x/spec.js",
        "src/x/index.js",
        "src/x/index.ts",
        "src/y/z.js",
        "src/y/index.js",
        "src/y/index.tsx",
      ];

      // Act
      const sibling = getDependencySource(
        files,
        toNode("src/x/spec.js", "src/x/index.ts"),
        NODE_RESOLVERS
      );
      const above = getDependencySource(
        files,
        toNode("src/y/z.js", "src/y/index.tsx"),
        NODE_RESOLVERS
      );
      const other = getDependencySource(
        files,
        toNode("src/x/spec.js", "src/y/index.tsx"),
        NODE_RESOLVERS
      );

      // Assert
      expect(sibling).toBe("./index.ts");
      expect(above).toBe("./index.tsx");
      expect(other).toBe("../y/index.tsx");
    });

    it("should write the path without the index when only the extension is ambiguous", () => {
      // Arrange
      const files = ["src/x.js", "src/Button/index.js", "src/Button/index.ts"];

      // Act
      const source = getDependencySource(
        files,
        toNode("src/x.js", "src/Button/index.ts"),
        NODE_RESOLVERS
      );

      // Assert
      expect(source).toBe("./Button/index.ts");
    });

    it("should write the full path of a target that is not among the files", () => {
      // Act
      const source = getDependencySource(
        ["src/a.js"],
        toNode("src/a.js", "src/missing/index.js"),
        NODE_RESOLVERS
      );

      // Assert
      expect(source).toBe("./missing/index.js");
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
        resolveSource(
          files,
          dependency.from,
          getDependencySource(files, dependency, NODE_RESOLVERS),
          NODE_RESOLVERS
        )
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

    it("should drop the /index of an index file that has no extension, which a resolver reads for the folder", () => {
      // Arrange
      const files = ["src/main.js", "src/u/index"];

      // Act
      const sources = [NODE_RESOLVERS, TYPESCRIPT_RESOLVERS].map((resolvers) =>
        getDependencySource(
          files,
          toNode("src/main.js", "src/u/index"),
          resolvers
        )
      );

      // Assert
      expect(sources).toEqual(["./u", "./u"]);
    });

    it("should never drop .json or .node, which people write", () => {
      // Arrange
      const files = ["src/a.js", "src/data.json", "src/addon.node"];

      // Act
      const sources = [NODE_RESOLVERS, TYPESCRIPT_RESOLVERS].flatMap(
        (resolvers) =>
          ["src/data.json", "src/addon.node"].map((path) => {
            const source = getDependencySource(
              files,
              toNode("src/a.js", path),
              resolvers
            );

            return [
              source,
              resolveSource(files, "src/a.js", source, resolvers),
            ];
          })
      );

      // Assert
      expect(sources).toEqual([
        ["./data.json", "src/data.json"],
        ["./addon.node", "src/addon.node"],
        ["./data.json", "src/data.json"],
        ["./addon.node", "src/addon.node"],
      ]);
    });

    it.each([
      {
        label: "a.mjs before a.js for the node resolver",
        resolvers: NODE_RESOLVERS,
        files: ["src/main.js", "src/a.mjs", "src/a.js"],
        target: "src/a.mjs",
        source: "./a",
        reads: "src/a.mjs",
      },
      {
        label: "a.js after a.mjs for the node resolver",
        resolvers: NODE_RESOLVERS,
        files: ["src/main.js", "src/a.mjs", "src/a.js"],
        target: "src/a.js",
        source: "./a.js",
        reads: "src/a.js",
      },
      {
        label: "a.js beside a.mjs for the typescript resolver",
        resolvers: TYPESCRIPT_RESOLVERS,
        files: ["src/main.js", "src/a.mjs", "src/a.js"],
        target: "src/a.js",
        source: "./a",
        reads: "src/a.js",
      },
      {
        label: "a.mjs beside a.js for the typescript resolver",
        resolvers: TYPESCRIPT_RESOLVERS,
        files: ["src/main.js", "src/a.mjs", "src/a.js"],
        target: "src/a.mjs",
        source: "./a.mjs",
        reads: "src/a.mjs",
      },
      {
        label: "price.json before price/index.js for the node resolver",
        resolvers: NODE_RESOLVERS,
        files: ["src/main.js", "src/price.json", "src/price/index.js"],
        target: "src/price.json",
        source: "./price.json",
        reads: "src/price.json",
      },
      {
        label: "price/index.js after price.json for the node resolver",
        resolvers: NODE_RESOLVERS,
        files: ["src/main.js", "src/price.json", "src/price/index.js"],
        target: "src/price/index.js",
        source: "./price/index",
        reads: "src/price/index.js",
      },
      {
        label: "price/index.js after price.json for the typescript resolver",
        resolvers: TYPESCRIPT_RESOLVERS,
        files: ["src/main.js", "src/price.json", "src/price/index.js"],
        target: "src/price/index.js",
        source: "./price/index",
        reads: "src/price/index.js",
      },
      {
        label: "b.js beside b.ts for the node resolver",
        resolvers: NODE_RESOLVERS,
        files: ["src/main.js", "src/b.ts", "src/b.js"],
        target: "src/b.js",
        source: "./b",
        reads: "src/b.js",
      },
      {
        label: "b.ts beside b.js for the node resolver",
        resolvers: NODE_RESOLVERS,
        files: ["src/main.js", "src/b.ts", "src/b.js"],
        target: "src/b.ts",
        source: "./b.ts",
        reads: "src/b.ts",
      },
      {
        label: "b.ts beside b.js for the typescript resolver",
        resolvers: TYPESCRIPT_RESOLVERS,
        files: ["src/main.js", "src/b.ts", "src/b.js"],
        target: "src/b.ts",
        source: "./b",
        reads: "src/b.ts",
      },
      {
        label:
          "b.js beside its TypeScript twin b.ts, which no source of the typescript resolver reaches",
        resolvers: TYPESCRIPT_RESOLVERS,
        files: ["src/main.js", "src/b.ts", "src/b.js"],
        target: "src/b.js",
        source: "./b.js",
        reads: "src/b.ts",
      },
    ])("should write $label", ({ resolvers, files, target, source, reads }) => {
      // Act
      const written = getDependencySource(
        files,
        toNode("src/main.js", target),
        resolvers
      );

      // Assert
      expect(written).toBe(source);
      expect(resolveSource(files, "src/main.js", written, resolvers)).toBe(
        reads
      );
    });

    it("should write the source that the first resolver of a chain finds, and a shorter one that a later resolver finds", () => {
      // Arrange
      const files = [
        "src/main.js",
        "src/util.mjs",
        "src/view.tsx",
        "src/b.ts",
        "src/b.js",
      ];
      const chain = [TYPESCRIPT, NODE];

      // Act
      const sources = [
        "src/util.mjs",
        "src/view.tsx",
        "src/b.ts",
        "src/b.js",
      ].map((target) =>
        getDependencySource(files, toNode("src/main.js", target), chain)
      );

      // Assert
      expect(sources).toEqual(["./util", "./view", "./b", "./b.js"]);
      expect(
        sources.map((source) =>
          resolveSource(files, "src/main.js", source, chain)
        )
      ).toEqual(["src/util.mjs", "src/view.tsx", "src/b.ts", "src/b.ts"]);
    });

    it("should write the extensions that the extensions option sets as droppable, and no others", () => {
      // Arrange
      const files = ["src/main.js", "src/b.ts", "src/c.mjs", "src/d/index.tsx"];
      const nodeWithTs: SourceResolver = { name: "node", extensions: [".ts"] };
      const typescriptWithTsx: SourceResolver = {
        name: "typescript",
        extensions: [".tsx"],
      };

      // Act
      const sources = ["src/b.ts", "src/c.mjs", "src/d/index.tsx"].flatMap(
        (target) => [
          getDependencySource(files, toNode("src/main.js", target), [
            nodeWithTs,
          ]),
          getDependencySource(files, toNode("src/main.js", target), [
            typescriptWithTsx,
          ]),
        ]
      );

      // Assert
      expect(sources).toEqual([
        "./b",
        "./b.ts",
        "./c.mjs",
        "./c.mjs",
        "./d/index.tsx",
        "./d",
      ]);
    });

    it("should write the full path of a target that no resolver is run to find", () => {
      // Act
      const source = getDependencySource(
        ["src/main.js", "src/b.js"],
        toNode("src/main.js", "src/b.js"),
        []
      );

      // Assert
      expect(source).toBe("./b.js");
    });
  });

  describe("resolveSource", () => {
    it("should resolve the path as written first", () => {
      // Arrange
      const files = ["src/a.js", "src/b.css", "src/b.css.js"];

      // Act
      const source = resolveSource(
        files,
        "src/a.js",
        "./b.css",
        NODE_RESOLVERS
      );

      // Assert
      expect(source).toBe("src/b.css");
    });

    it.each(RESOLUTIONS)(
      "should resolve $source among $files with the node resolver",
      ({ source, files, node }) => {
        // Act
        const resolved = resolveSource(files, "src/main.js", source, [NODE]);

        // Assert
        expect(resolved).toBe(node);
      }
    );

    it.each(RESOLUTIONS)(
      "should resolve $source among $files with the typescript resolver",
      ({ source, files, typescript }) => {
        // Act
        const resolved = resolveSource(files, "src/main.js", source, [
          TYPESCRIPT,
        ]);

        // Assert
        expect(resolved).toBe(typescript);
      }
    );

    it.each([
      {
        resolver: "node",
        resolvers: NODE_RESOLVERS,
        order: ["b.mjs", "b.js", "b.json"],
      },
      {
        resolver: "typescript",
        resolvers: TYPESCRIPT_RESOLVERS,
        order: ["b.ts", "b.tsx", "b.d.ts", "b.js", "b.jsx", "b.json"],
      },
    ])(
      "should try the extensions of the $resolver resolver in order",
      ({ resolvers, order }) => {
        // Act
        const found = order.map((_file, position) =>
          resolveSource(
            ["src/a.js", ...order.slice(position).map((file) => `src/${file}`)],
            "src/a.js",
            "./b",
            resolvers
          )
        );

        // Assert
        expect(found).toEqual(order.map((file) => `src/${file}`));
      }
    );

    it.each([
      {
        resolver: "node",
        resolvers: NODE_RESOLVERS,
        order: ["b/index.mjs", "b/index.js", "b/index.json"],
      },
      {
        resolver: "typescript",
        resolvers: TYPESCRIPT_RESOLVERS,
        order: [
          "b/index.ts",
          "b/index.tsx",
          "b/index.d.ts",
          "b/index.js",
          "b/index.jsx",
          "b/index.json",
        ],
      },
    ])(
      "should try the extensions of the $resolver resolver in order for the index of a folder",
      ({ resolvers, order }) => {
        // Act
        const found = order.map((_file, position) =>
          resolveSource(
            ["src/a.js", ...order.slice(position).map((file) => `src/${file}`)],
            "src/a.js",
            "./b",
            resolvers
          )
        );

        // Assert
        expect(found).toEqual(order.map((file) => `src/${file}`));
      }
    );

    it("should resolve a source that ends with / to the index of the folder, even beside a file with the same name", () => {
      // Arrange
      const files = ["src/a.js", "src/b.js", "src/b/index.js"];

      // Act
      const sources = ["./b/", "./b", "../src/b/"].map((source) =>
        resolveSource(files, "src/a.js", source, NODE_RESOLVERS)
      );

      // Assert
      expect(sources).toEqual(["src/b/index.js", "src/b.js", "src/b/index.js"]);
    });

    it("should not resolve a source that ends with / to a file with the same name", () => {
      // Act
      const sources = [NODE_RESOLVERS, TYPESCRIPT_RESOLVERS].map((resolvers) =>
        resolveSource(["src/a.js", "src/b.js"], "src/a.js", "./b/", resolvers)
      );

      // Assert
      expect(sources).toEqual([undefined, undefined]);
    });

    it("should resolve with the first resolver that finds a file", () => {
      // Arrange
      const files = ["src/a.js", "src/b.ts", "src/b.js"];

      // Act
      const nodeFirst = resolveSource(files, "src/a.js", "./b", [
        NODE,
        TYPESCRIPT,
      ]);
      const typescriptFirst = resolveSource(files, "src/a.js", "./b", [
        TYPESCRIPT,
        NODE,
      ]);

      // Assert
      expect(nodeFirst).toBe("src/b.js");
      expect(typescriptFirst).toBe("src/b.ts");
    });

    it("should resolve with the next resolver when the first finds no file", () => {
      // Arrange
      const files = ["src/a.js", "src/util.mjs", "src/view.tsx"];

      // Act
      const typescriptThenNode = resolveSource(files, "src/a.js", "./util", [
        TYPESCRIPT,
        NODE,
      ]);
      const nodeThenTypescript = resolveSource(files, "src/a.js", "./view", [
        NODE,
        TYPESCRIPT,
      ]);

      // Assert
      expect(typescriptThenNode).toBe("src/util.mjs");
      expect(nodeThenTypescript).toBe("src/view.tsx");
    });

    it("should resolve to no file when no resolver is run", () => {
      // Act
      const source = resolveSource(
        ["src/a.js", "src/b.js"],
        "src/a.js",
        "./b",
        []
      );

      // Assert
      expect(source).toBeUndefined();
    });

    it("should try the extensions that the extensions option sets, and no others", () => {
      // Arrange
      const files = [
        "src/a.js",
        "src/b.ts",
        "src/b.js",
        "src/c.mjs",
        "src/d/index.ts",
      ];
      const nodeWithTs: SourceResolver = {
        name: "node",
        extensions: [".ts", ".js"],
      };
      const typescriptWithJs: SourceResolver = {
        name: "typescript",
        extensions: [".js"],
      };

      // Act
      const sources = ["./b", "./c", "./d"].flatMap((source) => [
        resolveSource(files, "src/a.js", source, [nodeWithTs]),
        resolveSource(files, "src/a.js", source, [typescriptWithJs]),
      ]);

      // Assert
      expect(sources).toEqual([
        "src/b.ts",
        "src/b.js",
        undefined,
        undefined,
        "src/d/index.ts",
        undefined,
      ]);
    });

    it("should still apply the extension aliases of the typescript resolver when the extensions option sets other extensions", () => {
      // Arrange
      const typescriptWithJson: SourceResolver = {
        name: "typescript",
        extensions: [".json"],
      };

      // Act
      const source = resolveSource(
        ["src/a.js", "src/b.ts"],
        "src/a.js",
        "./b.js",
        [typescriptWithJson]
      );

      // Assert
      expect(source).toBe("src/b.ts");
    });

    it("should find a file whose name continues past an extension that is written, as the typescript resolver does", () => {
      // Arrange
      const files = ["src/a.js", "src/weird.js.ts"];

      // Act
      const source = resolveSource(
        files,
        "src/a.js",
        "./weird.js",
        TYPESCRIPT_RESOLVERS
      );

      // Assert
      expect(source).toBe("src/weird.js.ts");
    });

    it("should resolve a file before the index of a folder with the same name", () => {
      // Arrange
      const files = ["src/a.js", "src/b/index.js", "src/b.ts"];

      // Act
      const source = resolveSource(
        files,
        "src/a.js",
        "./b",
        TYPESCRIPT_RESOLVERS
      );

      // Assert
      expect(source).toBe("src/b.ts");
    });

    it("should resolve the index of a folder, trying its extensions in order", () => {
      // Arrange
      const files = ["src/a.js", "src/b/index.ts", "src/b/index.mjs"];

      // Act
      const source = resolveSource(files, "src/a.js", "./b", NODE_RESOLVERS);

      // Assert
      expect(source).toBe("src/b/index.mjs");
    });

    it("should resolve a source that goes up", () => {
      // Arrange
      const files = ["src/a/b/c.js", "src/helpers/format/index.js"];

      // Act
      const source = resolveSource(
        files,
        "src/a/b/c.js",
        "../../helpers/format",
        NODE_RESOLVERS
      );

      // Assert
      expect(source).toBe("src/helpers/format/index.js");
    });

    it("should skip . and empty segments and follow .. in the middle", () => {
      // Arrange
      const files = ["src/a.js", "src/c/d.js"];

      // Act
      const source = resolveSource(
        files,
        "src/a.js",
        "./b/../c//./d",
        NODE_RESOLVERS
      );

      // Assert
      expect(source).toBe("src/c/d.js");
    });

    it("should resolve a source that reaches the root to the index of the root", () => {
      // Arrange
      const files = ["a/b/c.js", "index.js"];

      // Act
      const sources = ["../..", "../../", "../../index"].map((source) =>
        resolveSource(files, "a/b/c.js", source, NODE_RESOLVERS)
      );

      // Assert
      expect(sources).toEqual(["index.js", "index.js", "index.js"]);
    });

    it("should not add an extension to the root, which has no name", () => {
      // Arrange
      const files = ["a/b/c.js", ".js", "x.js"];

      // Act
      const source = resolveSource(files, "a/b/c.js", "../..", NODE_RESOLVERS);

      // Assert
      expect(source).toBeUndefined();
    });

    it("should resolve ./ to the index of the folder of the file", () => {
      // Arrange
      const files = ["src/a.js", "src/index.js"];

      // Act
      const source = resolveSource(files, "src/a.js", "./", NODE_RESOLVERS);

      // Assert
      expect(source).toBe("src/index.js");
    });

    it("should resolve a source of a file at the root", () => {
      // Act
      const source = resolveSource(
        ["a.js", "b.js"],
        "a.js",
        "./b",
        NODE_RESOLVERS
      );

      // Assert
      expect(source).toBe("b.js");
    });

    it("should give undefined for a source that goes above the root", () => {
      // Act
      const source = resolveSource(
        ["src/a.js", "b.js"],
        "src/a.js",
        "../../b",
        NODE_RESOLVERS
      );

      // Assert
      expect(source).toBeUndefined();
    });

    it("should give undefined for a source that is not relative", () => {
      // Arrange
      const files = ["src/a.js", "src/react.js", "src/index.js"];

      // Act
      const sources = ["react", "/src/react", "src/react", ".", "..", ".react"];

      // Assert
      expect(
        sources.map((source) =>
          resolveSource(files, "src/a.js", source, NODE_RESOLVERS)
        )
      ).toEqual([
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
      ]);
    });

    it("should give undefined for a source that resolves to no file", () => {
      // Act
      const source = resolveSource(
        ["src/a.js"],
        "src/a.js",
        "./missing",
        NODE_RESOLVERS
      );

      // Assert
      expect(source).toBeUndefined();
    });

    it("should not resolve a folder", () => {
      // Act
      const source = resolveSource(
        ["src/a.js", "src/b/c.js"],
        "src/a.js",
        "./b",
        NODE_RESOLVERS
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
