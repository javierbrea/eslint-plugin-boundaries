#!/usr/bin/env node

/**
 * Checks that every Playwright page object (`X.pom.playwright.ts`) of a source folder matches its jsdom sibling (`X.pom.ts`), which keeps the two families of page objects of a component in step.
 *
 * Usage: `node scripts/check-pom-parity.js <srcDir>`
 *
 * For each `*.pom.playwright.ts` file under `<srcDir>`:
 * 1. The sibling `X.pom.ts` must exist in the same folder.
 * 2. Both files must export the same page object classes, whatever their name: the top-level classes that the file exports, by the name they are exported under (`export class A` is `A`, `export { A as B }` is `B`, `export default` is `default`), as a value or only as a type (`export type { PartPom }`). A class that the file does not export is internal to it.
 * 3. A Playwright class and the jsdom class of the same exported name must extend the same class: the text of their `extends` expressions must be equal (a class with no `extends` differs from one that has it), so that what they inherit is the same.
 * 4. Every public instance member that a Playwright class declares in its own body (method, accessor or property; not `private`, `protected`, `#private` or `static`, and not the constructor) must be a public instance member of the jsdom class of the same name. Only the names are compared. The members of the jsdom class are those declared in its body and the public instance ones that it inherits from the base classes that the script can resolve: it follows the `extends` identifier of a class to a class of the same file or to its import (a relative path or the `@/` alias, which is `<srcDir>`, to a `.ts` file or to the `index.ts` of a folder), through the `export { X } from` and `export * from` of a barrel, and repeats up the chain. It stops, with no problem, at a base that it cannot resolve, and then only the members that it has seen count. The members that a Playwright class inherits are not compared.
 *
 * A difference that is intended is marked with a whole-line `// pom-parity: <reason>` comment on the line right above the member, above its TSDoc block when it has one (the comment goes before the first line of the member, TSDoc included). A marker without a reason is a problem of its own and marks nothing.
 *
 * The script only parses the files, so it needs neither a program nor a type checker, and it assumes that they have no syntax errors, which `check:types` and `lint` report. Each problem is written to stderr as `path:line: message`, relative to the working directory, and the exit code is 1. A folder with no Playwright page object passes; a missing or unreadable folder does not.
 */

import fs from "node:fs";
import path from "node:path";

import ts from "typescript";

const PLAYWRIGHT_SUFFIX = ".pom.playwright.ts";
const JSDOM_SUFFIX = ".pom.ts";
const MARKER_PATTERN = /^\s*\/\/\s*pom-parity:(.*)$/;
const EXCLUDED_FOLDERS = new Set(["node_modules"]);

/**
 * @typedef {object} Problem
 * @property {string} file The absolute path of the file that holds the problem.
 * @property {number} line The 1-based line of the problem.
 * @property {string} message What is wrong.
 */

/**
 * @typedef {object} Member
 * @property {string} name The name of the member.
 * @property {number} line The 1-based line where the declaration starts, without its TSDoc.
 * @property {number} firstLine The 1-based line where the member starts, with its TSDoc.
 * @property {boolean} hasDoc Whether the member has a TSDoc block.
 */

/**
 * @typedef {object} PageObject
 * @property {ts.ClassDeclaration} node The declaration of the class.
 * @property {number} line The 1-based line of the class.
 */

/**
 * @typedef {object} ParsedFile
 * @property {ts.SourceFile} sourceFile The parsed source.
 * @property {string[]} lines The text of each line of the source, without its line terminator, split where the compiler splits it: at `\n`, `\r\n`, a lone `\r`, U+2028 and U+2029.
 */

/**
 * Lists the Playwright page object files under a folder, in a stable order.
 * @param {string} folder The absolute path of the folder to search.
 * @returns {string[]} The absolute paths of the `*.pom.playwright.ts` files.
 * @throws When the folder or one of its subfolders cannot be read.
 */
