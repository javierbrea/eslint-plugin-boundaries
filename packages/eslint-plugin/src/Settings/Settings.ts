import { isAbsolute, resolve } from "node:path";

import type {
  ElementDescriptors,
  ElementDescriptor,
  FlagAsExternalOptions,
  DependencySelectorNormalized,
  FileDescriptor,
} from "@boundaries/elements";
import {
  isElementDescriptor,
  isFileDescriptor,
  isDependencySelector,
  normalizeDependencySelector,
  isEntitySelector,
  normalizeEntitySelector,
  isFileSelector,
  normalizeFileSelector,
  ELEMENT_DESCRIPTOR_MODES_MAP,
  isDependencyKind,
} from "@boundaries/elements";
import type { Rule } from "eslint";

import { warnOnce } from "../Debug";
import { isArray, isString, isObject, isBoolean, isUndefined } from "../Shared";
import {
  SETTINGS,
  SETTINGS_KEYS_MAP,
  LEGACY_TEMPLATES_DEFAULT,
  ELEMENTS_SINGLE_TYPE_DEFAULT,
  CACHE_DEFAULT,
  LEGACY_WARNINGS_DEFAULT,
  DEPENDENCY_NODE_KEYS_MAP,
} from "../Shared/Settings.types";
import type {
  DependencyNodeKey,
  DependencyNodeSelector,
  SettingsNormalized,
  DebugSettingNormalized,
  SettingsKey,
} from "../Shared/Settings.types";

import {
  migrationToV2GuideLink,
  migrationToV6GuideLink,
  migrationToV7GuideLink,
  moreInfoElementsLink,
  moreInfoLegacySettingsLink,
  moreInfoSettingsLink,
} from "./Docs";

const {
  TYPES,
  ELEMENTS,
  DEPENDENCY_NODES,
  ADDITIONAL_DEPENDENCY_NODES,
  DEFAULT_DEPENDENCY_NODES,
  ENV_ROOT_PATH,
} = SETTINGS;

const trackedValidatedSettings = new WeakMap<
  Rule.RuleContext["settings"],
  SettingsNormalized
>();

/**
 * Type guard to check if a value is a valid key for the plugin settings.
 * @param value - The value to check.
 * @returns True if the value is a valid settings key, false otherwise.
 */
export function isSettingsKey(value: unknown): value is SettingsKey {
  return (
    isString(value) &&
    Object.values(SETTINGS_KEYS_MAP).includes(value as SettingsKey)
  );
}

/**
 * Type guard to check if a value is a valid DependencyNodeKey.
 * @param value The value to check.
 * @returns True if the value is a valid DependencyNodeKey, false otherwise.
 */
export function isDependencyNodeKey(
  value: unknown
): value is DependencyNodeKey {
  return (
    isString(value) &&
    Object.values(DEPENDENCY_NODE_KEYS_MAP).includes(value as DependencyNodeKey)
  );
}

/**
 * Type guard for legacy element descriptors declared as plain strings.
 *
 * @param type - Value to check.
 * @returns `true` when the value is a legacy string descriptor.
 */
export function isLegacyElementDescriptorType(type: unknown): type is string {
  return isString(type);
}

/**
 * Converts legacy string element descriptors into object descriptors.
 *
 * @param typesFromSettings - Raw `boundaries/elements` setting value.
 * @returns Normalized element descriptors compatible with current matcher API.
 */
export function transformLegacyTypes(
  typesFromSettings?: string[] | ElementDescriptors
): ElementDescriptors {
  const types = typesFromSettings || [];
  return types.map((type) => {
    // backward compatibility with v1
    if (isLegacyElementDescriptorType(type)) {
      return {
        type: type,
        match: ELEMENT_DESCRIPTOR_MODES_MAP.FOLDER,
        pattern: `${type}/*`,
        capture: ["elementName"],
      };
    }
    // default options
    return {
      match: ELEMENT_DESCRIPTOR_MODES_MAP.FOLDER,
      ...type,
    };
  });
}

/**
 * Validates one custom dependency-node selector object.
 *
 * @param selector - Candidate additional dependency node selector.
 * @returns `true` when selector has a valid shape.
 */
