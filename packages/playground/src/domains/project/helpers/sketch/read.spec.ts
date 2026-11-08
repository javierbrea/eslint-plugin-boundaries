import type { Sketch, SketchDependencyTarget } from "@/contract";

import { isSameProject } from "./compare";
import { readSketch } from "./read";
import { fromText, toText } from "./textMode";

/**
 * A raw dependency, as `JSON.parse` would give it; a test changes the fields it is about
 * @param fields The fields to set.
 */
function createDependency(
  fields: Record<string, unknown> = {}
): Record<string, unknown> {
  return {
    from: "src/a.js",
    target: { kind: "node", path: "src/b.js" },
    syntax: "import",
    importKind: "value",
    specifiers: [{ kind: "named", name: "b" }],
    ...fields,
  };
}

/**
 * A raw sketch with two files and a dependency of the first on the second; a test changes the fields it is about
 * @param fields The fields to set.
 */
function createValue(
  fields: Record<string, unknown> = {}
): Record<string, unknown> {
  return {
    config: "{ settings: {}, rules: {} }",
    tree: [
      { path: "src/a.js", kind: "file" },
      { path: "src/b.js", kind: "file" },
    ],
    dependencies: [createDependency()],
    ...fields,
  };
}

/**
 * Gets what a target names, a module or a path.
 * @param target The target of a dependency.
 */
function getTargetName(target: SketchDependencyTarget): string {
  return target.kind === "external" ? target.name : target.path;
}

/**
 * Makes the raw nodes of files.
 * @param paths The paths of the files.
 */
function files(...paths: string[]): unknown[] {
  return paths.map((path) => ({ path, kind: "file" }));
}

/**
 * Reads a value and gives the reason it is refused.
 * @param value The value to read.
 */
function getError(value: unknown): string | undefined {
  const result = readSketch(value);

  return "error" in result ? result.error : undefined;
}

/**
 * Reads a value that must be accepted.
 * @param value The value to read.
 */
function getSketch(value: unknown): Sketch {
  const result = readSketch(value);

  if ("error" in result) {
    throw new Error(`The value was refused: ${result.error}`);
  }
  return result.sketch;
}

/**
 * Whether reading the text of a sketch gives the same project, with no problems, which is what keeps the first text read of a decoded sketch from counting as an edit
 * @param sketch The sketch to write and read.
 */
function isStableInTextMode(sketch: Sketch): boolean {
  const { sketch: read, problems } = fromText(toText(sketch), sketch);

  return problems.length === 0 && isSameProject(sketch, read);
}

/**
 * Copies a raw sketch with the tree, the dependencies and the names of each dependency in the opposite order
 * @param value The raw sketch.
 */
function reverseOrders(value: unknown): unknown {
  const { tree, dependencies, config } = value as {
    config: string;
    tree: unknown[];
    dependencies: { specifiers: unknown[] }[];
  };
  const reversedTree = [...tree];
  const reversedDependencies = dependencies.map((dependency) => {
    const specifiers = [...dependency.specifiers];

    specifiers.reverse();
    return { ...dependency, specifiers };
  });

  reversedTree.reverse();
  reversedDependencies.reverse();
  return { config, tree: reversedTree, dependencies: reversedDependencies };
}

const NOT_A_SKETCH =
  'The data is not a sketch: it must be an object with "config", "tree" and "dependencies".';

