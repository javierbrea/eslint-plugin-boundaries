#!/usr/bin/env node

/**
 * Checks that a build output imports nothing but its own files and the bare specifiers it is allowed, which is how a bundle keeps its closure: a `./playwright` entry that must load only in Node.js, inside the Playwright runner, fails here when a page object or a constants file drags in React or a component.
 *
 * Usage: `node scripts/check-bundle-imports.js <outputDir> [--allow <specifier>]...`, for example `node ../../scripts/check-bundle-imports.js dist-playwright --allow @playwright/test`.
 *
 * It reads every `.js`, `.mjs`, `.cjs`, `.d.ts`, `.d.mts` and `.d.cts` file under the output folder, and reports the specifier of every `import` and `export ... from` declaration, `import x = require()`, dynamic `import()`, `require()` call (or `__require()`, which esbuild writes in place of it when it bundles a CommonJS module), `import("x")` type, `/// <reference types="x" />` directive and `/// <reference path="x" />` directive. A specifier passes when it is relative and stays inside the output folder, or when it is exactly one of the allowed specifiers as the build writes it: a subpath such as `@playwright/test/reporter` needs its own `--allow`, and tsup writes a builtin without `node:`, so `node:fs` is allowed as `fs`. Everything else fails: any other bare specifier or builtin, an absolute path, a relative path that leaves the folder, and a dynamic `import()` or `require()` whose specifier is not a string literal, since it cannot be checked. The path of a `/// <reference path="x" />` is always a file path, relative to the file that holds it with or without a leading `./`, so it passes only when it stays inside the folder, and it is never matched with the allowed specifiers.
 *
 * Each problem is written to stderr as `path:line: message`, relative to the working directory, and the exit code is 1. A missing folder, a folder with no file to check and a bad argument also fail, with the exit code 1 for the first two and 2 for the last.
 */

import fs from "node:fs";
import path from "node:path";

import ts from "typescript";

const CHECKED_EXTENSIONS = [".js", ".mjs", ".cjs", ".d.ts", ".d.mts", ".d.cts"];
// `require`, and the `__require` that esbuild calls in place of it when it bundles a CommonJS module
const REQUIRE_NAME = /^(?:__)?require$/;
const USAGE =
  "Usage: node check-bundle-imports.js <outputDir> [--allow <specifier>]...";

/**
 * @typedef {object} Reference
 * @property {string | undefined} specifier The specifier, or undefined when it is not a string literal.
 * @property {number} line The 1-based line of the reference.
 * @property {string} kind What references it, for the message.
 */

/**
 * @typedef {object} Problem
 * @property {string} file The absolute path of the file that holds the problem.
 * @property {number} line The 1-based line of the problem.
 * @property {string} message What is wrong.
 */

/**
 * Reads the arguments of the command line.
 * @param {string[]} args The arguments after the script.
 * @returns {{ outputDir: string, allowed: string[] }} The output folder and the allowed specifiers.
 * @throws When the arguments are not those of the usage.
 */
function parseArguments(args) {
  const allowed = [];
  const positional = [];

  for (let index = 0; index < args.length; index++) {
    const arg = args[index];

    if (arg === "--allow") {
      const specifier = args[++index];

      if (specifier === undefined || specifier.startsWith("--")) {
        throw new Error("--allow needs a specifier");
      }

      allowed.push(specifier);
    } else if (arg.startsWith("--allow=") && arg.length > "--allow=".length) {
      allowed.push(arg.slice("--allow=".length));
    } else if (arg.startsWith("--")) {
      throw new Error(`Unknown option ${arg}`);
    } else {
      positional.push(arg);
    }
  }

  if (positional.length !== 1) {
    throw new Error("Exactly one output folder is needed");
  }

  return { outputDir: path.resolve(positional[0]), allowed };
}

/**
 * Lists the files to check under a folder, in a stable order.
 * @param {string} folder The absolute path of the folder to search.
 * @returns {string[]} The absolute paths of the emitted code and declaration files.
 * @throws When the folder or one of its subfolders cannot be read.
 */
function listFiles(folder) {
  return fs
    .readdirSync(folder, { withFileTypes: true })
    .sort((first, second) => first.name.localeCompare(second.name))
    .flatMap((entry) => {
      const entryPath = path.join(folder, entry.name);

      if (entry.isDirectory()) {
        return listFiles(entryPath);
      }

      return CHECKED_EXTENSIONS.some((extension) =>
        entry.name.endsWith(extension)
      )
        ? [entryPath]
        : [];
    });
}

/**
 * Collects the references to other modules that a file holds.
 * @param {string} file The absolute path of the file.
 * @param {string} text The source of the file.
 * @returns {Reference[]} The references, in line order.
 */
