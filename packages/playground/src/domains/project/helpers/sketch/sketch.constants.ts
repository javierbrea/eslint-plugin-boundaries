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
