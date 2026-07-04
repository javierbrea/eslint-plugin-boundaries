import path from "node:path";

import ts from "typescript";

// eslint-disable-next-line import/no-namespace -- needs the full namespace object to snapshot the public API surface
import * as publicApi from "./index";

/**
 * `Object.keys` only sees runtime bindings, so `export type` declarations (interfaces,
 * type aliases) are invisible to it. This resolves the full export list of the public
 * entry point (values + types, following `export *` chains) via the TypeScript checker,
 * then subtracts the already-known runtime exports to isolate the type-only ones.
 */
function getPublicTypeOnlyExportNames(): string[] {
  const entryFile = path.join(__dirname, "index.ts");
  const configPath = path.join(__dirname, "..", "tsconfig.json");
  const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
  const parsedConfig = ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    path.dirname(configPath)
  );

  const program = ts.createProgram({
    rootNames: [entryFile],
    options: { ...parsedConfig.options, noEmit: true },
  });
  const checker = program.getTypeChecker();
  const sourceFile = program.getSourceFile(entryFile);
  const moduleSymbol = sourceFile && checker.getSymbolAtLocation(sourceFile);
  if (!moduleSymbol) {
    throw new Error("Could not resolve the public entry point module symbol");
  }

  const valueExportNames = new Set(Object.keys(publicApi));

  return checker
    .getExportsOfModule(moduleSymbol)
    .map((symbol) => symbol.getName())
    .filter((name) => !valueExportNames.has(name))
    .sort();
}

describe("public API", () => {
  it("exposes the expected set of runtime exports", () => {
    expect(Object.keys(publicApi).sort()).toMatchSnapshot();
  });

  it("exposes the expected set of type-only exports", () => {
    expect(getPublicTypeOnlyExportNames()).toMatchSnapshot();
  });
});