function findPlaywrightFiles(folder) {
  const found = [];

  for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
    const entryPath = path.join(folder, entry.name);

    if (entry.isDirectory()) {
      if (!EXCLUDED_FOLDERS.has(entry.name)) {
        found.push(...findPlaywrightFiles(entryPath));
      }
    } else if (
      entry.isFile() &&
      entry.name.endsWith(PLAYWRIGHT_SUFFIX) &&
      entry.name.length > PLAYWRIGHT_SUFFIX.length
    ) {
      found.push(entryPath);
    }
  }

  return found.sort();
}

/**
 * Returns the path of the jsdom page object file that a Playwright page object file mirrors.
 * @param {string} playwrightFile The path of an `X.pom.playwright.ts` file.
 * @returns {string} The path of `X.pom.ts`, in the same folder.
 */
function siblingOf(playwrightFile) {
  return playwrightFile.slice(0, -PLAYWRIGHT_SUFFIX.length) + JSDOM_SUFFIX;
}

/**
 * Reads and parses a file. The parse needs no program, and it reports no syntax errors.
 * @param {string} file The absolute path of a TypeScript file.
 * @returns {ParsedFile} The source file and its lines.
 * @throws When the file cannot be read.
 */
function parse(file) {
  const text = fs.readFileSync(file, "utf8");
  const sourceFile = ts.createSourceFile(
    file,
    text,
    ts.ScriptTarget.Latest,
    false,
    ts.ScriptKind.TS
  );
  const starts = sourceFile.getLineStarts();

  return {
    sourceFile,
    lines: starts.map((start, index) =>
      text
        .slice(start, starts[index + 1] ?? text.length)
        .replace(/[\n\r\u2028\u2029]+$/, "")
    ),
  };
}

/**
 * Returns the 1-based line of a position in a source file.
 * @param {ts.SourceFile} sourceFile The source file.
 * @param {number} position The offset of the position.
 * @returns {number} The line.
 */
function lineAt(sourceFile, position) {
  return sourceFile.getLineAndCharacterOfPosition(position).line + 1;
}

/**
 * Returns the modifier keywords of a node.
 * @param {ts.Node} node The node, such as a class or one of its members.
 * @returns {Set<ts.SyntaxKind>} The kinds of its modifiers.
 */
function modifierKinds(node) {
  return new Set(
    (ts.canHaveModifiers(node) ? (ts.getModifiers(node) ?? []) : []).map(
      (modifier) => modifier.kind
    )
  );
}

/**
 * Returns the names that a file exports through an `export { ... }` list or an `export default`, whether the list is a type export or not. A re-export from another module is not a declaration of this file, so it is left out.
 * @param {ts.SourceFile} sourceFile The source file.
 * @returns {Map<string, string[]>} The names that each local name is exported under: `export { A as B }` exports `A` as `B`, and `export default A` exports it as `default`.
 */
function namesExportedApart(sourceFile) {
  const names = new Map();
  const add = (/** @type {string} */ local, /** @type {string} */ exported) =>
    names.set(local, [...(names.get(local) ?? []), exported]);

  for (const statement of sourceFile.statements) {
    if (
      ts.isExportDeclaration(statement) &&
      statement.moduleSpecifier === undefined &&
      statement.exportClause !== undefined &&
      ts.isNamedExports(statement.exportClause)
    ) {
      for (const specifier of statement.exportClause.elements) {
        add(
          (specifier.propertyName ?? specifier.name).text,
          specifier.name.text
        );
      }
    } else if (
      ts.isExportAssignment(statement) &&
      ts.isIdentifier(statement.expression)
    ) {
      add(statement.expression.text, "default");
    }
  }

  return names;
}

/**
 * Collects the page object classes of a file: the top-level classes that the file exports, whatever their name, directly or in an export list, as a value or only as a type. A class that is not exported is internal to the file and is not a page object.
 * @param {ParsedFile} parsed The parsed file.
 * @returns {Map<string, PageObject>} The classes by the name they are exported under, which is `default` for the default export.
 */