export function isValidDependencyNodeSelector(
  selector: unknown
): selector is DependencyNodeSelector {
  const isValidObject =
    isObject(selector) &&
    isString(selector.selector) &&
    (!selector.kind || isDependencyKind(selector.kind)) &&
    (!selector.name || isString(selector.name));

  if (!isValidObject) {
    warnOnce(
      `Please provide a valid object in ${ADDITIONAL_DEPENDENCY_NODES} setting.`,
      `The object should be composed of the following properties: { selector: "<esquery selector>", kind: "value" | "type", name: "<string>" (optional) }. The invalid object will be ignored. ${moreInfoSettingsLink()}`
    );
  } else if (isObject(selector) && !selector.name) {
    warnOnce(
      `Consider adding a "name" property to your custom dependency node for using it in selectors and custom messages.`,
      moreInfoSettingsLink()
    );
  }
  return isValidObject;
}

/**
 * Emits deprecation warning for legacy `types` setting.
 *
 * @param types - Legacy types setting value when present.
 * @param legacyWarnings - When `false`, skips detection and warning entirely.
 * @returns `true` when a legacy pattern was present.
 */
export function deprecateTypes(
  types: unknown,
  legacyWarnings: boolean
): boolean {
  if (!legacyWarnings) return false;
  if (!types) return false;
  warnOnce(
    `'${TYPES}' setting is deprecated.`,
    `Please use '${ELEMENTS}' instead. ${migrationToV2GuideLink()}`
  );
  return true;
}

/**
 * Emits deprecation warning for legacy `alias` setting.
 *
 * @param alias - Legacy alias setting value when present.
 * @param legacyWarnings - When `false`, skips detection and warning entirely.
 * @returns `true` when a legacy pattern was present.
 */
export function deprecateAlias(
  alias: unknown,
  legacyWarnings: boolean
): boolean {
  if (!legacyWarnings) return false;
  // cspell:ignore boundariesalias -- documentation anchor for the boundaries/alias setting
  if (!alias) return false;
  warnOnce(
    `'${SETTINGS_KEYS_MAP.ALIAS}' setting is deprecated.`,
    `Configure path aliases using 'import/resolver' settings instead. ${moreInfoLegacySettingsLink("boundariesalias")}`
  );
  return true;
}

/**
 * Validates debug filter selectors for files or dependencies.
 *
 * @param value - Raw filter value.
 * @param filterName - Filter key used in warning messages.
 * @returns Filter array when valid, otherwise `undefined`.
 */
export function validateDebugFilterSelectors(
  value: unknown,
  filterName: "files" | "dependencies"
) {
  if (isUndefined(value)) {
    return undefined;
  }
  if (filterName === "files" && isEntitySelector(value)) {
    return normalizeEntitySelector(value);
  }
  if (isFileSelector(value)) {
    return normalizeFileSelector(value);
  }
  warnOnce(
    `Please provide a valid array for '${filterName}' in '${SETTINGS_KEYS_MAP.DEBUG}' setting.`,
    moreInfoSettingsLink()
  );
  return undefined;
}

/**
 * Validates debug `files` filter selector list.
 *
 * @param value - Raw `debug.filter.files` setting value.
 * @returns Valid files filter selectors.
 */
export function validateDebugFilesFilter(value: unknown) {
  return validateDebugFilterSelectors(value, "files");
}

/**
 * Validates debug `dependencies` filter selector list.
 *
 * @param value - Raw `debug.filter.dependencies` setting value.
 * @returns Valid dependency filter selectors.
 */
export function validateDebugDependenciesFilter(
  value: unknown
): DependencySelectorNormalized | undefined {
  if (isDependencySelector(value)) {
    return normalizeDependencySelector(value);
  }
}

/**
 * Validates and normalizes `debug.enabled` when provided.
 *
 * @param enabled - Raw `debug.enabled` value.
 * @returns Normalized boolean value or `undefined` when not provided/invalid.
 */