/** Every syntax and every kind of name, with names that look like keywords of the syntax, in the order text mode reads back */
const KITCHEN_SINK: unknown = {
  config: "// comment\n{ settings: {}, rules: {} }\n",
  tree: [
    { path: "a b/ü.js", kind: "file" },
    { path: "empty", kind: "folder" },
    { path: "lib/deep/c.ts", kind: "file" },
    { path: "lib/b.js", kind: "file" },
    { path: "a.js", kind: "file" },
  ],
  dependencies: [
    createDependency({
      from: "a b/ü.js",
      target: { kind: "node", path: "a.js" },
      specifiers: [
        { kind: "default", name: "type" },
        { kind: "named", name: "default", alias: "from" },
        { kind: "named", name: "as", alias: "as" },
      ],
    }),
    createDependency({
      from: "lib/b.js",
      target: { kind: "external", name: "react" },
      syntax: "require",
      specifiers: [],
    }),
    createDependency({
      from: "lib/b.js",
      target: { kind: "node", path: "a.js" },
      syntax: "dynamic-import",
      specifiers: [],
    }),
    createDependency({
      from: "a.js",
      target: { kind: "node", path: "lib/deep/c.ts" },
      specifiers: [
        { kind: "default", name: "c" },
        { kind: "namespace", name: "ns" },
      ],
    }),
    createDependency({
      from: "a.js",
      target: { kind: "external", name: "@scope/pkg" },
      importKind: "type",
      specifiers: [{ kind: "named", name: "T", alias: "U" }],
    }),
    createDependency({
      from: "a.js",
      target: { kind: "external", name: "node:fs" },
      specifiers: [],
    }),
    createDependency({
      from: "a.js",
      target: { kind: "node", path: "lib/b.js" },
      syntax: "export-from",
      specifiers: [{ kind: "named", name: "default", alias: "b" }],
    }),
    createDependency({
      from: "a.js",
      target: { kind: "node", path: "lib/b.js" },
      syntax: "export-from",
      specifiers: [{ kind: "namespace", name: "everything" }],
    }),
    createDependency({
      from: "a.js",
      target: { kind: "node", path: "lib/b.js" },
      syntax: "export-from",
      importKind: "type",
      specifiers: [],
    }),
  ],
};

/**
 * A small deterministic generator, so that a failure can be reproduced
 * @param seed The number it starts from.
 * @returns A function that gives a number from 0 up to, not including, 1 each time it is called.
 */