function collectPageObjects({ sourceFile }) {
  const exportedApart = namesExportedApart(sourceFile);
  const pageObjects = new Map();

  for (const statement of sourceFile.statements) {
    if (ts.isClassDeclaration(statement)) {
      const kinds = modifierKinds(statement);
      const names = [...(exportedApart.get(statement.name?.text) ?? [])];

      if (kinds.has(ts.SyntaxKind.ExportKeyword)) {
        names.push(
          kinds.has(ts.SyntaxKind.DefaultKeyword)
            ? "default"
            : statement.name.text
        );
      }

      for (const name of names) {
        pageObjects.set(name, {
          node: statement,
          line: lineAt(sourceFile, statement.getStart(sourceFile)),
        });
      }
    }
  }

  return pageObjects;
}

/**
 * Returns the name of a class member, or undefined for a name that is not public by its syntax (`#private`) or a member that has none.
 * @param {ts.PropertyName | ts.BindingName | undefined} nameNode The name node of the member.
 * @param {ts.SourceFile} sourceFile The source file of the member, which the nodes of a parse with no parent pointers cannot find by themselves.
 * @returns {string | undefined} The name, which for a computed name is its source text in brackets.
 */
function memberName(nameNode, sourceFile) {
  if (nameNode === undefined || ts.isPrivateIdentifier(nameNode)) {
    return undefined;
  }

  if (ts.isComputedPropertyName(nameNode)) {
    return `[${nameNode.expression.getText(sourceFile)}]`;
  }

  return ts.isIdentifier(nameNode) ||
    ts.isStringLiteral(nameNode) ||
    ts.isNumericLiteral(nameNode)
    ? nameNode.text
    : undefined;
}

/**
 * Tells whether a node declares an instance member that is public: it has neither `private`, `protected` nor `static`.
 * @param {ts.Node} node The member, or a constructor parameter.
 * @returns {boolean} True when the member is a public instance one.
 */
function isPublicInstance(node) {
  const kinds = modifierKinds(node);

  return ![
    ts.SyntaxKind.PrivateKeyword,
    ts.SyntaxKind.ProtectedKeyword,
    ts.SyntaxKind.StaticKeyword,
  ].some((kind) => kinds.has(kind));
}

/**
 * Collects the declarations that make a member of the instance: methods, accessors and properties of the body, and the parameter properties of the constructor (`constructor(readonly page: Page)`), which TypeScript declares as members.
 * @param {ts.ClassDeclaration} classNode The class.
 * @returns {{ node: ts.Node, nameNode: ts.Node | undefined }[]} The nodes that declare members, with the node of their name.
 */
function memberDeclarations(classNode) {
  const declarations = [];

  for (const element of classNode.members) {
    if (
      ts.isMethodDeclaration(element) ||
      ts.isGetAccessorDeclaration(element) ||
      ts.isSetAccessorDeclaration(element) ||
      ts.isPropertyDeclaration(element)
    ) {
      declarations.push({ node: element, nameNode: element.name });
    } else if (ts.isConstructorDeclaration(element)) {
      for (const parameter of element.parameters) {
        // A parameter with a modifier (`readonly`, `public`, `private`...) is a property; the other ones are plain parameters
        if (modifierKinds(parameter).size > 0) {
          declarations.push({ node: parameter, nameNode: parameter.name });
        }
      }
    }
  }

  return declarations;
}

/**
 * Collects the public instance members that a class declares in its own body. Overloads, and a getter with its setter, are one member each, by name; the first declaration gives the lines.
 * @param {ts.ClassDeclaration} classNode The class.
 * @param {ts.SourceFile} sourceFile The source file of the class.
 * @returns {Map<string, Member>} The members by name.
 */
function publicMembers(classNode, sourceFile) {
  const members = new Map();

  for (const { node, nameNode } of memberDeclarations(classNode)) {
    const name = memberName(nameNode, sourceFile);

    if (name !== undefined && isPublicInstance(node) && !members.has(name)) {
      const start = node.getStart(sourceFile);
      const startWithDoc = node.getStart(sourceFile, true);

      members.set(name, {
        name,
        line: lineAt(sourceFile, start),
        firstLine: lineAt(sourceFile, startWithDoc),
        hasDoc: startWithDoc !== start,
      });
    }
  }

  return members;
}

/**
 * Returns the expression that a class extends.
 * @param {ts.ClassDeclaration} classNode The class.
 * @returns {ts.Expression | undefined} The expression of its `extends` clause, or undefined when it has none.
 */
