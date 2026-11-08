import type { SketchDependencySyntax } from "@/contract";

import type { SyntaxFacts } from "./sketch.types";

/** Path of the config node: the file `eslint.config.js` at the root of the sketch, which is not a node of its tree */
export const CONFIG_PATH = "eslint.config.js";

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