function getNormalizedDebugEnabled(enabled: unknown): boolean | undefined {
  if (isUndefined(enabled)) {
    return undefined;
  }

  if (isBoolean(enabled)) {
    return enabled;
  }

  warnOnce(
    `Please provide a valid boolean for 'enabled' in '${SETTINGS_KEYS_MAP.DEBUG}' setting.`,
    moreInfoSettingsLink()
  );

  return undefined;
}

/**
 * Validates and normalizes a `debug.messages.*` boolean flag when provided.
 *
 * @param messages - Raw `debug.messages` object.
 * @param key - Message flag key to validate.
 * @returns Normalized boolean flag or `undefined` when not provided/invalid.
 */
function getNormalizedDebugMessageFlag(
  messages: Record<string, unknown>,
  key: keyof DebugSettingNormalized["messages"]
): boolean | undefined {
  const value = messages[key];

  if (isUndefined(value)) {
    return undefined;
  }

  if (isBoolean(value)) {
    return value;
  }

  warnOnce(
    `Please provide a valid boolean for 'messages.${key}' in '${SETTINGS_KEYS_MAP.DEBUG}' setting.`,
    moreInfoSettingsLink()
  );

  return undefined;
}

/**
 * Validates and normalizes `debug.messages` object and known flags.
 *
 * @param messages - Raw `debug.messages` value.
 * @returns Normalized debug messages configuration.
 */
function getNormalizedDebugMessages(
  messages: unknown
): DebugSettingNormalized["messages"] {
  const defaults: DebugSettingNormalized["messages"] = {
    files: true,
    dependencies: true,
    violations: true,
  };

  if (isUndefined(messages)) {
    return defaults;
  }

  if (!isObject(messages)) {
    warnOnce(
      `Please provide a valid object for 'messages' in '${SETTINGS_KEYS_MAP.DEBUG}' setting.`,
      moreInfoSettingsLink()
    );
    return defaults;
  }

  return {
    files: getNormalizedDebugMessageFlag(messages, "files") ?? defaults.files,
    dependencies:
      getNormalizedDebugMessageFlag(messages, "dependencies") ??
      defaults.dependencies,
    violations:
      getNormalizedDebugMessageFlag(messages, "violations") ??
      defaults.violations,
  };
}

/**
 * Validates and normalizes `debug.filter` object and supported selectors.
 *
 * @param filter - Raw `debug.filter` value.
 * @returns Normalized debug filter configuration.
 */
function getNormalizedDebugFilter(
  filter: unknown
): DebugSettingNormalized["filter"] {
  const defaults: DebugSettingNormalized["filter"] = {
    files: undefined,
    dependencies: undefined,
  };

  if (isUndefined(filter)) {
    return defaults;
  }

  if (!isObject(filter)) {
    warnOnce(
      `Please provide a valid object for 'filter' in '${SETTINGS_KEYS_MAP.DEBUG}' setting.`,
      moreInfoSettingsLink()
    );
    return defaults;
  }

  return {
    files: validateDebugFilesFilter(filter.files),
    dependencies: validateDebugDependenciesFilter(filter.dependencies),
  };
}

/**
 * Validates the `debug` setting object and nested filters.
 *
 * @param debug - Raw debug setting value.
 * @returns Normalized debug setting when valid.
 */
function getNormalizedDebug(debug: unknown): DebugSettingNormalized {
  const defaults: DebugSettingNormalized = {
    enabled: false,
    filter: {
      files: undefined,
      dependencies: undefined,
    },
    messages: {
      files: true,
      dependencies: true,
      violations: true,
    },
  };

  if (!debug) {
    return defaults;
  }

  if (!isObject(debug)) {
    warnOnce(
      `Please provide a valid value in '${SETTINGS_KEYS_MAP.DEBUG}' setting.`,
      `The value should be an object. ${moreInfoSettingsLink()}`
    );
    return defaults;
  }

  return {
    enabled: getNormalizedDebugEnabled(debug.enabled) ?? defaults.enabled,
    messages: getNormalizedDebugMessages(debug.messages),
    filter: getNormalizedDebugFilter(debug.filter),
  };
}

