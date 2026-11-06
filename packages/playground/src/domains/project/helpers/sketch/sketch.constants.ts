import type { SketchDependencySyntax } from "@/contract";

import type {
  SourceResolver,
  SourceResolverName,
  SyntaxFacts,
} from "./sketch.types";

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

/** The resolvers of `import/resolver` that the playground runs. The names of any other resolver are not run */
export const SOURCE_RESOLVER_NAMES: readonly SourceResolverName[] = [
  "node",
  "typescript",
];

/** The extensions that each resolver adds to a source by default, in the order it tries them: the `extensions` option of `eslint-import-resolver-node` and of `eslint-import-resolver-typescript` when it is not set */
export const DEFAULT_RESOLVER_EXTENSIONS: Readonly<
  Record<SourceResolverName, readonly string[]>
> = {
  node: [".mjs", ".js", ".json", ".node"],
  typescript: [".ts", ".tsx", ".d.ts", ".js", ".jsx", ".json", ".node"],
};

/** The extensions that `eslint-import-resolver-typescript` tries instead of the one that a source ends with, in order: its `extensionAlias` option when it is not set. A source with one of these extensions only finds the files of its list, so that `./a.js` finds `a.ts` and `./a.jsx` does not find `a.js` */
export const TYPESCRIPT_EXTENSION_ALIASES: Readonly<
  Record<string, readonly string[]>
> = {
  ".js": [".ts", ".tsx", ".d.ts", ".js"],
  ".ts": [".ts", ".d.ts", ".js"],
  ".jsx": [".tsx", ".d.ts", ".jsx"],
  ".tsx": [".tsx", ".d.ts", ".jsx", ".js"],
  ".cjs": [".cts", ".d.cts", ".cjs"],
  ".cts": [".cts", ".d.cts", ".cjs"],
  ".mjs": [".mts", ".d.mts", ".mjs"],
  ".mts": [".mts", ".d.mts", ".mjs"],
};

/** The extensions that a resolver tries but that people write in a source, because they say what the file is: a source is never written without them */
export const WRITTEN_EXTENSIONS: readonly string[] = [".json", ".node"];

/** The resolvers used when the config sets none: the `node` resolver alone with its default extensions, as ESLint does when `import/resolver` is not set */
export const DEFAULT_RESOLVERS: readonly SourceResolver[] = [
  { name: "node", extensions: DEFAULT_RESOLVER_EXTENSIONS.node },
];
