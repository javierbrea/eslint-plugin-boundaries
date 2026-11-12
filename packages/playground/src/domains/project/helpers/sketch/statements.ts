import type { SketchDependency, SketchSpecifier } from "@/contract";

import { getParentPath, joinPath } from "./paths";
import { CODE_EXTENSIONS } from "./sketch.constants";
import type { ParsedStatement, StatementToken } from "./sketch.types";

/** The dependency fields that decide how a statement is written */
type Statement = Pick<SketchDependency, "syntax" | "importKind" | "specifiers">;

/** A part of a statement while it is composed: a keyword, or text that {@link compose} turns into a text piece */
type Part = StatementToken | string;

/** A piece of the text of a statement that is read: a name or any run of other characters, a quoted source, or a mark of punctuation */
type Token = {
  readonly kind: "word" | "string" | "punctuation";
  readonly value: string;
};

/**
 * Tells whether a source is relative, so that it points to a file of the sketch: it starts with `./` or `../`, or it is `.` or `..`.
 * @param source A source, without quotes.
 */
export function isRelativeSource(source: string): boolean {
  return (
    source === "." ||
    source === ".." ||
    source.startsWith("./") ||
    source.startsWith("../")
  );
}

/**
 * Gets the folders of the folder that contains a file.
 * @param path The path of a file.
 */
function getFolderSegments(path: string): string[] {
  const folder = getParentPath(path);

  return folder === "" ? [] : folder.split("/");
}

/**
 * Finds the files that a relative source of a file can point to, among a set of files, as {@link resolveSource} reads it. It is apart so that a caller with many sources makes the set once, and so that a source that matches no file can be told from one that matches several.
 * @param files The paths of the files of the sketch.
 * @param from The path of the file that has the source.
 * @param source The source, without quotes.
 * @returns The paths of the files, in the order of the rule. The file that the source names exactly is the only one. Otherwise, they are the files that add one of the code extensions to the source, in the order of the extensions, and then the ones that add `/index` and one of them. A source that names a folder, because it ends with `/` or with `.` or `..`, tries only the `index` of the folder. None for a source that is not relative (`./` or `../`, `.` or `..`), that goes above the root of the sketch or that matches no file.
 */
export function findSourceFiles(
  files: ReadonlySet<string>,
  from: string,
  source: string
): readonly string[] {
  if (!isRelativeSource(source)) {
    return [];
  }

  const segments = getFolderSegments(from);
  const written = source.split("/");

  for (const segment of written) {
    if (segment === "..") {
      if (segments.length === 0) {
        return [];
      }
      segments.pop();
    } else if (segment !== "." && segment !== "") {
      segments.push(segment);
    }
  }

  const path = segments.join("/");
  const last = written[written.length - 1];
  // A folder has no name to match exactly or to add an extension to, only an index
  const isFolder = last === "" || last === "." || last === "..";

  if (!isFolder && files.has(path)) {
    return [path];
  }

  const named = isFolder
    ? []
    : CODE_EXTENSIONS.map((extension) => `${path}${extension}`);
  const indexes = CODE_EXTENSIONS.map((extension) =>
    joinPath(path, `index${extension}`)
  );

  return [...named, ...indexes].filter((candidate) => files.has(candidate));
}

/**
 * Finds the file that a relative source of a file points to, with the one rule of the playground, which does not depend on the config. A source that names a file of the sketch exactly is that file. Otherwise it is the file that adds to it one of the code extensions (`.js`, `.jsx`, `.ts`, `.tsx`, `.mjs`, `.cjs`, `.mts`, `.cts`, `.d.ts`), or `/index` and one of them. A source that names a folder, because it ends with `/` or with `.` or `..`, is only the `index` of the folder with one of the extensions.
 * @param files The paths of the files of the sketch.
 * @param from The path of the file that has the source.
 * @param source The source, without quotes.
 * @returns The path of the file, or `undefined` for a source that is not relative (`./` or `../`, `.` or `..`), that goes above the root of the sketch, that matches no file or that matches several (see {@link findSourceFiles}), since none is picked silently.
 */
export function resolveSource(
  files: readonly string[],
  from: string,
  source: string
): string | undefined {
  const found = findSourceFiles(new Set(files), from, source);

  return found.length === 1 ? found[0] : undefined;
}

/**
 * Writes the path from the folder of a file to another file, starting with `./` or `../`.
 * @param from The path of the file that has the dependency.
 * @param target The path of the file it points to.
 */
