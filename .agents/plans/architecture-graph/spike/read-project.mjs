// Spike: reads a real project (config through the ESLint API, imports through TypeScript) and evaluates it with the @boundaries packages.
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const projectDir = path.resolve(process.argv[2]);
const outFile = process.argv[3];
const requireFromProject = createRequire(path.join(projectDir, "package.json"));
const { normalizeConfig, DEPENDENCY_NODE_KEYS_MAP: K } =
  requireFromProject("@boundaries/config");
const { describeEntity, describeDependency, evaluateDependency } =
  requireFromProject("@boundaries/policies");
const { ESLint } = requireFromProject("eslint");
const ts = requireFromProject("typescript");

const t0 = performance.now();
const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    if (e.isDirectory()) return walk(path.join(dir, e.name));
    return /\.(ts|tsx)$/.test(e.name) ? [path.join(dir, e.name)] : [];
  });
const absFiles = walk(path.join(projectDir, "src"));
const rel = (abs) => path.relative(projectDir, abs).split(path.sep).join("/");

// 1. Config: ESLint finds, loads and resolves it per file
const eslint = new ESLint({ cwd: projectDir });
const configs = new Map();
const fileConfig = new Map();
for (const file of absFiles) {
  const c = await eslint.calculateConfigForFile(file);
  if (!c) {
    fileConfig.set(file, null);
    continue;
  }
  const boundaries = {
    settings: Object.fromEntries(
      Object.entries(c.settings ?? {}).filter(([k]) =>
        k.startsWith("boundaries/")
      )
    ),
    rules: Object.fromEntries(
      Object.entries(c.rules ?? {}).filter(([k]) => k.startsWith("boundaries/"))
    ),
  };
  const key = JSON.stringify(boundaries);
  if (!configs.has(key)) configs.set(key, { boundaries, files: 0 });
  configs.get(key).files++;
  fileConfig.set(file, key);
}
const t1 = performance.now();
console.error(
  `files: ${absFiles.length}; distinct boundaries configs: ${configs.size} (${[...configs.values()].map((c) => c.files).join(", ")} files); not linted: ${[...fileConfig.values()].filter((v) => v === null).length}`
);
const main = [...configs.values()].sort((a, b) => b.files - a.files)[0]
  .boundaries;
console.error(
  "rules:",
  Object.entries(main.rules)
    .map(([k, v]) => `${k}=${Array.isArray(v) ? v[0] : v}`)
    .join(" ")
);

// 2. Dependencies: TypeScript reads and resolves the imports
const tsconfigPath = ts.findConfigFile(
  projectDir,
  ts.sys.fileExists,
  "tsconfig.json"
);
const parsedTs = ts.parseJsonConfigFileContent(
  ts.readConfigFile(tsconfigPath, ts.sys.readFile).config,
  ts.sys,
  path.dirname(tsconfigPath)
);
const rawDeps = [];
for (const file of absFiles) {
  const sf = ts.createSourceFile(
    file,
    fs.readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true
  );
  const add = (source, kind, nodeKind, specifiers) => {
    const r = ts.resolveModuleName(
      source,
      file,
      parsedTs.options,
      ts.sys
    ).resolvedModule;
    const inside =
      r &&
      !r.isExternalLibraryImport &&
      !path.relative(projectDir, r.resolvedFileName).startsWith("..");
    rawDeps.push({
      from: rel(file),
      to: inside ? rel(r.resolvedFileName) : undefined,
      source,
      kind,
      nodeKind,
      specifiers,
    });
  };
  const visitCall = (node) => {
    if (
      !ts.isCallExpression(node) ||
      node.arguments.length !== 1 ||
      !ts.isStringLiteral(node.arguments[0])
    ) {
      return;
    }
    if (node.expression.kind === ts.SyntaxKind.ImportKeyword) {
      add(node.arguments[0].text, "value", K.DYNAMIC_IMPORT, []);
    } else if (
      ts.isIdentifier(node.expression) &&
      node.expression.text === "require"
    ) {
      add(node.arguments[0].text, "value", K.REQUIRE, []);
    }
  };
  const visit = (node) => {
    if (
      ts.isImportDeclaration(node) &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      const clause = node.importClause;
      const named =
        clause?.namedBindings && ts.isNamedImports(clause.namedBindings)
          ? clause.namedBindings.elements
          : [];
      add(
        node.moduleSpecifier.text,
        clause?.isTypeOnly ? "type" : "value",
        K.IMPORT,
        named.map((e) => (e.propertyName ?? e.name).text)
      );
    } else if (
      ts.isExportDeclaration(node) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      const named =
        node.exportClause && ts.isNamedExports(node.exportClause)
          ? node.exportClause.elements
          : [];
      add(
        node.moduleSpecifier.text,
        node.isTypeOnly ? "type" : "value",
        K.EXPORT,
        named.map((e) => e.name.text)
      );
    } else {
      visitCall(node);
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
}
const t2 = performance.now();

// 3. Evaluate
const normalized = normalizeConfig(main, { rootPath: "" });
console.error(
  "diagnostics:",
  normalized.diagnostics.length,
  normalized.diagnostics.slice(0, 3).map((d) => d.title ?? d.message)
);
const { settings, rules } = normalized.value;
const entry = rules.dependencies ?? rules["element-types"];
const files = absFiles
  .map(rel)
  .map((p) => ({ path: p, d: describeEntity(settings, p) }));
const t3 = performance.now();
const deps = rawDeps.map((dep) => {
  const d = describeDependency(settings, dep);
  let e;
  try {
    e = evaluateDependency(settings, entry.options, d);
  } catch (error) {
    e = { error: error.message };
  }
  return { dep, d, e };
});
const t4 = performance.now();
console.error(
  `timings ms: config ${Math.round(t1 - t0)}, imports ${Math.round(t2 - t1)}, describe files ${Math.round(t3 - t2)}, describe+evaluate ${deps.length} deps ${Math.round(t4 - t3)}`
);
if (process.env.PEEK) {
  console.error(JSON.stringify(files[40], null, 1));
  console.error(
    JSON.stringify(
      deps.find((x) => x.dep.to),
      null,
      1
    ).slice(0, 3500)
  );
  console.error(
    JSON.stringify(deps.find((x) => !x.dep.to).e),
    JSON.stringify(deps.find((x) => !x.dep.to).d.to)
  );
  console.error(
    JSON.stringify(entry.options.policies.slice(0, 2)),
    entry.options.policies.length,
    entry.options.default
  );
}
fs.writeFileSync(
  outFile,
  JSON.stringify({
    projectDir: rel(projectDir) || path.basename(projectDir),
    policies: entry.options.policies,
    default: entry.options.default,
    files,
    deps,
  })
);
