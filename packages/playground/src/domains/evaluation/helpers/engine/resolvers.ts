import {
  DEFAULT_RESOLVERS,
  DEFAULT_RESOLVER_EXTENSIONS,
  SOURCE_RESOLVER_NAMES,
} from "@/domains/project/helpers/sketch";
import type {
  SourceResolver,
  SourceResolverName,
} from "@/domains/project/helpers/sketch";

import {
  IMPORT_RESOLVER_KEY,
  IMPORT_RESOLVE_KEY,
  SETTINGS_KEY,
} from "./engine.constants";
import type { ConfigProblem } from "./engine.types";
import { getRangeOf } from "./locations";
import type { ConfigRead } from "./parseConfig.types";
import type { ResolversRead } from "./resolvers.types";
import { asRecord, readSettings } from "./writtenConfig";

/** Where an entry of the setting is written, from the config object */
type EntryPath = readonly (string | number)[];

/** What the setting writes at a place: a resolver with its options, or a value that is not a resolver config */
type Written =
  | {
      readonly kind: "resolver";
      readonly name: string;
      readonly options: unknown;
      readonly path: EntryPath;
    }
  | { readonly kind: "invalid"; readonly path: EntryPath };

/** The start of the name of the package of a resolver, which a name can leave out */
const RESOLVER_PACKAGE_PREFIX = "eslint-import-resolver-";

/** Where the setting is written */
const SETTING_PATH: EntryPath = [SETTINGS_KEY, IMPORT_RESOLVER_KEY];

/** What the playground runs of the resolvers of a config, which the warning about one it does not run says */
const RUNS_ONLY = `The playground finds the files of the sources with the "node" and "typescript" resolvers only, so ESLint can resolve a source to another file.`;

/** Said when no entry of the setting is a resolver that the playground runs */
const NONE_RUN = `None of the resolvers of the setting is one it runs, so it uses "node" with its default extensions.`;

/**
 * Finds which resolver that the playground runs a name stands for, as ESLint finds the package of a resolver: the name of the package, or the name without `eslint-import-resolver-`.
 * @param entryName A name of the setting.
 * @returns The resolver, or `undefined` when the playground does not run it.
 */
function toResolverName(entryName: string): SourceResolverName | undefined {
  const shortName = entryName.startsWith(RESOLVER_PACKAGE_PREFIX)
    ? entryName.slice(RESOLVER_PACKAGE_PREFIX.length)
    : entryName;

  return SOURCE_RESOLVER_NAMES.find((candidate) => candidate === shortName);
}

/**
 * Reads the value of the setting as ESLint does: a string names a resolver, a list lists several of them, each one a string or an object, and an object maps names to options. A `null` is an object without names.
 * @param value What the setting writes at the place.
 * @param path Where it is written.
 * @returns The resolvers it names, with their options, in the order they are written, and the places that are not a resolver config: a number, a boolean.
 */
function collect(value: unknown, path: EntryPath): readonly Written[] {
  if (Array.isArray(value)) {
    return value.flatMap((item: unknown, index) =>
      collect(item, [...path, index])
    );
  }
  if (typeof value === "string") {
    return [{ kind: "resolver", name: value, options: undefined, path }];
  }
  if (typeof value === "object") {
    return Object.entries(value ?? {}).map(
      ([key, options]): Written => ({
        kind: "resolver",
        name: key,
        options,
        path: [...path, key],
      })
    );
  }
  return [{ kind: "invalid", path }];
}

/**
 * Reads the extensions that a resolver tries.
 * @param resolverName The resolver.
 * @param options Its options as written.
 * @returns The `extensions` option when it is a list of strings, and otherwise the default extensions of the resolver.
 */
function readExtensions(
  resolverName: SourceResolverName,
  options: unknown
): readonly string[] {
  const extensions = asRecord(options)?.extensions;

  return Array.isArray(extensions) &&
    extensions.every((extension) => typeof extension === "string")
    ? extensions
    : DEFAULT_RESOLVER_EXTENSIONS[resolverName];
}