/**
 * Normalizes and filters element descriptors, validating and warning on invalid entries.
 *
 * @param elements - Raw element descriptors from settings.
 * @param legacyTypes - Fallback legacy types setting for backward compatibility.
 * @param legacyWarnings - When `false`, skips all legacy deprecation detection and warnings.
 * @returns Filtered array of valid element descriptors and whether a legacy pattern was detected.
 */
function getNormalizedElementDescriptors(
  elements: unknown,
  legacyTypes: unknown,
  legacyWarnings: boolean
): { descriptors: ElementDescriptor[]; legacyDetected: boolean } {
  const typesLegacy = deprecateTypes(legacyTypes, legacyWarnings);
  const rawElements = elements || legacyTypes;

  if (!rawElements || !isArray(rawElements) || !rawElements.length) {
    // Element descriptors are optional on their own: the file layer can be the
    // only configured classification. The "no classification at all" case is
    // warned once in `getSettings`, where both layers are known.
    return { descriptors: [], legacyDetected: typesLegacy };
  }

  const elementDescriptors = transformLegacyTypes(
    rawElements as ElementDescriptors
  );
  const validElementDescriptors =
    elementDescriptors.filter(isElementDescriptor);

  if (validElementDescriptors.length < elementDescriptors.length) {
    const invalidDescriptors = elementDescriptors.filter(
      (desc: ElementDescriptor) => !isElementDescriptor(desc)
    );
    warnOnce(
      `Some element descriptors are invalid and will be ignored.`,
      `Invalid descriptors:\n${JSON.stringify(invalidDescriptors)}.\n${moreInfoSettingsLink()}`
    );
  }

  let legacyDetected = typesLegacy;

  if (legacyWarnings) {
    // cspell:ignore partialmatch -- documentation anchor for the partialMatch option
    if (validElementDescriptors.some((d) => d.mode !== undefined)) {
      warnOnce(
        `The 'mode' option in element descriptors is deprecated and will be removed in a future major version.`,
        `Use 'partialMatch: false' instead of 'mode: "full"'. Remove 'mode: "folder"' (it is the default). ${migrationToV7GuideLink()}`
      );
      legacyDetected = true;
    }

    if (
      validElementDescriptors.some(
        (d) => (d as unknown as Record<string, unknown>).category !== undefined
      )
    ) {
      warnOnce(
        `The 'category' option in element descriptors is deprecated and will be removed in a future major version.`,
        `Use the 'category' property in file descriptors ('${SETTINGS_KEYS_MAP.FILES}') instead. ${migrationToV7GuideLink("deprecated-category-in-element-descriptors-and-selectors")}`
      );
      legacyDetected = true;
    }
  }

  const conflictingDescriptors = validElementDescriptors.filter(
    (d) => d.partialMatch === false && d.mode !== undefined
  );
  if (conflictingDescriptors.length > 0) {
    warnOnce(
      `The 'mode' option has no effect when 'partialMatch: false' is set.`,
      `Remove 'mode' from these element descriptors: ${JSON.stringify(
        conflictingDescriptors.map((d) => d.pattern)
      )}. ${moreInfoElementsLink("partialmatch-optional")}`
    );
  }

  const FILE_EXTENSION_RE = /\.[a-zA-Z0-9]+/;
  const fileLikeDescriptors = validElementDescriptors.filter((d) => {
    const isEffectiveFolderMode =
      d.partialMatch === false ||
      !d.mode ||
      d.mode === ELEMENT_DESCRIPTOR_MODES_MAP.FOLDER;
    if (!isEffectiveFolderMode) return false;
    const patterns = Array.isArray(d.pattern) ? d.pattern : [d.pattern];
    return patterns.some((p) => FILE_EXTENSION_RE.test(p.split("/").pop()!));
  });
  if (fileLikeDescriptors.length > 0) {
    warnOnce(
      `Some element descriptors appear to use file patterns.`,
      `Element patterns match folders, not individual files. For file classification, use file descriptors ('boundaries/files'). Affected patterns: ${JSON.stringify(
        fileLikeDescriptors.map((d) => d.pattern)
      )}. ${moreInfoElementsLink("partialmatch-optional")}`
    );
  }

  return { descriptors: validElementDescriptors, legacyDetected };
}