function createRandom(seed: number): () => number {
  let state = seed;

  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let mixed = Math.imul(state ^ (state >>> 15), 1 | state);

    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

// Folders and names that the checks accept but that a statement, a line of text mode or a path could mishandle
const FOLDERS = [
  "",
  "src/",
  "lib/deep/",
  "x y/",
  "(c)/",
  "{d}/",
  "ü/",
  "a;b/",
  "#/",
  " x/",
  "e,f/",
  "*/",
  "type/",
  "from/",
  "nbsp /",
  "tail /",
];
const BASES = [
  "a",
  "b",
  "index",
  "x y",
  "type",
  "from",
  "ü",
  "a;b",
  "(c)",
  "*",
];
const EXTENSIONS = ["", ".js", ".ts", ".d.ts", ".cjs", ".json"];
const BAD_PATHS = [
  "",
  "..",
  "a//b",
  " a",
  "a ",
  "q'q",
  "tab\t",
  "a\\b",
  "eslint.config.js",
];
const KEYWORD_NAMES = [
  "type",
  "from",
  "as",
  "of",
  "get",
  "async",
  "$",
  "_",
  "ü",
];
const NAME_BASES = ["a", "b", "ü", "$x", "_y", "Ünï"];
const BAD_NAMES = ["default", "class", "await", "eval", "1x", "a-b", ""];
const MODULES = [
  "react",
  "@scope/pkg",
  "node:fs",
  "x;y",
  "a(b)",
  "a,b",
  "{c}",
  "*",
  "a/b",
  "~x",
  "\u0001",
  "type",
  "from",
];
const BAD_MODULES = ["a b", ".rel", "/abs", "", "a'b", ".."];
// The names each syntax can hold, as the kind of each name
const KINDS_OF_NAMES: Record<string, readonly (readonly string[])[]> = {
  import: [
    [],
    ["default"],
    ["namespace"],
    ["named"],
    ["named", "named"],
    ["default", "namespace"],
    ["default", "named"],
  ],
  "export-from": [[], ["namespace"], ["named"], ["named", "named"]],
  require: [[]],
  "dynamic-import": [[]],
};

/**
 * Makes a raw sketch of awkward names, which mostly passes the checks and sometimes breaks one
 * @param random The generator of numbers.
 */
function createFuzzValue(random: () => number): unknown {
  const chance = (probability: number): boolean => random() < probability;
  const pick = <Item>(items: readonly Item[]): Item =>
    items[Math.floor(random() * items.length)];
  const count = (max: number): number => Math.floor(random() * (max + 1));
  let counter = 0;
  const makeName = (): string => {
    counter += 1;
    return chance(0.3) ? pick(KEYWORD_NAMES) : `${pick(NAME_BASES)}${counter}`;
  };
  const makeSpecifiers = (kinds: readonly string[]): unknown[] =>
    kinds.map((kind) => {
      if (kind === "named" && chance(0.3)) {
        return {
          kind,
          name: chance(0.3) ? "default" : makeName(),
          alias: makeName(),
        };
      }
      return { kind, name: chance(0.03) ? pick(BAD_NAMES) : makeName() };
    });

  const tree = Array.from({ length: count(6) }, (_, index) => ({
    path: chance(0.03)
      ? pick(BAD_PATHS)
      : `${pick(FOLDERS)}${pick(BASES)}${index}${pick(EXTENSIONS)}`,
    kind: chance(0.85) ? "file" : "folder",
  }));
  const filePaths = tree
    .filter(({ kind }) => kind === "file")
    .map(({ path }) => path);
  const dependencies =
    filePaths.length === 0
      ? []
      : Array.from({ length: count(8) }, () => {
          const from = chance(0.97) ? pick(filePaths) : pick(BAD_PATHS);
          const others = filePaths.filter((path) => path !== from);
          const syntax = pick([
            "import",
            "import",
            "export-from",
            "require",
            "dynamic-import",
          ]);
          const kinds = pick(KINDS_OF_NAMES[syntax]);

          return {
            from,
            target:
              others.length > 0 && chance(0.6)
                ? { kind: "node", path: pick(others) }
                : {
                    kind: "external",
                    name: chance(0.03) ? pick(BAD_MODULES) : pick(MODULES),
                  },
            syntax,
            importKind: chance(0.8) ? "value" : "type",
            specifiers: makeSpecifiers(kinds),
          };
        });

  return { config: "{}", tree, dependencies };
}

/**
 * The sketches that `readSketch` accepts among those a seed makes
 * @param seed The number the generator starts from.
 * @param attempts How many sketches to make.
 */
function readFuzzSketches(seed: number, attempts: number): Sketch[] {
  const random = createRandom(seed);
  const accepted: Sketch[] = [];

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const result = readSketch(createFuzzValue(random));

    if ("sketch" in result) {
      accepted.push(result.sketch);
    }
  }
  return accepted;
}