function baseOf(classNode) {
  return classNode.heritageClauses?.find(
    (clause) => clause.token === ts.SyntaxKind.ExtendsKeyword
  )?.types[0].expression;
}

/**
 * Resolves the module specifier of an import or a re-export to a file of the source folder.
 * @param {string} specifier The module specifier.
 * @param {string} fromFile The absolute path of the file that holds the declaration.
 * @param {string} srcDir The absolute path of the source folder, which the `@/` alias stands for.
 * @returns {string | undefined} The absolute path of the `.ts` file, or of the `index.ts` of the folder, or undefined when the specifier is neither a relative path nor an `@/` one, or when there is no such file.
 */
function resolveModule(specifier, fromFile, srcDir) {
  let base;

  if (specifier.startsWith("./") || specifier.startsWith("../")) {
    base = path.resolve(path.dirname(fromFile), specifier);
  } else if (specifier.startsWith("@/")) {
    base = path.join(srcDir, specifier.slice(2));
  } else {
    return undefined;
  }

  return [`${base}.ts`, path.join(base, "index.ts")].find(isFile);
}

/**
 * Reads what an import or a re-export declaration takes from its module under a name.
 * @param {ts.ImportDeclaration | ts.ExportDeclaration} statement The declaration.
 * @param {string} name The name that the declaration gives in its file: the local name of an import, the exported name of a re-export.
 * @returns {string | undefined} The name in the module, which is `default` for a default import and the same name for `export * from`, or undefined when the declaration gives no such name.
 */
function remoteName(statement, name) {
  const isImport = ts.isImportDeclaration(statement);
  const clause = isImport
    ? statement.importClause?.namedBindings
    : statement.exportClause;

  if (isImport && statement.importClause?.name?.text === name) {
    return "default";
  }

  if (clause === undefined) {
    return isImport ? undefined : name;
  }

  if (ts.isNamedImports(clause) || ts.isNamedExports(clause)) {
    const element = clause.elements.find(
      (specifier) => specifier.name.text === name
    );

    return element && (element.propertyName ?? element.name).text;
  }

  return undefined;
}

/**
 * Finds a class that a file exports, following the `export { X } from` and `export * from` declarations of a barrel to the file that declares it.
 * @param {string} file The absolute path of the file.
 * @param {string} name The exported name of the class.
 * @param {string} srcDir The absolute path of the source folder.
 * @param {Set<unknown>} visited What was visited already, to stop at a cycle.
 * @returns {{ node: ts.ClassDeclaration, parsed: ParsedFile } | undefined} The class and its file, or undefined when it cannot be found.
 */
function findExported(file, name, srcDir, visited) {
  const key = `${file}#${name}`;

  if (visited.has(key)) {
    return undefined;
  }

  visited.add(key);

  const { parsed } = tryParse(file);

  if (parsed === undefined) {
    return undefined;
  }

  const own = collectPageObjects(parsed).get(name);

  if (own) {
    return { node: own.node, parsed };
  }

  for (const statement of parsed.sourceFile.statements) {
    if (
      ts.isExportDeclaration(statement) &&
      statement.moduleSpecifier !== undefined &&
      ts.isStringLiteral(statement.moduleSpecifier)
    ) {
      const remote = remoteName(statement, name);
      const target =
        remote && resolveModule(statement.moduleSpecifier.text, file, srcDir);
      const found = target && findExported(target, remote, srcDir, visited);

      if (found) {
        return found;
      }
    }
  }

  return undefined;
}

/**
 * Finds the class that a name stands for in a file: a class of the file, or a class that the file imports.
 * @param {string} name The name of the class in the file.
 * @param {ParsedFile} parsed The parsed file.
 * @param {string} srcDir The absolute path of the source folder.
 * @param {Set<unknown>} visited What was visited already, to stop at a cycle.
 * @returns {{ node: ts.ClassDeclaration, parsed: ParsedFile } | undefined} The class and its file, or undefined when it cannot be resolved.
 */