/**
 * Normalizes and filters file descriptors, validating and warning on invalid entries.
 *
 * @param fileDescriptors - Raw file descriptors from settings.
 * @returns Filtered array of valid file descriptors.
 */
function getNormalizedFileDescriptors(
  fileDescriptors: unknown
): FileDescriptor[] {
  if (!fileDescriptors || !isArray(fileDescriptors)) {
    return [];
  }

  const validFileDescriptors = fileDescriptors.filter(
    (desc: unknown): desc is FileDescriptor => isFileDescriptor(desc)
  );

  if (validFileDescriptors.length < fileDescriptors.length) {
    const invalidFileDescriptors = fileDescriptors.filter(
      (desc: unknown) => !isFileDescriptor(desc)
    );
    warnOnce(
      `Some file descriptors are invalid and will be ignored.`,
      `Invalid descriptors:\n${JSON.stringify(invalidFileDescriptors)}.\n${moreInfoSettingsLink()}`
    );
  }

  return validFileDescriptors;
}

/**
 * Normalizes and filters dependency node keys, validating and warning on invalid entries.
 *
 * @param dependencyNodes - Raw dependency node keys from settings.
 * @returns Expanded array of dependency node selectors with defaults.
 */
function getNormalizedDependencyNodes(
  dependencyNodes: unknown
): DependencyNodeSelector[] {
  if (!dependencyNodes) {
    const defaultKeys = [
      DEPENDENCY_NODE_KEYS_MAP.IMPORT,
      DEPENDENCY_NODE_KEYS_MAP.EXPORT,
      DEPENDENCY_NODE_KEYS_MAP.REQUIRE,
      DEPENDENCY_NODE_KEYS_MAP.DYNAMIC_IMPORT,
    ];
    return defaultKeys
      .flatMap((key) => [...DEFAULT_DEPENDENCY_NODES[key]])
      .filter(Boolean);
  }

  if (!isArray(dependencyNodes)) {
    const defaultNodesNames = Object.keys(DEFAULT_DEPENDENCY_NODES);
    warnOnce(
      `Invalid ${DEPENDENCY_NODES} setting format.`,
      `It should be an array of the following strings: "${defaultNodesNames.join('", "')}". ${moreInfoSettingsLink()}`
    );
    return [];
  }

  const validKeys = dependencyNodes.filter(isDependencyNodeKey);

  if (validKeys.length < dependencyNodes.length) {
    const invalidKeys = dependencyNodes.filter(
      (key) => !isDependencyNodeKey(key)
    );
    const defaultNodesNames = Object.keys(DEFAULT_DEPENDENCY_NODES);
    warnOnce(
      `Invalid values in ${DEPENDENCY_NODES} setting.`,
      `Invalid values: ${JSON.stringify(invalidKeys)}. Valid strings are: "${defaultNodesNames.join('", "')}". ${moreInfoSettingsLink()}`
    );
  }

  return validKeys
    .flatMap((key: DependencyNodeKey) => [...DEFAULT_DEPENDENCY_NODES[key]])
    .filter(Boolean);
}

/**
 * Normalizes additional dependency node selectors, validating and warning on invalid entries.
 *
 * @param additionalNodes - Raw additional dependency node selectors from settings.
 * @returns Array of valid additional dependency node selectors or empty array.
 */
function getNormalizedAdditionalDependencyNodes(
  additionalNodes: unknown
): DependencyNodeSelector[] {
  if (!additionalNodes) {
    return [];
  }

  if (!isArray(additionalNodes)) {
    warnOnce(
      `Invalid ${ADDITIONAL_DEPENDENCY_NODES} setting format.`,
      `It should be an array containing objects with properties: { selector: "<esquery selector>", kind: "value" | "type", name: "<string>" (optional) }. ${moreInfoSettingsLink()}`
    );
    return [];
  }

  const validNodes = additionalNodes.filter(isValidDependencyNodeSelector);

  if (validNodes.length < additionalNodes.length) {
    const invalidNodes = additionalNodes.filter(
      (node) => !isValidDependencyNodeSelector(node)
    );
    warnOnce(
      `Invalid ${ADDITIONAL_DEPENDENCY_NODES} setting.`,
      `Invalid nodes: ${JSON.stringify(invalidNodes)}. ${moreInfoSettingsLink()}`
    );
  }

  return validNodes;
}

