import { isAbsolute, resolve } from "path";

import type {
  DependencyKind,
  ElementDescriptors,
  ElementDescriptor,
  FlagAsExternalOptions,
  DependencySelectorNormalized,
  FileSingleSelector,
  FileDescriptor,
} from "@boundaries/elements";
import {
  isElementDescriptor,
  isFileDescriptor,
  isDependencySelector,
  normalizeDependencySelector,
  isFileSelector,
  normalizeFileSelector,
} from "@boundaries/elements";
import type { Rule } from "eslint";

import { warnOnce } from "../Debug";
import { isArray, isString, isObject, isBoolean, isUndefined } from "../Shared";
import {
  SETTINGS,
  SETTINGS_KEYS_MAP,
  LEGACY_TEMPLATES_DEFAULT,
  CACHE_DEFAULT,
  DEPENDENCY_NODE_KEYS_MAP,
} from "../Shared/Settings.types";
import type {
  DependencyNodeKey,
  DependencyNodeSelector,
  SettingsNormalized,
  DebugSettingNormalized,
  SettingsKey,
} from "../Shared/Settings.types";

import { migrationToV2GuideLink, moreInfoSettingsLink } from "./Docs";

const {
  TYPES,
  ELEMENTS,
  DEPENDENCY_NODES,
  ADDITIONAL_DEPENDENCY_NODES,
  VALID_DEPENDENCY_NODE_KINDS,
  DEFAULT_DEPENDENCY_NODES,
  VALID_MODES,
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
        match: VALID_MODES[0],
        pattern: `${type}/*`,
        capture: ["elementName"],
      };
    }
    // default options
    return {
      match: VALID_MODES[0],
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
    (!selector.kind ||
      (isString(selector.kind) &&
        VALID_DEPENDENCY_NODE_KINDS.includes(
          selector.kind as DependencyKind
        ))) &&
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
 */
export function deprecateTypes(types: unknown) {
  if (types) {
    warnOnce(
      `'${TYPES}' setting is deprecated.`,
      `Please use '${ELEMENTS}' instead. ${migrationToV2GuideLink()}`
    );
  }
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
export function validateDebugFilesFilter(
  value: unknown
): FileSingleSelector[] | undefined {
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
 * @returns Filtered array of valid element descriptors.
 */
function getNormalizedElementDescriptors(
  elements: unknown,
  legacyTypes: unknown
): ElementDescriptor[] {
  deprecateTypes(legacyTypes);
  const rawElements = elements || legacyTypes;

  if (!rawElements || !isArray(rawElements) || !rawElements.length) {
    warnOnce(
      `Please provide element descriptors using the '${ELEMENTS}' setting.`,
      moreInfoSettingsLink()
    );
    return [];
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

  return validElementDescriptors;
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
 * @returns Boolean value or default.
 */
function getNormalizedLegacyTemplates(legacyTemplates: unknown): boolean {
  if (isUndefined(legacyTemplates)) {
    return LEGACY_TEMPLATES_DEFAULT;
  }

  if (isBoolean(legacyTemplates)) {
    return legacyTemplates;
  }

  warnOnce(
    `Please provide a valid value in '${SETTINGS_KEYS_MAP.LEGACY_TEMPLATES}' setting.`,
    `The value should be a boolean. ${moreInfoSettingsLink()}`
  );
  return LEGACY_TEMPLATES_DEFAULT;
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

  if (!isUndefined(options.unresolvableAlias)) {
    if (isBoolean(options.unresolvableAlias)) {
      validated.unresolvableAlias = options.unresolvableAlias;
    } else {
      warnOnce(
        `Please provide a valid boolean for 'unresolvableAlias' in '${SETTINGS_KEYS_MAP.FLAG_AS_EXTERNAL}' setting.`,
        moreInfoSettingsLink()
      );
    }
  }

  if (!isUndefined(options.inNodeModules)) {
    if (isBoolean(options.inNodeModules)) {
      validated.inNodeModules = options.inNodeModules;
    } else {
      warnOnce(
        `Please provide a valid boolean for 'inNodeModules' in '${SETTINGS_KEYS_MAP.FLAG_AS_EXTERNAL}' setting.`,
        moreInfoSettingsLink()
      );
    }
  }

  if (!isUndefined(options.outsideRootPath)) {
    if (isBoolean(options.outsideRootPath)) {
      validated.outsideRootPath = options.outsideRootPath;
    } else {
      warnOnce(
        `Please provide a valid boolean for 'outsideRootPath' in '${SETTINGS_KEYS_MAP.FLAG_AS_EXTERNAL}' setting.`,
        moreInfoSettingsLink()
      );
    }
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

  // Normalize all settings from raw values
  const elementDescriptors = getNormalizedElementDescriptors(
    settings[ELEMENTS],
    settings[TYPES]
  );

  const fileDescriptors = getNormalizedFileDescriptors(
    settings[SETTINGS_KEYS_MAP.FILES]
  );

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

  const legacyTemplates = getNormalizedLegacyTemplates(
    settings[SETTINGS_KEYS_MAP.LEGACY_TEMPLATES]
  );

  const cache = getNormalizedCache(settings[SETTINGS_KEYS_MAP.CACHE]);

  const flagAsExternal = getNormalizedFlagAsExternal(
    settings[SETTINGS_KEYS_MAP.FLAG_AS_EXTERNAL]
  );

  const debugSetting = getNormalizedDebug(settings[SETTINGS_KEYS_MAP.DEBUG]);

  const rootPath = getNormalizedRootPath(settings[SETTINGS_KEYS_MAP.ROOT_PATH]);

  const result: SettingsNormalized = {
    elementDescriptors,
    fileDescriptors,
    ignorePaths,
    includePaths,
    rootPath,
    dependencyNodes: [...dependencyNodes, ...additionalDependencyNodes],
    legacyTemplates,
    cache,
    flagAsExternal,
    debug: debugSetting,
  };

  trackedValidatedSettings.set(context.settings, result);
  return result;
}