describe("readSketch", () => {
  describe("when the value is a sketch", () => {
    it("should return the sketch it holds", () => {
      // Arrange
      const value = createValue();

      // Act
      const sketch = getSketch(value);

      // Assert
      expect(sketch).toStrictEqual(value);
    });

    it("should return a sketch that text mode reads back unchanged, for every syntax and every kind of name", () => {
      // Act
      const sketch = getSketch(KITCHEN_SINK);

      // Assert
      expect(sketch).toStrictEqual(KITCHEN_SINK);
      expect(isStableInTextMode(sketch)).toBe(true);
    });

    it("should accept a sketch with nothing in it", () => {
      // Arrange
      const value = { config: "", tree: [], dependencies: [] };

      // Act
      const sketch = getSketch(value);

      // Assert
      expect(sketch).toStrictEqual(value);
    });

    it("should not change the value it reads", () => {
      // Arrange
      const value = JSON.parse(
        JSON.stringify(
          createValue({
            tree: files("src/b.js", "src/a.js"),
            dependencies: [
              createDependency({
                specifiers: [
                  { kind: "named", name: "b" },
                  { kind: "default", name: "d" },
                ],
              }),
            ],
          })
        )
      ) as unknown;
      const before = JSON.stringify(value);

      // Act
      getSketch(value);

      // Assert
      expect(JSON.stringify(value)).toBe(before);
    });

    it("should return new objects, so that nothing of the value is shared with the sketch", () => {
      // Arrange
      const value = createValue();

      // Act
      const sketch = getSketch(value);

      // Assert
      expect(sketch.tree).not.toBe(value.tree);
      expect(sketch.dependencies).not.toBe(value.dependencies);
      expect(sketch.dependencies[0]).not.toBe(
        (value.dependencies as unknown[])[0]
      );
    });

    it("should keep the config as it is, whatever it says", () => {
      // Arrange
      const config = "{ not: json5 at all";

      // Act
      const sketch = getSketch(createValue({ config }));

      // Assert
      expect(sketch.config).toBe(config);
    });
  });

  describe("the order of the sketch it returns", () => {
    it("should put the tree in the order of the project pane, with the folders that the files imply dropped", () => {
      // Arrange
      const value = createValue({
        tree: [
          { path: "z.js", kind: "file" },
          { path: "src/a", kind: "folder" },
          { path: "src/a/b.js", kind: "file" },
          { path: "empty", kind: "folder" },
          { path: "B.js", kind: "file" },
          { path: "src/10.js", kind: "file" },
          { path: "src/9.js", kind: "file" },
        ],
        dependencies: [],
      });

      // Act
      const { tree } = getSketch(value);

      // Assert
      expect(tree).toStrictEqual([
        { path: "empty", kind: "folder" },
        { path: "src/a/b.js", kind: "file" },
        { path: "src/9.js", kind: "file" },
        { path: "src/10.js", kind: "file" },
        { path: "B.js", kind: "file" },
        { path: "z.js", kind: "file" },
      ]);
    });

    it("should group the dependencies by file, the files in the order of the tree and the dependencies of a file in the order they came", () => {
      // Arrange
      const toModule = (from: string, moduleName: string) =>
        createDependency({
          from,
          target: { kind: "external", name: moduleName },
          specifiers: [],
        });
      const value = createValue({
        tree: files("src/z.js", "src/a.js", "src/m.js"),
        dependencies: [
          toModule("src/z.js", "first"),
          toModule("src/m.js", "second"),
          toModule("src/z.js", "third"),
          toModule("src/a.js", "fourth"),
          toModule("src/m.js", "fifth"),
        ],
      });

      // Act
      const { dependencies } = getSketch(value);

      // Assert
      expect(
        dependencies.map(({ from, target }) => [from, getTargetName(target)])
      ).toStrictEqual([
        ["src/a.js", "fourth"],
        ["src/m.js", "second"],
        ["src/m.js", "fifth"],
        ["src/z.js", "first"],
        ["src/z.js", "third"],
      ]);
    });

    it("should put the default name before the named names, which keep their order", () => {
      // Arrange
      const value = createValue({
        dependencies: [
          createDependency({
            specifiers: [
              { kind: "named", name: "two" },
              { kind: "named", name: "one", alias: "uno" },
              { kind: "default", name: "d" },
            ],
          }),
        ],
      });

      // Act
      const [first] = getSketch(value).dependencies;

      // Assert
      expect(first.specifiers).toStrictEqual([
        { kind: "default", name: "d" },
        { kind: "named", name: "two" },
        { kind: "named", name: "one", alias: "uno" },
      ]);
    });

    it("should put the default name before the namespace", () => {
      // Arrange
      const value = createValue({
        dependencies: [
          createDependency({
            specifiers: [
              { kind: "namespace", name: "ns" },
              { kind: "default", name: "d" },
            ],
          }),
        ],
      });

      // Act
      const [first] = getSketch(value).dependencies;

      // Assert
      expect(first.specifiers).toStrictEqual([
        { kind: "default", name: "d" },
        { kind: "namespace", name: "ns" },
      ]);
    });

    it("should return a sketch that text mode reads back unchanged, whatever order the value came in", () => {
      // Arrange
      const reversed = reverseOrders(KITCHEN_SINK);

      // Act
      const sketch = getSketch(reversed);

      // Assert
      expect(isStableInTextMode(sketch)).toBe(true);
      expect(sketch.tree).toStrictEqual((KITCHEN_SINK as Sketch).tree);
    });
  });

  describe("when the value is not a sketch", () => {
    it.each([
      ["null", null],
      ["undefined", undefined],
      ["text", "a sketch"],
      ["a number", 42],
      ["a list", []],
    ])("should refuse %s", (_name, value) => {
      // Act
      const error = getError(value);

      // Assert
      expect(error).toBe(NOT_A_SKETCH);
    });

    it.each([
      [
        "a key it does not know",
        createValue({ extra: 1 }),
        'The sketch has the unknown key "extra".',
      ],
      [
        "the key __proto__, which JSON.parse creates as an own key",
        JSON.parse(
          '{"config":"","tree":[],"dependencies":[],"__proto__":{}}'
        ) as unknown,
        'The sketch has the unknown key "__proto__".',
      ],
      [
        "no config",
        { tree: [], dependencies: [] },
        'The sketch needs "config" to be text.',
      ],
      [
        "a config that is not text",
        createValue({ config: {} }),
        'The sketch needs "config" to be text.',
      ],
      [
        "a tree that is not a list",
        createValue({ tree: {} }),
        'The sketch needs "tree" to be a list.',
      ],
      [
        "no dependencies",
        { config: "", tree: [] },
        'The sketch needs "dependencies" to be a list.',
      ],
      [
        "dependencies that are not a list",
        createValue({ dependencies: "none" }),
        'The sketch needs "dependencies" to be a list.',
      ],
    ])("should refuse a sketch with %s", (_name, value, expected) => {
      // Act
      const error = getError(value);

      // Assert
      expect(error).toBe(expected);
    });

    it.each([
      ["is not an object", "src/a.js", "Node 2 of the tree must be an object."],
      [
        "has a path that is not text",
        { path: 1, kind: "file" },
        'Node 2 of the tree needs "path" to be text.',
      ],
      [
        "has no path",
        { kind: "file" },
        'Node 2 of the tree needs "path" to be text.',
      ],
      [
        "has a kind that is neither of the two",
        { path: "x", kind: "dir" },
        'Node 2 of the tree needs "kind" to be "file" or "folder".',
      ],
      [
        "has a key it does not know",
        { path: "x", kind: "file", mode: 1 },
        'Node 2 of the tree has the unknown key "mode".',
      ],
    ])("should refuse a node that %s", (_name, node, expected) => {
      // Arrange
      const value = createValue({
        tree: [{ path: "src/a.js", kind: "file" }, node],
      });

      // Act
      const error = getError(value);

      // Assert
      expect(error).toBe(expected);
    });

    it.each([
      ["is not an object", "import", "Dependency 2 must be an object."],
      [
        "has a file that is not text",
        createDependency({ from: 1 }),
        'Dependency 2 needs "from" to be text.',
      ],
      [
        "has no target",
        createDependency({ target: undefined }),
        "The target of dependency 2 must be an object.",
      ],
      [
        "has a target of an unknown kind",
        createDependency({ target: { kind: "url", path: "x" } }),
        'The target of dependency 2 needs "kind" to be "node" or "external".',
      ],
      [
        "has a node target without a path",
        createDependency({ target: { kind: "node", name: "x" } }),
        'The target of dependency 2 needs "path" to be text.',
      ],
      [
        "has an external target without a name",
        createDependency({ target: { kind: "external", path: "x" } }),
        'The target of dependency 2 needs "name" to be text.',
      ],
      [
        "has a target with a key it does not know",
        createDependency({ target: { kind: "node", path: "x", name: "y" } }),
        'The target of dependency 2 has the unknown key "name".',
      ],
      [
        "has a syntax it does not know",
        createDependency({ syntax: "include" }),
        'Dependency 2 needs "syntax" to be "import", "export-from", "require" or "dynamic-import".',
      ],
      [
        "has a kind of statement it does not know",
        createDependency({ importKind: "types" }),
        'Dependency 2 needs "importKind" to be "value" or "type".',
      ],
      [
        "has names that are not a list",
        createDependency({ specifiers: {} }),
        'Dependency 2 needs "specifiers" to be a list.',
      ],
      [
        "has a name that is not an object",
        createDependency({ specifiers: ["b"] }),
        "Name 1 of dependency 2 must be an object.",
      ],
      [
        "has a name of an unknown kind",
        createDependency({ specifiers: [{ kind: "star", name: "b" }] }),
        'Name 1 of dependency 2 needs "kind" to be "default", "named" or "namespace".',
      ],
      [
        "has a name that is not text",
        createDependency({ specifiers: [{ kind: "named", name: 1 }] }),
        'Name 1 of dependency 2 needs "name" to be text.',
      ],
      [
        "has an alias that is not text",
        createDependency({
          specifiers: [
            { kind: "named", name: "a" },
            { kind: "named", name: "b", alias: 1 },
          ],
        }),
        'Name 2 of dependency 2 needs "alias" to be text.',
      ],
      [
        "has an alias that is undefined",
        createDependency({
          specifiers: [{ kind: "named", name: "b", alias: undefined }],
        }),
        'Name 1 of dependency 2 needs "alias" to be text.',
      ],
      [
        "has a name with a key it does not know",
        createDependency({
          specifiers: [{ kind: "named", name: "b", type: true }],
        }),
        'Name 1 of dependency 2 has the unknown key "type".',
      ],
      [
        "has a key it does not know",
        createDependency({ line: 3 }),
        'Dependency 2 has the unknown key "line".',
      ],
    ])("should refuse a dependency that %s", (_name, dependency, expected) => {
      // Arrange
      const value = createValue({
        dependencies: [
          createDependency({
            specifiers: [{ kind: "named", name: "first" }],
          }),
          dependency,
        ],
      });

      // Act
      const error = getError(value);

      // Assert
      expect(error).toBe(expected);
    });
  });

  describe("when the tree cannot be one", () => {
    it.each([
      ["is empty", "", "The path is empty."],
      ["has an empty segment", "src//a.js", "The path has an empty segment."],
      ["starts with a slash", "/src/a.js", "The path has an empty segment."],
      [
        "has a `..` segment",
        "src/../a.js",
        "The path cannot have `.` or `..` segments.",
      ],
      [
        "has a control character",
        "src/a\nb.js",
        "The path cannot have control characters.",
      ],
      [
        "has a quote",
        'src/a"b.js',
        "A path cannot have quotes or backslashes.",
      ],
      [
        "has a backslash",
        "src\\a.js",
        "A path cannot have quotes or backslashes.",
      ],
      ["starts with a space", " a.js", "A path cannot start with a space."],
      [
        "starts with a space other than U+0020",
        " a.js",
        "A path cannot start with a space.",
      ],
      [
        "is the config node",
        "eslint.config.js",
        "eslint.config.js at the root is the config node, not a file or a folder.",
      ],
      ["ends with a space", "a.js ", "A path cannot end with a space."],
      [
        "ends with a space other than U+0020",
        "a.js　",
        "A path cannot end with a space.",
      ],
    ])("should refuse a path that %s", (_name, path, reason) => {
      // Arrange
      const value = createValue({
        tree: [
          { path: "ok.js", kind: "file" },
          { path, kind: "file" },
        ],
        dependencies: [],
      });

      // Act
      const error = getError(value);

      // Assert
      expect(error).toBe(`"${path}" cannot be in the tree. ${reason}`);
    });

    it("should refuse a folder with a path that cannot be one too", () => {
      // Arrange
      const value = createValue({
        tree: [{ path: "src/a ", kind: "folder" }],
        dependencies: [],
      });

      // Act
      const error = getError(value);

      // Assert
      expect(error).toBe(
        '"src/a " cannot be in the tree. A path cannot end with a space.'
      );
    });

    it.each([
      [
        "a file twice",
        [
          { path: "a.js", kind: "file" },
          { path: "a.js", kind: "file" },
        ],
        '"a.js" cannot be in the tree. That path already exists.',
      ],
      [
        "a folder twice",
        [
          { path: "a", kind: "folder" },
          { path: "a", kind: "folder" },
        ],
        '"a" cannot be in the tree. That path already exists.',
      ],
      [
        "a file where a folder is",
        [
          { path: "a", kind: "folder" },
          { path: "a", kind: "file" },
        ],
        '"a" cannot be in the tree. A folder already exists at that path.',
      ],
      [
        "a folder where a file is",
        [
          { path: "a", kind: "file" },
          { path: "a", kind: "folder" },
        ],
        '"a" cannot be in the tree. A file already exists at that path.',
      ],
      [
        "a path under a file",
        [
          { path: "a", kind: "file" },
          { path: "a/b.js", kind: "file" },
        ],
        '"a/b.js" cannot be in the tree. "a" is a file, so nothing can be added under it.',
      ],
      [
        "a file where a path under it is",
        [
          { path: "a/b.js", kind: "file" },
          { path: "a", kind: "file" },
        ],
        '"a" cannot be in the tree. A folder already exists at that path.',
      ],
      [
        "a folder where the files under it are",
        [
          { path: "a/b.js", kind: "file" },
          { path: "a", kind: "folder" },
        ],
        '"a" cannot be in the tree. That path already exists.',
      ],
    ])("should refuse %s", (_name, tree, expected) => {
      // Arrange
      const value = createValue({ tree, dependencies: [] });

      // Act
      const error = getError(value);

      // Assert
      expect(error).toBe(expected);
    });
  });

  describe("when a dependency cannot be in the sketch", () => {
    it.each([
      [
        "is of a file that is not in the tree",
        createDependency({ from: "src/missing.js" }),
        '"src/missing.js" is not a file of the sketch.',
      ],
      [
        "is of a folder",
        createDependency({ from: "src" }),
        '"src" is not a file of the sketch.',
      ],
      [
        "points to a file that is not in the tree",
        createDependency({ target: { kind: "node", path: "src/missing.js" } }),
        '"src/missing.js" is not a file of the sketch.',
      ],
      [
        "points to its own file",
        createDependency({ target: { kind: "node", path: "src/a.js" } }),
        "A file cannot depend on itself.",
      ],
      [
        "points to a module with a name that starts with a dot",
        createDependency({ target: { kind: "external", name: "./b" } }),
        '"./b" is not a module name: names do not start with "." or "/". Point to a file of the sketch instead.',
      ],
      [
        "points to a module with a space in its name",
        createDependency({ target: { kind: "external", name: "a b" } }),
        "A module name cannot have spaces.",
      ],
      [
        "points to a module with a quote in its name",
        createDependency({ target: { kind: "external", name: "a'b" } }),
        "A module name cannot have quotes or backslashes.",
      ],
      [
        "has names that its syntax does not hold",
        createDependency({
          syntax: "require",
          specifiers: [{ kind: "default", name: "b" }],
        }),
        "`require()` holds no names.",
      ],
      [
        "is a type import without names",
        createDependency({ importKind: "type", specifiers: [] }),
        "A type import needs at least one name.",
      ],
      [
        "has a name that cannot be written",
        createDependency({ specifiers: [{ kind: "named", name: "a-b" }] }),
        '"a-b" is not a valid name.',
      ],
      [
        "has a name that is a reserved word and no alias",
        createDependency({ specifiers: [{ kind: "named", name: "class" }] }),
        'An import of "class" needs an alias.',
      ],
    ])("should refuse a dependency that %s", (_name, dependency, reason) => {
      // Arrange
      const value = createValue({ dependencies: [dependency] });

      // Act
      const error = getError(value);

      // Assert
      expect(error).toBe(`Dependency 1 cannot be in the sketch. ${reason}`);
    });

    it("should refuse a name that another statement of the same file already imports, and name the later statement", () => {
      // Arrange
      const value = createValue({
        dependencies: [
          createDependency(),
          createDependency({ target: { kind: "external", name: "other" } }),
        ],
      });

      // Act
      const error = getError(value);

      // Assert
      expect(error).toBe(
        'Dependency 2 cannot be in the sketch. The name "b" is already imported by another statement of the file.'
      );
    });

    it("should refuse a name that another statement of the same file already imports when a dependency of another file comes between them", () => {
      // Arrange
      const value = createValue({
        dependencies: [
          createDependency(),
          createDependency({
            from: "src/b.js",
            target: { kind: "node", path: "src/a.js" },
            specifiers: [],
          }),
          createDependency({ target: { kind: "external", name: "other" } }),
        ],
      });

      // Act
      const error = getError(value);

      // Assert
      expect(error).toBe(
        'Dependency 3 cannot be in the sketch. The name "b" is already imported by another statement of the file.'
      );
    });

    it("should refuse a name that another statement of the same file already exports", () => {
      // Arrange
      const value = createValue({
        dependencies: [
          createDependency({ syntax: "export-from" }),
          createDependency({
            syntax: "export-from",
            target: { kind: "external", name: "other" },
          }),
        ],
      });

      // Act
      const error = getError(value);

      // Assert
      expect(error).toBe(
        'Dependency 2 cannot be in the sketch. The name "b" is already exported by another statement of the file.'
      );
    });

    it("should accept the same name in another file, and a name that one statement imports and another exports", () => {
      // Arrange
      const value = createValue({
        dependencies: [
          createDependency(),
          createDependency({ syntax: "export-from" }),
          createDependency({
            from: "src/b.js",
            target: { kind: "node", path: "src/a.js" },
            specifiers: [{ kind: "named", name: "b" }],
          }),
        ],
      });

      // Act
      const sketch = getSketch(value);

      // Assert
      expect(sketch.dependencies).toHaveLength(3);
      expect(isStableInTextMode(sketch)).toBe(true);
    });

    it("should accept side-effect statements that repeat", () => {
      // Arrange
      const value = createValue({
        dependencies: [
          createDependency({ specifiers: [] }),
          createDependency({ specifiers: [] }),
        ],
      });

      // Act
      const sketch = getSketch(value);

      // Assert
      expect(sketch.dependencies).toHaveLength(2);
      expect(isStableInTextMode(sketch)).toBe(true);
    });

    it("should check the dependencies against the tree as it is read, whatever order its nodes came in", () => {
      // Arrange
      const value = createValue({
        tree: [
          { path: "src", kind: "folder" },
          { path: "src/b.js", kind: "file" },
          { path: "src/a.js", kind: "file" },
        ],
      });

      // Act
      const sketch = getSketch(value);

      // Assert
      expect(sketch.dependencies).toHaveLength(1);
    });
  });

  describe("every sketch it accepts", () => {
    it("should read back from text mode as the same project with no problems, for sketches of awkward names", () => {
      // Arrange
      const accepted = readFuzzSketches(20261108, 4000);

      // Act
      const unstable = accepted.filter((sketch) => !isStableInTextMode(sketch));

      // Assert
      expect(accepted.length).toBeGreaterThan(1000);
      expect(
        accepted.filter((sketch) => sketch.dependencies.length > 0).length
      ).toBeGreaterThan(500);
      expect(unstable).toStrictEqual([]);
    });

    it("should be returned unchanged when it is read again", () => {
      // Arrange
      const accepted = readFuzzSketches(7, 2000);

      // Act
      const changed = accepted.filter(
        (sketch) => JSON.stringify(getSketch(sketch)) !== JSON.stringify(sketch)
      );

      // Assert
      expect(accepted.length).toBeGreaterThan(500);
      expect(changed).toStrictEqual([]);
    });
  });
});