function findClass(name, parsed, srcDir, visited) {
  const { sourceFile } = parsed;

  for (const statement of sourceFile.statements) {
    if (ts.isClassDeclaration(statement) && statement.name?.text === name) {
      return { node: statement, parsed };
    }

    if (
      ts.isImportDeclaration(statement) &&
      ts.isStringLiteral(statement.moduleSpecifier)
    ) {
      const remote = remoteName(statement, name);
      const target =
        remote &&
        resolveModule(
          statement.moduleSpecifier.text,
          sourceFile.fileName,
          srcDir
        );

      if (target) {
        return findExported(target, remote, srcDir, visited);
      }
    }
  }

  return undefined;
}

/**
 * Collects the public instance members of a class: those it declares in its own body, and those it inherits from the base classes that can be resolved, up the chain. It stops at a base that cannot be resolved, such as one from a package or a computed one.
 * @param {ts.ClassDeclaration} classNode The class.
 * @param {ParsedFile} parsed The parsed file of the class.
 * @param {string} srcDir The absolute path of the source folder.
 * @param {Set<unknown>} [visited] What was visited already, to stop at a cycle.
 * @returns {Map<string, Member>} The members by name.
 */
function resolvedMembers(classNode, parsed, srcDir, visited = new Set()) {
  const members = publicMembers(classNode, parsed.sourceFile);
  const base = baseOf(classNode);

  if (base !== undefined && ts.isIdentifier(base) && !visited.has(classNode)) {
    visited.add(classNode);

    const parent = findClass(base.text, parsed, srcDir, visited);

    if (parent !== undefined) {
      for (const [name, member] of resolvedMembers(
        parent.node,
        parent.parsed,
        srcDir,
        visited
      )) {
        if (!members.has(name)) {
          members.set(name, member);
        }
      }
    }
  }

  return members;
}

/**
 * Reads the reason of the `// pom-parity:` comment that is alone on a line.
 * @param {string | undefined} line The text of the line, or undefined when there is none.
 * @returns {string | undefined} The trimmed reason, which is an empty string for a marker with no reason, or undefined when the line is not a marker.
 */
function markerReason(line) {
  const match = line === undefined ? null : MARKER_PATTERN.exec(line);

  return match === null ? undefined : match[1].trim();
}

/**
 * Tells whether a member carries a `// pom-parity: <reason>` comment on the line above its first line, TSDoc included.
 * @param {Member} member The member.
 * @param {string[]} lines The lines of its file.
 * @returns {boolean} True when the comment is there with a reason.
 */
function isMarked(member, lines) {
  return (markerReason(lines[member.firstLine - 2]) ?? "") !== "";
}

/**
 * Describes where to put the comment that marks a member, for the message of a member that lacks it. It points out the comment that sits between the TSDoc and the member, a placement that marks nothing.
 * @param {Member} member The member.
 * @param {string[]} lines The lines of its file.
 * @returns {string} The advice.
 */
function markerAdvice(member, lines) {
  const misplaced =
    member.hasDoc && (markerReason(lines[member.line - 2]) ?? "") !== "";

  return misplaced
    ? 'The "// pom-parity:" comment must be above the TSDoc block of the member, not between the two.'
    : 'Declare it there, or put "// pom-parity: <reason>" on the line above it (above its TSDoc block, if it has one).';
}

/**
 * Compares the base classes of a Playwright class and of the jsdom class of the same name.
 * @param {string} name The name of the class.
 * @param {PageObject} playwright The Playwright class.
 * @param {PageObject} jsdom The jsdom class.
 * @param {{ playwright: ParsedFile, jsdom: ParsedFile }} parsed The parsed files.
 * @param {string} playwrightFile The absolute path of the Playwright file.
 * @returns {Problem[]} A problem when the `extends` expressions differ.
 */
function compareBases(name, playwright, jsdom, parsed, playwrightFile) {
  const playwrightBase = baseOf(playwright.node)?.getText(
    parsed.playwright.sourceFile
  );
  const jsdomBase = baseOf(jsdom.node)?.getText(parsed.jsdom.sourceFile);
  const describe = (/** @type {string | undefined} */ base) =>
    base === undefined ? "nothing" : `"${base}"`;

  return playwrightBase === jsdomBase
    ? []
    : [
        {
          file: playwrightFile,
          line: playwright.line,
          message: `"${name}" extends ${describe(playwrightBase)}, but the jsdom "${name}" extends ${describe(jsdomBase)}. Both must extend the same class, so that what they inherit is the same.`,
        },
      ];
}