function collectReferences(file, text) {
  const isDeclaration = /\.d\.[cm]?ts$/.test(file);
  const sourceFile = ts.createSourceFile(
    file,
    text,
    ts.ScriptTarget.Latest,
    false,
    isDeclaration ? ts.ScriptKind.TS : ts.ScriptKind.JS
  );
  /** @type {Reference[]} */
  const references = [];

  const lineOf = (/** @type {number} */ position) =>
    sourceFile.getLineAndCharacterOfPosition(position).line + 1;
  const add = (
    /** @type {ts.Node | undefined} */ expression,
    /** @type {string} */ kind,
    /** @type {number} */ position
  ) =>
    references.push({
      specifier:
        expression && ts.isStringLiteralLike(expression)
          ? expression.text
          : undefined,
      line: lineOf(position),
      kind,
    });

  const visit = (/** @type {ts.Node} */ node) => {
    if (ts.isImportDeclaration(node)) {
      add(node.moduleSpecifier, "import", node.getStart(sourceFile));
    } else if (ts.isExportDeclaration(node) && node.moduleSpecifier) {
      add(node.moduleSpecifier, "export", node.getStart(sourceFile));
    } else if (
      ts.isImportEqualsDeclaration(node) &&
      ts.isExternalModuleReference(node.moduleReference)
    ) {
      add(
        node.moduleReference.expression,
        "import =",
        node.getStart(sourceFile)
      );
    } else if (ts.isImportTypeNode(node)) {
      add(
        ts.isLiteralTypeNode(node.argument) ? node.argument.literal : undefined,
        "import type",
        node.getStart(sourceFile)
      );
    } else if (ts.isCallExpression(node)) {
      if (node.expression.kind === ts.SyntaxKind.ImportKeyword) {
        add(node.arguments[0], "dynamic import", node.getStart(sourceFile));
      } else if (
        ts.isIdentifier(node.expression) &&
        REQUIRE_NAME.test(node.expression.text)
      ) {
        add(node.arguments[0], "require", node.getStart(sourceFile));
      }
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);

  for (const [directives, kind] of [
    [sourceFile.typeReferenceDirectives, "reference types"],
    [sourceFile.referencedFiles, "reference path"],
  ]) {
    for (const directive of directives) {
      references.push({
        specifier: directive.fileName,
        line: lineOf(directive.pos),
        kind,
      });
    }
  }

  return references.sort((first, second) => first.line - second.line);
}

/**
 * Whether a specifier is relative and stays inside the output folder.
 * @param {string} specifier The specifier of an import.
 * @param {string} file The absolute path of the file that holds it.
 * @param {string} outputDir The absolute path of the output folder.
 * @returns {boolean} True when it is a relative path to a place inside the folder.
 */
function isInside(specifier, file, outputDir) {
  if (!specifier.startsWith("./") && !specifier.startsWith("../")) {
    return false;
  }

  const relative = path.relative(
    outputDir,
    path.resolve(path.dirname(file), specifier)
  );

  return (
    relative !== ".." &&
    !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative)
  );
}

/**
 * Checks the imports of one file.
 * @param {string} file The absolute path of the file.
 * @param {string} outputDir The absolute path of the output folder.
 * @param {string[]} allowed The allowed specifiers.
 * @returns {Problem[]} The problems of the file.
 */
function checkFile(file, outputDir, allowed) {
  return collectReferences(file, fs.readFileSync(file, "utf8")).flatMap(
    ({ specifier, line, kind }) => {
      if (specifier === undefined) {
        return [
          {
            file,
            line,
            message: `${kind} of a specifier that is not a string literal, which cannot be checked`,
          },
        ];
      }

      // The path of a `/// <reference path>` is relative to the file with or without `./`, and it is never a package
      const isPath = kind === "reference path";
      const target =
        isPath && !path.isAbsolute(specifier) ? `./${specifier}` : specifier;

      if (
        isInside(target, file, outputDir) ||
        (!isPath && allowed.includes(specifier))
      ) {
        return [];
      }

      return [
        {
          file,
          line,
          message: `${kind} of "${specifier}", which is neither a file of the output folder nor an allowed specifier`,
        },
      ];
    }
  );
}

/**
 * Checks every file of an output folder.
 * @param {string} outputDir The absolute path of the output folder.
 * @param {string[]} allowed The allowed specifiers.
 * @returns {{ files: string[], problems: Problem[] }} The files checked and the problems found.
 */
function checkFolder(outputDir, allowed) {
  const files = listFiles(outputDir);

  return {
    files,
    problems: files.flatMap((file) => checkFile(file, outputDir, allowed)),
  };
}

/**
 * Runs the check and reports it.
 * @param {string[]} args The arguments after the script.
 * @returns {number} The exit code.
 */
function main(args) {
  let options;

  try {
    options = parseArguments(args);
  } catch (error) {
    console.error(`${error.message}\n${USAGE}`);
    return 2;
  }

  const { outputDir, allowed } = options;
  const display = (/** @type {string} */ file) =>
    path.relative(process.cwd(), file) || ".";
  let result;

  try {
    result = checkFolder(outputDir, allowed);
  } catch (error) {
    console.error(`${display(outputDir)}: cannot be read: ${error.message}`);
    return 1;
  }

  const { files, problems } = result;

  if (files.length === 0) {
    console.error(`${display(outputDir)}: holds no file to check`);
    return 1;
  }

  for (const { file, line, message } of problems) {
    console.error(`${display(file)}:${line}: ${message}`);
  }

  const importable = ["its own files", ...allowed].join(", ");

  if (problems.length > 0) {
    const noun = problems.length === 1 ? "import" : "imports";

    console.error(
      `${problems.length} forbidden ${noun} in ${display(outputDir)}, which may import only: ${importable}.`
    );
    return 1;
  }

  const checked = files.length === 1 ? "1 file" : `${files.length} files`;

  process.stdout.write(
    `${display(outputDir)}: ${checked} checked, importing only: ${importable}\n`
  );
  return 0;
}

process.exitCode = main(process.argv.slice(2));