/**
 * Normalizes ignore setting, converting to array format and validating.
 *
 * @param ignore - Raw ignore setting value.
 * @returns Array of ignore paths or undefined.
 */
function getNormalizedIgnorePaths(ignore: unknown): string[] | undefined {
  if (!ignore) {
    return undefined;
  }

  if (isString(ignore)) {
    return [ignore];
  }

  if (isArray(ignore) && ignore.every(isString)) {
    return ignore;
  }

  warnOnce(
    `Please provide a valid value in '${SETTINGS_KEYS_MAP.IGNORE}' setting.`,
    `The value should be a string or an array of strings. ${moreInfoSettingsLink()}`
  );
  return undefined;
}

/**
 * Normalizes include setting, converting to array format and validating.
 *
 * @param include - Raw include setting value.
 * @returns Array of include paths or undefined.
 */
function getNormalizedIncludePaths(include: unknown): string[] | undefined {
  if (!include) {
    return undefined;
  }

  if (isString(include)) {
    return [include];
  }

  if (isArray(include) && include.every(isString)) {
    return include;
  }

  warnOnce(
    `Please provide a valid value in '${SETTINGS_KEYS_MAP.INCLUDE}' setting.`,
    `The value should be a string or an array of strings. ${moreInfoSettingsLink()}`
  );
  return undefined;
}

/**
 * Normalizes root-path setting and resolves effective root path with environment variable support.
 *
 * @param rootPath - Raw root-path setting value.
 * @returns Resolved absolute root path.
 */
function getNormalizedRootPath(rootPath: unknown): string {
  const userSetting = rootPath && isString(rootPath) ? rootPath : undefined;
  const envRootPath = process.env[ENV_ROOT_PATH];
  const effectiveRootPath = envRootPath || userSetting;

  if (!effectiveRootPath) {
    return process.cwd();
  }

  if (isAbsolute(effectiveRootPath)) {
    return effectiveRootPath;
  }

  if (!userSetting) {
    warnOnce(
      `Please provide a valid value in '${SETTINGS_KEYS_MAP.ROOT_PATH}' setting.`,
      `The value should be a string. ${moreInfoSettingsLink()}`
    );
    return process.cwd();
  }

  return resolve(process.cwd(), effectiveRootPath);
}

/**
 * Normalizes legacy templates setting, validating and applying defaults.
 *
 * @param legacyTemplates - Raw legacy templates setting value.
 * @param legacyWarnings - When `false`, skips the deprecation warning.
 * @returns Normalized value and whether a legacy pattern was detected.
 */
function getNormalizedLegacyTemplates(
  legacyTemplates: unknown,
  legacyWarnings: boolean
): { value: boolean; legacyDetected: boolean } {
  if (isUndefined(legacyTemplates)) {
    return { value: LEGACY_TEMPLATES_DEFAULT, legacyDetected: false };
  }

  if (isBoolean(legacyTemplates)) {
    const legacyDetected = legacyTemplates === true;
    if (legacyDetected && legacyWarnings) {
      warnOnce(
        `'${SETTINGS_KEYS_MAP.LEGACY_TEMPLATES}' setting is deprecated.`,
        `The legacy \${...} template syntax will not be supported in the next major version. Migrate to the {{...}} Handlebars syntax. ${migrationToV6GuideLink("new-template-syntax")}`
      );
    }
    return { value: legacyTemplates, legacyDetected };
  }

  warnOnce(
    `Please provide a valid value in '${SETTINGS_KEYS_MAP.LEGACY_TEMPLATES}' setting.`,
    `The value should be a boolean. ${moreInfoSettingsLink()}`
  );
  return { value: LEGACY_TEMPLATES_DEFAULT, legacyDetected: false };
}

/**
 * Normalizes elements-single-type setting, validating and applying defaults.
 *
 * @param elementsSingleType - Raw elements-single-type setting value.
 * @returns Boolean value or default.
 */