/**
 * Builds the warning about an entry of the setting that the playground does not run.
 * @param config The config as written.
 * @param path Where the entry is written.
 * @param title What the playground does not run.
 * @param detail Why it matters.
 * @returns The warning, placed at the entry.
 */
function createProblem(
  config: ConfigRead,
  path: EntryPath,
  title: string,
  detail: string
): ConfigProblem {
  return {
    level: "warning",
    title,
    detail,
    links: [],
    path,
    range: getRangeOf(config.ast, path),
    source: "config",
  };
}

/**
 * Warns about the entries of the setting that the playground does not run.
 * @param config The config as written.
 * @param written What the setting writes.
 * @param noneRun Whether no entry is a resolver that the playground runs, which the warnings say.
 * @returns A warning for each resolver that is not run, and for each value that is not a resolver config, in the order they are written. One about the whole setting when it lists nothing.
 */
function getNotRunProblems(
  config: ConfigRead,
  written: readonly Written[],
  noneRun: boolean
): ConfigProblem[] {
  const closing = noneRun ? ` ${NONE_RUN}` : "";

  if (written.length === 0) {
    return [
      createProblem(
        config,
        SETTING_PATH,
        `The setting "${IMPORT_RESOLVER_KEY}" lists no resolver.`,
        `ESLint finds no file for a source then, and the playground uses "node" with its default extensions.`
      ),
    ];
  }
  return written.flatMap((entry) => {
    if (entry.kind === "invalid") {
      return [
        createProblem(
          config,
          entry.path,
          `The playground does not run a value of "${IMPORT_RESOLVER_KEY}" that is not a resolver.`,
          `A resolver is written as its name, as a list of them, or as an object with a name for each key.${closing}`
        ),
      ];
    }
    return toResolverName(entry.name) === undefined
      ? [
          createProblem(
            config,
            entry.path,
            `The playground does not run the "${entry.name}" resolver.`,
            `${RUNS_ONLY}${closing}`
          ),
        ]
      : [];
  });
}

/**
 * Reads the resolvers that ESLint finds the files of the sources with, from the settings of a config as written. It reads `import/resolver` as `eslint-module-utils` does, or the options of the `node` resolver in `import/resolve` when it is not set, and it runs the `node` and `typescript` resolvers with their `extensions` option, in the order the setting gives them. Every other option is ignored, because the sources of the sketch are relative.
 * @param config The config as written.
 * @returns The resolvers, and a warning for each entry that the playground does not run. When the setting is not written, or when it holds no resolver that the playground runs, the resolver is `node` with its default extensions, as ESLint uses when the setting is not written.
 */
export function readResolvers(config: ConfigRead): ResolversRead {
  const settings = readSettings(config);
  const setting = settings[IMPORT_RESOLVER_KEY];

  if (!setting && settings[IMPORT_RESOLVE_KEY] === undefined) {
    return { resolvers: DEFAULT_RESOLVERS, problems: [] };
  }

  const written: readonly Written[] = setting
    ? collect(setting, SETTING_PATH)
    : [
        {
          kind: "resolver",
          name: "node",
          options: settings[IMPORT_RESOLVE_KEY],
          path: [SETTINGS_KEY, IMPORT_RESOLVE_KEY],
        },
      ];
  // A name written twice keeps its place and the options of the last entry, as in the map that ESLint makes
  const optionsOf = new Map<string, unknown>();

  for (const entry of written) {
    if (entry.kind === "resolver") {
      optionsOf.set(entry.name, entry.options);
    }
  }

  const resolvers = [...optionsOf].flatMap(
    ([entryName, options]): SourceResolver[] => {
      const resolverName = toResolverName(entryName);

      return resolverName === undefined
        ? []
        : [
            {
              name: resolverName,
              extensions: readExtensions(resolverName, options),
            },
          ];
    }
  );

  return {
    resolvers: resolvers.length === 0 ? DEFAULT_RESOLVERS : resolvers,
    problems: getNotRunProblems(config, written, resolvers.length === 0),
  };
}