/**
 * Compares the public members that a Playwright class declares with the public members of the jsdom class of the same name.
 * @param {string} name The name of the class.
 * @param {PageObject} playwright The Playwright class.
 * @param {Map<string, Member>} jsdomMembers The public instance members of the jsdom class, the inherited ones included.
 * @param {ParsedFile} parsed The parsed Playwright file.
 * @param {string} playwrightFile The absolute path of the Playwright file.
 * @returns {Problem[]} One problem per member that the jsdom class lacks and no comment marks.
 */
function compareMembers(
  name,
  playwright,
  jsdomMembers,
  parsed,
  playwrightFile
) {
  const problems = [];

  for (const member of publicMembers(
    playwright.node,
    parsed.sourceFile
  ).values()) {
    if (!jsdomMembers.has(member.name) && !isMarked(member, parsed.lines)) {
      problems.push({
        file: playwrightFile,
        line: member.line,
        message: `"${name}.${member.name}" is not a member of the jsdom "${name}". ${markerAdvice(member, parsed.lines)}`,
      });
    }
  }

  return problems;
}

/**
 * Compares the page object classes that two files declare, and the base classes and members of those that both declare.
 * @param {string} playwrightFile The absolute path of the Playwright file.
 * @param {string} jsdomFile The absolute path of its jsdom sibling.
 * @param {{ playwright: ParsedFile, jsdom: ParsedFile }} parsed The parsed files.
 * @param {string} srcDir The absolute path of the source folder.
 * @returns {{ problems: Problem[], classCount: number }} The problems, and how many Playwright classes were checked.
 */
function compareFiles(playwrightFile, jsdomFile, parsed, srcDir) {
  const playwright = collectPageObjects(parsed.playwright);
  const jsdom = collectPageObjects(parsed.jsdom);
  const jsdomName = path.basename(jsdomFile);
  const problems = [];

  for (const [name, pageObject] of jsdom) {
    if (!playwright.has(name)) {
      problems.push({
        file: playwrightFile,
        line: 1,
        message: `Missing page object "${name}", which ${jsdomName} exports (line ${pageObject.line}).`,
      });
    }
  }

  for (const [name, pageObject] of playwright) {
    const mirrored = jsdom.get(name);

    if (mirrored === undefined) {
      problems.push({
        file: playwrightFile,
        line: pageObject.line,
        message: `Page object "${name}" is not exported by ${jsdomName}.`,
      });
    } else {
      problems.push(
        ...compareBases(name, pageObject, mirrored, parsed, playwrightFile),
        ...compareMembers(
          name,
          pageObject,
          resolvedMembers(mirrored.node, parsed.jsdom, srcDir),
          parsed.playwright,
          playwrightFile
        )
      );
    }
  }

  return { problems, classCount: playwright.size };
}

/**
 * Finds the `// pom-parity:` comments that give no reason, wherever they are in the file.
 * @param {string} playwrightFile The absolute path of the Playwright file.
 * @param {string[]} lines The lines of the file.
 * @returns {Problem[]} One problem per comment with no reason.
 */
function findEmptyReasons(playwrightFile, lines) {
  const problems = [];

  lines.forEach((text, index) => {
    if (markerReason(text) === "") {
      problems.push({
        file: playwrightFile,
        line: index + 1,
        message: 'The "// pom-parity:" comment needs a reason after the colon.',
      });
    }
  });

  return problems;
}

/**
 * Parses a file, or turns the failure into a problem so that the other files are still checked.
 * @param {string} file The absolute path of the file.
 * @returns {{ parsed: ParsedFile } | { problem: Problem }} The parsed file, or why it cannot be read.
 */
function tryParse(file) {
  try {
    return { parsed: parse(file) };
  } catch (error) {
    return {
      problem: {
        file,
        line: 1,
        message: `The file cannot be read: ${error.message}`,
      },
    };
  }
}

/**
 * Tells whether a path is a file.
 * @param {string} file The path.
 * @returns {boolean} True when it exists and is a file.
 */