function getNormalizedElementsSingleType(elementsSingleType: unknown): boolean {
  if (isUndefined(elementsSingleType)) {
    return ELEMENTS_SINGLE_TYPE_DEFAULT;
  }

  if (isBoolean(elementsSingleType)) {
    return elementsSingleType;
  }

  warnOnce(
    `Please provide a valid value in '${SETTINGS_KEYS_MAP.ELEMENTS_SINGLE_TYPE}' setting.`,
    `The value should be a boolean. ${moreInfoSettingsLink()}`
  );
  return ELEMENTS_SINGLE_TYPE_DEFAULT;
}

/**
 * Normalizes legacy-warnings setting, validating and applying defaults.
 *
 * @param value - Raw legacy-warnings setting value.
 * @returns Boolean value or default (`true`).
 */
function getNormalizedLegacyWarnings(value: unknown): boolean {
  if (isUndefined(value)) {
    return LEGACY_WARNINGS_DEFAULT;
  }

  if (isBoolean(value)) {
    return value;
  }

  warnOnce(
    `Please provide a valid value in '${SETTINGS_KEYS_MAP.LEGACY_WARNINGS}' setting.`,
    `The value should be a boolean. ${moreInfoSettingsLink()}`
  );
  return LEGACY_WARNINGS_DEFAULT;
}

/**
 * Normalizes cache setting, validating and applying defaults.
 *
 * @param cache - Raw cache setting value.
 * @returns Boolean value or default.
 */
function getNormalizedCache(cache: unknown): boolean {
  if (isUndefined(cache)) {
    return CACHE_DEFAULT;
  }

  if (isBoolean(cache)) {
    return cache;
  }

  warnOnce(
    `Please provide a valid value in '${SETTINGS_KEYS_MAP.CACHE}' setting.`,
    `The value should be a boolean. ${moreInfoSettingsLink()}`
  );
  return CACHE_DEFAULT;
}

/**
 * Normalizes flag-as-external option, validating and applying defaults.
 *
 * @param flagAsExternal - Raw flag-as-external setting value.
 * @returns Normalized flag-as-external object with defaults.
 */
const BOOLEAN_FLAG_AS_EXTERNAL_OPTION_KEYS = [
  "unresolvableAlias",
  "inNodeModules",
  "outsideRootPath",
] as const;

/**
 * Validates a boolean flag-as-external option, warning and leaving the default
 * untouched when the provided value is not a valid boolean.
 * @param options - Raw flag-as-external options provided by the user.
 * @param validated - Normalized flag-as-external object to update in place.
 * @param key - Name of the boolean option to validate.
 */
function validateBooleanFlagAsExternalOption(
  options: Record<string, unknown>,
  validated: Required<FlagAsExternalOptions>,
  key: (typeof BOOLEAN_FLAG_AS_EXTERNAL_OPTION_KEYS)[number]
): void {
  if (isUndefined(options[key])) {
    return;
  }

  if (isBoolean(options[key])) {
    validated[key] = options[key];
  } else {
    warnOnce(
      `Please provide a valid boolean for '${key}' in '${SETTINGS_KEYS_MAP.FLAG_AS_EXTERNAL}' setting.`,
      moreInfoSettingsLink()
    );
  }
}

function getNormalizedFlagAsExternal(
  flagAsExternal: unknown
): Required<FlagAsExternalOptions> {
  const defaults: Required<FlagAsExternalOptions> = {
    unresolvableAlias: true,
    inNodeModules: true,
    outsideRootPath: false,
    customSourcePatterns: [],
  };

  if (!flagAsExternal) {
    return defaults;
  }

  if (!isObject(flagAsExternal)) {
    warnOnce(
      `Please provide a valid value in '${SETTINGS_KEYS_MAP.FLAG_AS_EXTERNAL}' setting.`,
      `The value should be an object. ${moreInfoSettingsLink()}`
    );
    return defaults;
  }

  const validated: Required<FlagAsExternalOptions> = { ...defaults };
  const options = flagAsExternal as Record<string, unknown>;

  for (const key of BOOLEAN_FLAG_AS_EXTERNAL_OPTION_KEYS) {
    validateBooleanFlagAsExternalOption(options, validated, key);
  }

  if (!isUndefined(options.customSourcePatterns)) {
    if (
      isArray(options.customSourcePatterns) &&
      options.customSourcePatterns.every(isString)
    ) {
      validated.customSourcePatterns = options.customSourcePatterns;
    } else {
      warnOnce(
        `Please provide a valid array of strings for 'customSourcePatterns' in '${SETTINGS_KEYS_MAP.FLAG_AS_EXTERNAL}' setting.`,
        moreInfoSettingsLink()
      );
    }
  }

  return validated;
}