export function toRelativePath(from: string, target: string): string {
  const folder = getFolderSegments(from);
  const segments = target.split("/");
  let common = 0;

  // The last segment of the target is its name, so it never counts as a folder in common
  while (
    common < folder.length &&
    common < segments.length - 1 &&
    folder[common] === segments[common]
  ) {
    common += 1;
  }

  const below = segments.slice(common);
  const climb = folder.length - common;

  return climb === 0
    ? `./${below.join("/")}`
    : [...Array<string>(climb).fill(".."), ...below].join("/");
}

/**
 * Writes the source of a dependency, as it appears in its statement: the path from the folder of its file, starting with `./` or `../`, in full, with its extension and its `index`, so that it names the file exactly and does not depend on the config or on the other files of the sketch. An external target is its name.
 * @param dependency The dependency to write.
 * @param dependency.from
 * @param dependency.target
 * @returns The source, without quotes.
 */
export function getDependencySource({
  from,
  target,
}: SketchDependency): string {
  return target.kind === "external"
    ? target.name
    : toRelativePath(from, target.path);
}

/**
 * Makes a keyword piece of a statement.
 * @param text The keyword.
 */
function keyword(text: string): StatementToken {
  return { kind: "keyword", text };
}

/**
 * Turns parts into the pieces of a statement: a string is text, and the text that is next to other text becomes one piece.
 * @param parts The parts, in order.
 */
function compose(parts: readonly Part[]): readonly StatementToken[] {
  const tokens: StatementToken[] = [];

  for (const part of parts) {
    const token: StatementToken =
      typeof part === "string" ? { kind: "text", text: part } : part;
    const last = tokens.at(-1);

    if (token.kind === "text" && last?.kind === "text") {
      tokens[tokens.length - 1] = {
        kind: "text",
        text: last.text + token.text,
      };
    } else {
      tokens.push(token);
    }
  }
  return tokens;
}

/**
 * Writes the named specifiers of a statement between braces.
 * @param named The specifiers of kind `named`.
 */
function writeNamed(named: readonly SketchSpecifier[]): readonly Part[] {
  const parts: Part[] = ["{ "];

  named.forEach((specifier, index) => {
    parts.push(index === 0 ? specifier.name : `, ${specifier.name}`);
    if (specifier.alias !== undefined) {
      parts.push(" ", keyword("as"), ` ${specifier.alias}`);
    }
  });
  parts.push(" }");
  return parts;
}

/**
 * Writes the names of a statement: the default name, then the namespace or the named specifiers.
 * @param specifiers The specifiers of the statement.
 */
function writeNames(specifiers: readonly SketchSpecifier[]): readonly Part[] {
  const named = specifiers.filter(({ kind }) => kind === "named");
  const groups: Part[][] = [
    ...specifiers
      .filter(({ kind }) => kind === "default")
      .map((specifier) => [specifier.name]),
    ...specifiers
      .filter(({ kind }) => kind === "namespace")
      .map((specifier): Part[] => ["* ", keyword("as"), ` ${specifier.name}`]),
    ...(named.length > 0 ? [[...writeNamed(named)]] : []),
  ];

  return groups.flatMap((group, index) =>
    index === 0 ? group : [", ", ...group]
  );
}

/**
 * Writes a dependency as the pieces of its statement, so that the ui colors them. The forms are `import format, { round as r } from "<s>";`, `import format, * as ns from "<s>";`, `import "<s>";`, `import type { A } from "<s>";`, `export { round, x as y } from "<s>";`, `export * as ns from "<s>";`, `export * from "<s>";`, `export type * from "<s>";`, `require("<s>");` and `import("<s>");`, with double quotes and one space between tokens.
 * @param dependency What the statement says: its syntax, its kind and its names.
 * @param source The source, without quotes, as {@link getDependencySource} gives it.
 * @returns The pieces, in order. The text pieces next to each other are one piece.
 */
export function toStatementTokens(
  dependency: Statement,
  source: string
): readonly StatementToken[] {
  const { syntax, importKind, specifiers } = dependency;
  const quoted: StatementToken = { kind: "source", text: `"${source}"` };

  if (syntax === "require" || syntax === "dynamic-import") {
    return compose([
      keyword(syntax === "require" ? "require" : "import"),
      "(",
      quoted,
      ");",
    ]);
  }

  const names =
    specifiers.length === 0 && syntax === "export-from"
      ? ["*"]
      : writeNames(specifiers);

  return compose([
    keyword(syntax === "import" ? "import" : "export"),
    ...(importKind === "type" ? [" ", keyword("type")] : []),
    " ",
    ...(names.length === 0 ? [] : [...names, " ", keyword("from"), " "]),
    quoted,
    ";",
  ]);
}