function isFile(file) {
  try {
    return fs.statSync(file).isFile();
  } catch {
    return false;
  }
}

/**
 * Checks a Playwright page object file against its jsdom sibling.
 * @param {string} playwrightFile The absolute path of the Playwright file.
 * @param {string} srcDir The absolute path of the source folder.
 * @returns {{ problems: Problem[], classCount: number }} The problems, and how many Playwright classes were checked.
 */
function checkFile(playwrightFile, srcDir) {
  const jsdomFile = siblingOf(playwrightFile);
  const playwright = tryParse(playwrightFile);

  if (playwright.problem) {
    return { problems: [playwright.problem], classCount: 0 };
  }

  const problems = findEmptyReasons(playwrightFile, playwright.parsed.lines);

  if (!isFile(jsdomFile)) {
    problems.push({
      file: playwrightFile,
      line: 1,
      message: `Missing jsdom sibling ${path.basename(jsdomFile)} in the same folder.`,
    });
    return { problems, classCount: 0 };
  }

  const jsdom = tryParse(jsdomFile);

  if (jsdom.problem) {
    return { problems: [...problems, jsdom.problem], classCount: 0 };
  }

  const comparison = compareFiles(
    playwrightFile,
    jsdomFile,
    { playwright: playwright.parsed, jsdom: jsdom.parsed },
    srcDir
  );

  return {
    problems: [...problems, ...comparison.problems],
    classCount: comparison.classCount,
  };
}

/**
 * Formats a problem as `path:line: message`, with the path relative to the working directory.
 * @param {Problem} problem The problem.
 * @returns {string} The line to print.
 */
function formatProblem({ file, line, message }) {
  return `${path.relative(process.cwd(), file)}:${line}: ${message}`;
}

/**
 * Writes the count of something with its noun in the right number.
 * @param {number} amount How many there are.
 * @param {string} singular The noun for one.
 * @param {string} plural The noun for any other count.
 * @returns {string} The count and the noun, such as `2 files`.
 */
function pluralize(amount, singular, plural) {
  return `${amount} ${amount === 1 ? singular : plural}`;
}

/**
 * Builds the line that tells that the page objects match.
 * @param {string} srcArg The folder, as the user gave it.
 * @param {number} fileCount How many Playwright page object files there are.
 * @param {number} classCount How many Playwright page object classes they declare.
 * @returns {string} The line to print.
 */
function successLine(srcArg, fileCount, classCount) {
  if (fileCount === 0) {
    return `check-pom-parity: no *${PLAYWRIGHT_SUFFIX} file in "${srcArg}", nothing to check.`;
  }

  return `check-pom-parity: ${pluralize(fileCount, "Playwright page object file", "Playwright page object files")} (${pluralize(classCount, "class", "classes")}) match their jsdom siblings.`;
}

/**
 * Runs the check and prints its result.
 * @param {string[]} args The arguments after the script: the source folder.
 * @returns {number} The exit code: 0 when the page objects match, 1 otherwise.
 */
function main(args) {
  if (args.length !== 1) {
    console.error("Usage: node check-pom-parity.js <srcDir>");
    return 1;
  }

  const [srcArg] = args;
  const srcDir = path.resolve(srcArg);
  let files;

  try {
    files = findPlaywrightFiles(srcDir);
  } catch (error) {
    console.error(
      `check-pom-parity: cannot read "${srcArg}": ${error.message}`
    );
    return 1;
  }

  const results = files.map((file) => checkFile(file, srcDir));
  const problems = results
    .flatMap((result) => result.problems)
    .sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);

  if (problems.length > 0) {
    problems.forEach((problem) => console.error(formatProblem(problem)));
    console.error(
      `check-pom-parity: ${pluralize(problems.length, "problem", "problems")} in the Playwright page objects of "${srcArg}".`
    );
    return 1;
  }

  const classCount = results.reduce(
    (sum, result) => sum + result.classCount,
    0
  );
  process.stdout.write(`${successLine(srcArg, files.length, classCount)}\n`);
  return 0;
}

process.exitCode = main(process.argv.slice(2));