/**
 * Returns normalized and cached settings from ESLint rule context.
 *
 * @param context - ESLint rule context.
 * @returns Normalized settings object used by rules.
 */
export function getSettings(context: Rule.RuleContext): SettingsNormalized {
  const alreadyValidatedSettings = trackedValidatedSettings.get(
    context.settings
  );
  if (alreadyValidatedSettings) {
    return alreadyValidatedSettings;
  }

  const settings = context.settings;

  // Must be resolved first so it can be passed to all legacy-detecting helpers.
  const legacyWarnings = getNormalizedLegacyWarnings(
    settings[SETTINGS_KEYS_MAP.LEGACY_WARNINGS]
  );

  deprecateAlias(settings[SETTINGS_KEYS_MAP.ALIAS], legacyWarnings);

  // Normalize all settings from raw values
  const { descriptors: elementDescriptors } = getNormalizedElementDescriptors(
    settings[ELEMENTS],
    settings[TYPES],
    legacyWarnings
  );

  const fileDescriptors = getNormalizedFileDescriptors(
    settings[SETTINGS_KEYS_MAP.FILES]
  );

  // At least one classification layer is required. Elements and files are each
  // optional on their own, so only warn when neither layer is configured.
  if (!elementDescriptors.length && !fileDescriptors.length) {
    warnOnce(
      `Please provide element descriptors using the '${ELEMENTS}' setting, or file descriptors using the '${SETTINGS_KEYS_MAP.FILES}' setting.`,
      moreInfoSettingsLink()
    );
  }

  const dependencyNodes = getNormalizedDependencyNodes(
    settings[DEPENDENCY_NODES]
  );

  const additionalDependencyNodes = getNormalizedAdditionalDependencyNodes(
    settings[SETTINGS_KEYS_MAP.ADDITIONAL_DEPENDENCY_NODES]
  );

  const ignorePaths = getNormalizedIgnorePaths(
    settings[SETTINGS_KEYS_MAP.IGNORE]
  );

  const includePaths = getNormalizedIncludePaths(
    settings[SETTINGS_KEYS_MAP.INCLUDE]
  );

  const { value: legacyTemplates } = getNormalizedLegacyTemplates(
    settings[SETTINGS_KEYS_MAP.LEGACY_TEMPLATES],
    legacyWarnings
  );

  const elementsSingleType = getNormalizedElementsSingleType(
    settings[SETTINGS_KEYS_MAP.ELEMENTS_SINGLE_TYPE]
  );

  const cache = getNormalizedCache(settings[SETTINGS_KEYS_MAP.CACHE]);

  const flagAsExternal = getNormalizedFlagAsExternal(
    settings[SETTINGS_KEYS_MAP.FLAG_AS_EXTERNAL]
  );

  const debugSetting = getNormalizedDebug(settings[SETTINGS_KEYS_MAP.DEBUG]);

  const rootPath = getNormalizedRootPath(settings[SETTINGS_KEYS_MAP.ROOT_PATH]);

  const result: SettingsNormalized = {
    elementDescriptors,
    elementsSingleType,
    fileDescriptors,
    ignorePaths,
    includePaths,
    rootPath,
    dependencyNodes: [...dependencyNodes, ...additionalDependencyNodes],
    legacyTemplates,
    cache,
    legacyWarnings,
    flagAsExternal,
    debug: debugSetting,
  };

  trackedValidatedSettings.set(context.settings, result);
  return result;
}