/**
 * Writes a dependency as the text of its statement, as {@link toStatementTokens} gives it.
 * @param dependency What the statement says: its syntax, its kind and its names.
 * @param source The source, without quotes, as {@link getDependencySource} gives it.
 */
export function toStatement(dependency: Statement, source: string): string {
  return toStatementTokens(dependency, source)
    .map(({ text }) => text)
    .join("");
}

/**
 * Splits the text of a statement into tokens.
 * @param statement The statement, trimmed and without its final `;`.
 * @returns The tokens, or `undefined` when something cannot be a token: a quote that is not closed, a backslash in a source or a `;`.
 */
function tokenize(statement: string): readonly Token[] | undefined {
  // Sticky, so that every token starts where the last one ended. It is created here because it keeps its position
  const pattern = /\s*(?:(["'])([^"'\\]*)\1|([^\s{}(),*"';]+)|([{}(),*]))/y;
  const tokens: Token[] = [];

  while (pattern.lastIndex < statement.length) {
    const match = pattern.exec(statement);

    if (match === null) {
      return undefined;
    }
    if (match[1] !== undefined) {
      tokens.push({ kind: "string", value: match[2] });
    } else if (match[3] !== undefined) {
      tokens.push({ kind: "word", value: match[3] });
    } else {
      tokens.push({ kind: "punctuation", value: match[4] });
    }
  }
  return tokens;
}

/**
 * Tells whether a token is a given word.
 * @param token The token, if there is one.
 * @param value The word.
 */
function isWord(token: Token | undefined, value: string): boolean {
  return token?.kind === "word" && token.value === value;
}

/**
 * Tells whether a token is a given mark of punctuation.
 * @param token The token, if there is one.
 * @param value The mark.
 */
function isPunctuation(token: Token | undefined, value: string): boolean {
  return token?.kind === "punctuation" && token.value === value;
}

/**
 * Reads one item of a list of named specifiers: `name` or `name as alias`.
 * @param item The tokens between two commas.
 */
function parseNamedItem(item: readonly Token[]): SketchSpecifier | undefined {
  const [head, as, alias] = item;

  if (item.length === 1 && head.kind === "word") {
    return { kind: "named", name: head.value };
  }
  if (
    item.length === 3 &&
    head.kind === "word" &&
    isWord(as, "as") &&
    alias.kind === "word"
  ) {
    return { kind: "named", name: head.value, alias: alias.value };
  }
  return undefined;
}

/**
 * Reads a list of named specifiers, `{ a, b as c }`. An empty list is not a form that is written.
 * @param tokens The tokens, braces included.
 */
function parseNamed(
  tokens: readonly Token[]
): readonly SketchSpecifier[] | undefined {
  if (!isPunctuation(tokens[0], "{") || !isPunctuation(tokens.at(-1), "}")) {
    return undefined;
  }

  const items: Token[][] = [[]];

  for (const token of tokens.slice(1, -1)) {
    if (isPunctuation(token, ",")) {
      items.push([]);
    } else {
      items[items.length - 1].push(token);
    }
  }

  const specifiers = items.map(parseNamedItem);

  return specifiers.every((specifier) => specifier !== undefined)
    ? specifiers
    : undefined;
}

/**
 * Reads what comes after the default name of an import, or all of an export: a namespace, `* as ns`, or named specifiers.
 * @param tokens The tokens of the clause.
 */
function parseBindings(
  tokens: readonly Token[]
): readonly SketchSpecifier[] | undefined {
  const [star, as, local] = tokens;

  if (tokens.length === 3 && isPunctuation(star, "*") && isWord(as, "as")) {
    return local.kind === "word"
      ? [{ kind: "namespace", name: local.value }]
      : undefined;
  }
  return parseNamed(tokens);
}

/**
 * Reads the names of an import: a default name, a namespace or named specifiers, or a default name followed by one of the other two.
 * @param clause The tokens between `import` (or `import type`) and `from`.
 */
function parseImportClause(
  clause: readonly Token[]
): readonly SketchSpecifier[] | undefined {
  const [first, comma] = clause;

  if (first?.kind !== "word") {
    return parseBindings(clause);
  }

  const defaultName: SketchSpecifier = { kind: "default", name: first.value };

  if (clause.length === 1) {
    return [defaultName];
  }

  const bindings = isPunctuation(comma, ",")
    ? parseBindings(clause.slice(2))
    : undefined;

  return bindings === undefined ? undefined : [defaultName, ...bindings];
}

