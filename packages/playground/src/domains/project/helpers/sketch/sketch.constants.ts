import type { SketchDependencySyntax } from "@/contract";

import type { SyntaxFacts } from "./sketch.types";

/** Path of the config node: the file `eslint.config.js` at the root of the sketch, which is not a node of its tree */
export const CONFIG_PATH = "eslint.config.js";

/** The most characters a path of the sketch can have. A real project has paths of a few dozen characters, and an operating system allows 260 to 4,096, so this is far above what anyone draws. A path without a limit is a way to freeze the page with a tiny link: one path of 5,000 folders fits in a link of 134 characters and overflowed the stack of the tree, and one of 40,000 folders took 12 seconds and 1.6 GB to read */
export const MAX_PATH_LENGTH = 1024;

/** The most segments (folders and the name) a path of the sketch can have. A real project nests a path a dozen levels deep, so this is far above what anyone draws. The tree calls itself once per folder of a path, so this is also the depth of its stack. See {@link MAX_PATH_LENGTH} */
export const MAX_PATH_SEGMENTS = 64;

/** The most files and folders (the nodes of the tree) that a sketch read from outside, such as a link, can have. The largest sketch in a link that was measured has 500 files, so this is twice that. The checks of a sketch take time in proportion to its size, so the limit bounds the time of reading a link: 1,000 nodes with the longest paths allowed, all of them different, are read in 74 ms on Node.js 24. A sketch with more is refused with a sentence */
export const MAX_SKETCH_NODES = 1000;

/** The most dependencies that a sketch read from outside, such as a link, can have: three for each file of {@link MAX_SKETCH_NODES}. See there for why the limit exists. The worst sketch within both limits and the size limit of the link takes 106 ms to read on Node.js 24: 1,000 files with the longest paths allowed and 1,450 dependencies between them */
export const MAX_SKETCH_DEPENDENCIES = 3000;

/** What each syntax holds, in the order the picker offers the syntaxes. `export … from` holds named names (`default` is a name there) or one namespace; `require()` and `import()` hold values and no names. The checks of a dependency and the picker read this table, so a syntax changes here and nowhere else */
export const SYNTAX_FACTS: Readonly<
  Record<SketchDependencySyntax, SyntaxFacts>
> = {
  import: {
    name: "import",
    importKinds: ["value", "type"],
    specifierKinds: ["default", "named", "namespace"],
  },
  "export-from": {
    name: "export … from",
    importKinds: ["value", "type"],
    specifierKinds: ["named", "namespace"],
  },
  require: { name: "require()", importKinds: ["value"], specifierKinds: [] },
  "dynamic-import": {
    name: "import()",
    importKinds: ["value"],
    specifierKinds: [],
  },
};

/** Splits the text of text mode into its lines, which are numbered from 1 in the order they come: a line ends with `\n` or `\r\n`, and the text of a sketch ends with a line break, which leaves an empty line last */
export const TEXT_LINE_BREAK = /\r?\n/;

/** The extensions that text mode adds to a source that names no file of the sketch, in the order it tries them: `./b` can be `b.js`, `b.jsx` and so on, or the `index` of the folder `b/` with each of them. They are the playground's own and do not depend on the config */
export const CODE_EXTENSIONS: readonly string[] = [
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