/**
 * Reads the names of an export: `*`, which exports everything, a namespace or named specifiers.
 * @param clause The tokens between `export` (or `export type`) and `from`.
 */
function parseExportClause(
  clause: readonly Token[]
): readonly SketchSpecifier[] | undefined {
  return clause.length === 1 && isPunctuation(clause[0], "*")
    ? []
    : parseBindings(clause);
}

/**
 * Reads the part of an import or export after the keyword and the optional `type`: the clause, `from` and the source.
 * @param tokens The tokens after `import` or `export`, or after the `type` that follows it.
 * @param parseClause Reads the names of the clause.
 * @param syntax The syntax of the statement.
 * @param importKind Whether the `type` was read.
 */
function parseFromClause(
  tokens: readonly Token[],
  parseClause: (
    clause: readonly Token[]
  ) => readonly SketchSpecifier[] | undefined,
  syntax: ParsedStatement["syntax"],
  importKind: ParsedStatement["importKind"]
): ParsedStatement | undefined {
  const source = tokens.at(-1);

  if (source?.kind !== "string" || !isWord(tokens.at(-2), "from")) {
    return undefined;
  }

  const specifiers = parseClause(tokens.slice(0, -2));

  return specifiers === undefined
    ? undefined
    : { syntax, importKind, specifiers, source: source.value };
}

/**
 * Reads an import or an export that may start with `type`. `type` is also a valid name (`import type from "x"`), so when the statement cannot be read as a type, it is read again with `type` as a name.
 * @param tokens The tokens after `import` or `export`.
 * @param parseClause Reads the names of the clause.
 * @param syntax The syntax of the statement.
 */
function parseTyped(
  tokens: readonly Token[],
  parseClause: (
    clause: readonly Token[]
  ) => readonly SketchSpecifier[] | undefined,
  syntax: ParsedStatement["syntax"]
): ParsedStatement | undefined {
  const typed = isWord(tokens[0], "type")
    ? parseFromClause(tokens.slice(1), parseClause, syntax, "type")
    : undefined;

  return typed ?? parseFromClause(tokens, parseClause, syntax, "value");
}

/**
 * Gets the syntax of a call by the word before its parenthesis.
 * @param callee The token before the parenthesis.
 */
function getCallSyntax(
  callee: Token | undefined
): ParsedStatement["syntax"] | undefined {
  if (isWord(callee, "require")) {
    return "require";
  }
  return isWord(callee, "import") ? "dynamic-import" : undefined;
}

/**
 * Reads `require("<s>")` and `import("<s>")`.
 * @param callee The token before the parenthesis.
 * @param rest The tokens from the parenthesis on.
 */
function parseCall(
  callee: Token | undefined,
  rest: readonly Token[]
): ParsedStatement | undefined {
  const [, source, closing] = rest;
  const syntax = getCallSyntax(callee);

  if (
    syntax === undefined ||
    rest.length !== 3 ||
    source.kind !== "string" ||
    !isPunctuation(closing, ")")
  ) {
    return undefined;
  }
  return { syntax, importKind: "value", specifiers: [], source: source.value };
}

/**
 * Reads the text of a statement as {@link toStatement} writes it: the inverse for every form it writes. It is tolerant of extra spaces, of single quotes and of a missing `;`.
 * @param text The text of one statement.
 * @returns What the statement says, or `undefined` for anything else: a name list that is empty, a template literal, a statement of another kind.
 */
export function parseStatement(text: string): ParsedStatement | undefined {
  const trimmed = text.trim();
  const tokens = tokenize(
    trimmed.endsWith(";") ? trimmed.slice(0, -1).trimEnd() : trimmed
  );

  if (tokens === undefined) {
    return undefined;
  }

  const [first, ...rest] = tokens;

  if (isPunctuation(rest[0], "(")) {
    return parseCall(first, rest);
  }
  if (isWord(first, "export")) {
    return parseTyped(rest, parseExportClause, "export-from");
  }
  if (!isWord(first, "import")) {
    return undefined;
  }
  // A side-effect import has only its source
  return rest.length === 1 && rest[0].kind === "string"
    ? {
        syntax: "import",
        importKind: "value",
        specifiers: [],
        source: rest[0].value,
      }
    : parseTyped(rest, parseImportClause, "import");
}
