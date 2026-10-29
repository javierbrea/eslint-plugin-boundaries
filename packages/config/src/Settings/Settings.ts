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

import { DiagnosticsBuilder } from "../Diagnostics";
import type { ConfigResult, DiagnosticPath } from "../Diagnostics";
import {
  migrationToV2GuideLink,
  migrationToV6GuideLink,
  migrationToV7GuideLink,
  moreInfoElementsLink,
  moreInfoLegacySettingsLink,
  moreInfoSettingsLink,
} from "../Docs";
import {
  isArray,
  isString,
  isObject,
  isBoolean,
  isUndefined,
  SETTINGS,
  SETTINGS_KEYS_MAP,
  LEGACY_TEMPLATES_DEFAULT,
  ELEMENTS_SINGLE_TYPE_DEFAULT,
  FILES_SINGLE_MATCH_DEFAULT,
  CACHE_DEFAULT,
  LEGACY_WARNINGS_DEFAULT,
  DEPENDENCY_NODE_KEYS_MAP,
} from "../Shared";
import type {
  DependencyNodeKey,
  DependencyNodeSelector,
  SettingsNormalized,
  DebugSettingNormalized,
  SettingsKey,
} from "../Shared";

import type { NormalizeSettingsOptions } from "./Settings.types";

const {
  TYPES,
  ELEMENTS,
  DEPENDENCY_NODES,
  ADDITIONAL_DEPENDENCY_NODES,
  DEFAULT_DEPENDENCY_NODES,
} = SETTINGS;

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
 * @param diagnostics - Builder that collects the problems found.
 * @param path - Path of the selector in the settings.
 * @returns `true` when selector has a valid shape.
 */
export function isValidDependencyNodeSelector(
  selector: unknown,
  diagnostics: DiagnosticsBuilder,
  path: DiagnosticPath
): selector is DependencyNodeSelector {
  const isValidObject =
    isObject(selector) &&
    isString(selector.selector) &&
    (!selector.kind || isDependencyKind(selector.kind)) &&
    isString(selector.name) &&
    selector.name.trim().length > 0;

  if (!isValidObject) {
    diagnostics.warning(
      `Please provide a valid object in ${ADDITIONAL_DEPENDENCY_NODES} setting.`,
      `The object should be composed of the following properties: { selector: "<esquery selector>", kind: "value" | "type", name: "<string>" }. The invalid object will be ignored. ${moreInfoSettingsLink()}`,
      [path]
    );
  }
  return isValidObject;
}

/**
 * Reports the deprecation of the legacy `types` setting.
 *
 * @param types - Legacy types setting value when present.
 * @param legacyWarnings - When `false`, skips detection and reporting entirely.
 * @param diagnostics - Builder that collects the problems found.
 */
export function deprecateTypes(
  types: unknown,
  legacyWarnings: boolean,
  diagnostics: DiagnosticsBuilder
): void {
  if (!legacyWarnings) return;
  if (!types) return;
  diagnostics.deprecation(
    `'${TYPES}' setting is deprecated.`,
    `Please use '${ELEMENTS}' instead. ${migrationToV2GuideLink()}`,
    [[TYPES]]
  );
}

/**
 * Reports the legacy `alias` setting, which is deprecated and has no effect.
 *
 * @param alias - Legacy alias setting value when present.
 * @param legacyWarnings - When `false`, skips detection and reporting entirely.
 * @param diagnostics - Builder that collects the problems found.
 */
export function deprecateAlias(
  alias: unknown,
  legacyWarnings: boolean,
  diagnostics: DiagnosticsBuilder
): void {
  if (!legacyWarnings) return;
  // cspell:ignore boundariesalias -- documentation anchor for the boundaries/alias setting
  if (!alias) return;
  diagnostics.warning(
    `'${SETTINGS_KEYS_MAP.ALIAS}' setting is deprecated.`,
    `Configure path aliases using 'import/resolver' settings instead. ${moreInfoLegacySettingsLink("boundariesalias")}`,
    [[SETTINGS_KEYS_MAP.ALIAS]]
  );
}

/**
 * Validates debug filter selectors for files or dependencies.
 *
 * @param value - Raw filter value.
 * @param filterName - Filter key used in warning messages.
 * @param diagnostics - Builder that collects the problems found.
 * @returns Filter array when valid, otherwise `undefined`.
 */
export function validateDebugFilterSelectors(
  value: unknown,
  filterName: "files" | "dependencies",
  diagnostics: DiagnosticsBuilder
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
  diagnostics.warning(
    `Please provide a valid array for '${filterName}' in '${SETTINGS_KEYS_MAP.DEBUG}' setting.`,
    moreInfoSettingsLink(),
    [[SETTINGS_KEYS_MAP.DEBUG, "filter", filterName]]
  );
  return undefined;
}

/**
 * Validates debug `files` filter selector list.
 *
 * @param value - Raw `debug.filter.files` setting value.
 * @param diagnostics - Builder that collects the problems found.
 * @returns Valid files filter selectors.
 */
export function validateDebugFilesFilter(
  value: unknown,
  diagnostics: DiagnosticsBuilder
) {
  return validateDebugFilterSelectors(value, "files", diagnostics);
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
 * @param diagnostics - Builder that collects the problems found.
 * @returns Normalized boolean value or `undefined` when not provided/invalid.
 */
function getNormalizedDebugEnabled(
  enabled: unknown,
  diagnostics: DiagnosticsBuilder
): boolean | undefined {
  if (isUndefined(enabled)) {
    return undefined;
  }

  if (isBoolean(enabled)) {
    return enabled;
  }

  diagnostics.warning(
    `Please provide a valid boolean for 'enabled' in '${SETTINGS_KEYS_MAP.DEBUG}' setting.`,
    moreInfoSettingsLink(),
    [[SETTINGS_KEYS_MAP.DEBUG, "enabled"]]
  );

  return undefined;
}

/**
 * Validates and normalizes a `debug.messages.*` boolean flag when provided.
 *
 * @param messages - Raw `debug.messages` object.
 * @param key - Message flag key to validate.
 * @param diagnostics - Builder that collects the problems found.
 * @returns Normalized boolean flag or `undefined` when not provided/invalid.
 */
function getNormalizedDebugMessageFlag(
  messages: Record<string, unknown>,
  key: keyof DebugSettingNormalized["messages"],
  diagnostics: DiagnosticsBuilder
): boolean | undefined {
  const value = messages[key];

  if (isUndefined(value)) {
    return undefined;
  }

  if (isBoolean(value)) {
    return value;
  }

  diagnostics.warning(
    `Please provide a valid boolean for 'messages.${key}' in '${SETTINGS_KEYS_MAP.DEBUG}' setting.`,
    moreInfoSettingsLink(),
    [[SETTINGS_KEYS_MAP.DEBUG, "messages", key]]
  );

  return undefined;
}

/**
 * Validates and normalizes `debug.messages` object and known flags.
 *
 * @param messages - Raw `debug.messages` value.
 * @param diagnostics - Builder that collects the problems found.
 * @returns Normalized debug messages configuration.
 */
function getNormalizedDebugMessages(
  messages: unknown,
  diagnostics: DiagnosticsBuilder
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
    diagnostics.warning(
      `Please provide a valid object for 'messages' in '${SETTINGS_KEYS_MAP.DEBUG}' setting.`,
      moreInfoSettingsLink(),
      [[SETTINGS_KEYS_MAP.DEBUG, "messages"]]
    );
    return defaults;
  }

  return {
    files:
      getNormalizedDebugMessageFlag(messages, "files", diagnostics) ??
      defaults.files,
    dependencies:
      getNormalizedDebugMessageFlag(messages, "dependencies", diagnostics) ??
      defaults.dependencies,
    violations:
      getNormalizedDebugMessageFlag(messages, "violations", diagnostics) ??
      defaults.violations,
  };
}

/**
 * Validates and normalizes `debug.filter` object and supported selectors.
 *
 * @param filter - Raw `debug.filter` value.
 * @param diagnostics - Builder that collects the problems found.
 * @returns Normalized debug filter configuration.
 */
function getNormalizedDebugFilter(
  filter: unknown,
  diagnostics: DiagnosticsBuilder
): DebugSettingNormalized["filter"] {
  const defaults: DebugSettingNormalized["filter"] = {
    files: undefined,
    dependencies: undefined,
  };

  if (isUndefined(filter)) {
    return defaults;
  }

  if (!isObject(filter)) {
    diagnostics.warning(
      `Please provide a valid object for 'filter' in '${SETTINGS_KEYS_MAP.DEBUG}' setting.`,
      moreInfoSettingsLink(),
      [[SETTINGS_KEYS_MAP.DEBUG, "filter"]]
    );
    return defaults;
  }

  return {
    files: validateDebugFilesFilter(filter.files, diagnostics),
    dependencies: validateDebugDependenciesFilter(filter.dependencies),
  };
}

/**
 * Validates the `debug` setting object and nested filters.
 *
 * @param debug - Raw debug setting value.
 * @param diagnostics - Builder that collects the problems found.
 * @returns Normalized debug setting when valid.
 */
function getNormalizedDebug(
  debug: unknown,
  diagnostics: DiagnosticsBuilder
): DebugSettingNormalized {
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
    diagnostics.warning(
      `Please provide a valid value in '${SETTINGS_KEYS_MAP.DEBUG}' setting.`,
      `The value should be an object. ${moreInfoSettingsLink()}`,
      [[SETTINGS_KEYS_MAP.DEBUG]]
    );
    return defaults;
  }

  return {
    enabled:
      getNormalizedDebugEnabled(debug.enabled, diagnostics) ?? defaults.enabled,
    messages: getNormalizedDebugMessages(debug.messages, diagnostics),
    filter: getNormalizedDebugFilter(debug.filter, diagnostics),
  };
}

/**
 * Normalizes and filters element descriptors, reporting invalid entries.
 *
 * @param elements - Raw element descriptors from settings.
 * @param legacyTypes - Fallback legacy types setting for backward compatibility.
 * @param legacyWarnings - When `false`, skips all legacy deprecation detection and reporting.
 * @param diagnostics - Builder that collects the problems found.
 * @returns Filtered array of valid element descriptors.
 */
function getNormalizedElementDescriptors(
  elements: unknown,
  legacyTypes: unknown,
  legacyWarnings: boolean,
  diagnostics: DiagnosticsBuilder
): ElementDescriptor[] {
  deprecateTypes(legacyTypes, legacyWarnings, diagnostics);
  const rawElements = elements || legacyTypes;
  const settingKey = elements ? ELEMENTS : TYPES;

  if (!rawElements) {
    // Element descriptors are optional on their own: the file layer can be the
    // only configured classification. The "no classification at all" case is
    // reported once in `normalizeSettings`, where both layers are known.
    return [];
  }

  if (!isArray(rawElements)) {
    diagnostics.warning(
      `Invalid ${settingKey} setting format.`,
      `It should be an array of element descriptors. ${moreInfoSettingsLink()}`,
      [[settingKey]]
    );
    return [];
  }

  const elementDescriptors = transformLegacyTypes(
    rawElements as ElementDescriptors
  );
  const validEntries = elementDescriptors
    .map((descriptor, index) => ({ descriptor, index }))
    .filter(({ descriptor }) => isElementDescriptor(descriptor));
  const validElementDescriptors = validEntries.map(
    ({ descriptor }) => descriptor
  );

  if (validElementDescriptors.length < elementDescriptors.length) {
    const invalidEntries = elementDescriptors
      .map((descriptor, index) => ({ descriptor, index }))
      .filter(({ descriptor }) => !isElementDescriptor(descriptor));
    diagnostics.warning(
      `Some element descriptors are invalid and will be ignored.`,
      `Invalid descriptors:\n${JSON.stringify(invalidEntries.map(({ descriptor }) => descriptor))}.\n${moreInfoSettingsLink()}`,
      invalidEntries.map(({ index }) => [settingKey, index])
    );
  }

  if (legacyWarnings) {
    // cspell:ignore partialmatch -- documentation anchor for the partialMatch option
    const entriesWithMode = validEntries.filter(
      ({ descriptor }) => descriptor.mode !== undefined
    );
    if (entriesWithMode.length > 0) {
      diagnostics.deprecation(
        `The 'mode' option in element descriptors is deprecated and will be removed in a future major version.`,
        `Use 'partialMatch: false' instead of 'mode: "full"'. Remove 'mode: "folder"' (it is the default). ${migrationToV7GuideLink("deprecated-mode-in-element-descriptors")}`,
        entriesWithMode.map(({ index }) => [settingKey, index, "mode"])
      );
    }

    const entriesWithCategory = validEntries.filter(
      ({ descriptor }) =>
        (descriptor as unknown as Record<string, unknown>).category !==
        undefined
    );
    if (entriesWithCategory.length > 0) {
      diagnostics.deprecation(
        `The 'category' option in element descriptors is deprecated and will be removed in a future major version.`,
        `Use the 'category' property in file descriptors ('${SETTINGS_KEYS_MAP.FILES}') instead. ${migrationToV7GuideLink("deprecated-category-in-element-descriptors-and-selectors")}`,
        entriesWithCategory.map(({ index }) => [settingKey, index, "category"])
      );
    }
  }

  const conflictingEntries = validEntries.filter(
    ({ descriptor }) =>
      descriptor.partialMatch === false && descriptor.mode !== undefined
  );
  if (conflictingEntries.length > 0) {
    diagnostics.warning(
      `The 'mode' option has no effect when 'partialMatch: false' is set.`,
      `Remove 'mode' from these element descriptors: ${JSON.stringify(
        conflictingEntries.map(({ descriptor }) => descriptor.pattern)
      )}. ${moreInfoElementsLink("partialmatch-optional")}`,
      conflictingEntries.map(({ index }) => [settingKey, index, "mode"])
    );
  }

  // Surviving Stryker mutant: the replacement without the `+` quantifier survives because `test` only asks for a character after the dot, which the character class alone answers the same way.
  const FILE_EXTENSION_RE = /\.[a-zA-Z0-9]+/;
  const fileLikeEntries = validEntries.filter(({ descriptor }) => {
    const isEffectiveFolderMode =
      descriptor.partialMatch === false ||
      !descriptor.mode ||
      descriptor.mode === ELEMENT_DESCRIPTOR_MODES_MAP.FOLDER;
    if (!isEffectiveFolderMode) return false;
    const patterns = Array.isArray(descriptor.pattern)
      ? descriptor.pattern
      : [descriptor.pattern];
    return patterns.some((p) => FILE_EXTENSION_RE.test(p.split("/").pop()!));
  });
  if (fileLikeEntries.length > 0) {
    diagnostics.warning(
      `Some element descriptors appear to use file patterns.`,
      `Element patterns match folders, not individual files. For file classification, use file descriptors ('boundaries/files'). Affected patterns: ${JSON.stringify(
        fileLikeEntries.map(({ descriptor }) => descriptor.pattern)
      )}. ${moreInfoElementsLink("partialmatch-optional")}`,
      fileLikeEntries.map(({ index }) => [settingKey, index, "pattern"])
    );
  }

  return validElementDescriptors;
}

/**
 * Normalizes and filters file descriptors, reporting invalid entries.
 *
 * @param fileDescriptors - Raw file descriptors from settings.
 * @param diagnostics - Builder that collects the problems found.
 * @returns Filtered array of valid file descriptors.
 */
function getNormalizedFileDescriptors(
  fileDescriptors: unknown,
  diagnostics: DiagnosticsBuilder
): FileDescriptor[] {
  if (!fileDescriptors) {
    return [];
  }

  if (!isArray(fileDescriptors)) {
    diagnostics.warning(
      `Invalid ${SETTINGS_KEYS_MAP.FILES} setting format.`,
      `It should be an array of file descriptors. ${moreInfoSettingsLink()}`,
      [[SETTINGS_KEYS_MAP.FILES]]
    );
    return [];
  }

  const validFileDescriptors = fileDescriptors.filter(
    (desc: unknown): desc is FileDescriptor => isFileDescriptor(desc)
  );

  if (validFileDescriptors.length < fileDescriptors.length) {
    const invalidEntries = fileDescriptors
      .map((descriptor, index) => ({ descriptor, index }))
      .filter(({ descriptor }) => !isFileDescriptor(descriptor));
    diagnostics.warning(
      `Some file descriptors are invalid and will be ignored.`,
      `Invalid descriptors:\n${JSON.stringify(invalidEntries.map(({ descriptor }) => descriptor))}.\n${moreInfoSettingsLink()}`,
      invalidEntries.map(({ index }) => [SETTINGS_KEYS_MAP.FILES, index])
    );
  }

  return validFileDescriptors;
}

/**
 * Normalizes and filters dependency node keys, reporting invalid entries.
 *
 * @param dependencyNodes - Raw dependency node keys from settings.
 * @param diagnostics - Builder that collects the problems found.
 * @returns Expanded array of dependency node selectors with defaults.
 */
function getNormalizedDependencyNodes(
  dependencyNodes: unknown,
  diagnostics: DiagnosticsBuilder
): DependencyNodeSelector[] {
  if (!dependencyNodes) {
    const defaultKeys = [
      DEPENDENCY_NODE_KEYS_MAP.IMPORT,
      DEPENDENCY_NODE_KEYS_MAP.EXPORT,
      DEPENDENCY_NODE_KEYS_MAP.REQUIRE,
      DEPENDENCY_NODE_KEYS_MAP.DYNAMIC_IMPORT,
    ];
    return defaultKeys.flatMap((key) => [...DEFAULT_DEPENDENCY_NODES[key]]);
  }

  if (!isArray(dependencyNodes)) {
    const defaultNodesNames = Object.keys(DEFAULT_DEPENDENCY_NODES);
    diagnostics.warning(
      `Invalid ${DEPENDENCY_NODES} setting format.`,
      `It should be an array of the following strings: "${defaultNodesNames.join('", "')}". ${moreInfoSettingsLink()}`,
      [[DEPENDENCY_NODES]]
    );
    return [];
  }

  const validKeys = dependencyNodes.filter(isDependencyNodeKey);

  if (validKeys.length < dependencyNodes.length) {
    const invalidEntries = dependencyNodes
      .map((key, index) => ({ key, index }))
      .filter(({ key }) => !isDependencyNodeKey(key));
    const defaultNodesNames = Object.keys(DEFAULT_DEPENDENCY_NODES);
    diagnostics.warning(
      `Invalid values in ${DEPENDENCY_NODES} setting.`,
      `Invalid values: ${JSON.stringify(invalidEntries.map(({ key }) => key))}. Valid strings are: "${defaultNodesNames.join('", "')}". ${moreInfoSettingsLink()}`,
      invalidEntries.map(({ index }) => [DEPENDENCY_NODES, index])
    );
  }

  return validKeys.flatMap((key: DependencyNodeKey) => [
    ...DEFAULT_DEPENDENCY_NODES[key],
  ]);
}

/**
 * Normalizes additional dependency node selectors, reporting invalid entries.
 *
 * @param additionalNodes - Raw additional dependency node selectors from settings.
 * @param diagnostics - Builder that collects the problems found.
 * @returns Array of valid additional dependency node selectors or empty array.
 */
function getNormalizedAdditionalDependencyNodes(
  additionalNodes: unknown,
  diagnostics: DiagnosticsBuilder
): DependencyNodeSelector[] {
  if (!additionalNodes) {
    return [];
  }

  if (!isArray(additionalNodes)) {
    diagnostics.warning(
      `Invalid ${ADDITIONAL_DEPENDENCY_NODES} setting format.`,
      `It should be an array containing objects with properties: { selector: "<esquery selector>", kind: "value" | "type", name: "<string>" }. ${moreInfoSettingsLink()}`,
      [[ADDITIONAL_DEPENDENCY_NODES]]
    );
    return [];
  }

  const entries = additionalNodes.map((node, index) => ({
    node,
    index,
    isValid: isValidDependencyNodeSelector(node, diagnostics, [
      ADDITIONAL_DEPENDENCY_NODES,
      index,
    ]),
  }));
  const validNodes = entries
    .filter(({ isValid }) => isValid)
    .map(({ node }) => node as DependencyNodeSelector);

  if (validNodes.length < additionalNodes.length) {
    const invalidEntries = entries.filter(({ isValid }) => !isValid);
    diagnostics.warning(
      `Invalid ${ADDITIONAL_DEPENDENCY_NODES} setting.`,
      `Invalid nodes: ${JSON.stringify(invalidEntries.map(({ node }) => node))}. ${moreInfoSettingsLink()}`,
      invalidEntries.map(({ index }) => [ADDITIONAL_DEPENDENCY_NODES, index])
    );
  }

  return validNodes;
}

/**
 * Normalizes a setting that accepts a string or an array of strings, converting it to array format.
 *
 * @param value - Raw setting value.
 * @param settingKey - Key of the setting, used in the problem title and path.
 * @param diagnostics - Builder that collects the problems found.
 * @returns Array of strings or undefined.
 */
function getNormalizedStringOrStringArray(
  value: unknown,
  settingKey: SettingsKey,
  diagnostics: DiagnosticsBuilder
): string[] | undefined {
  if (!value) {
    return undefined;
  }

  if (isString(value)) {
    return [value];
  }

  if (isArray(value) && value.every(isString)) {
    return value;
  }

  diagnostics.warning(
    `Please provide a valid value in '${settingKey}' setting.`,
    `The value should be a string or an array of strings. ${moreInfoSettingsLink()}`,
    [[settingKey]]
  );
  return undefined;
}

/**
 * Reports a setting that should be a boolean and is not.
 *
 * @param settingKey - Key of the setting.
 * @param diagnostics - Builder that collects the problems found.
 */
function reportInvalidBooleanSetting(
  settingKey: SettingsKey,
  diagnostics: DiagnosticsBuilder
): void {
  diagnostics.warning(
    `Please provide a valid value in '${settingKey}' setting.`,
    `The value should be a boolean. ${moreInfoSettingsLink()}`,
    [[settingKey]]
  );
}

/**
 * Normalizes legacy templates setting, validating and applying defaults.
 *
 * @param legacyTemplates - Raw legacy templates setting value.
 * @param legacyWarnings - When `false`, skips the deprecation diagnostic.
 * @param diagnostics - Builder that collects the problems found.
 * @returns Boolean value or default.
 */
function getNormalizedLegacyTemplates(
  legacyTemplates: unknown,
  legacyWarnings: boolean,
  diagnostics: DiagnosticsBuilder
): boolean {
  if (isUndefined(legacyTemplates)) {
    return LEGACY_TEMPLATES_DEFAULT;
  }

  if (isBoolean(legacyTemplates)) {
    if (legacyTemplates && legacyWarnings) {
      diagnostics.deprecation(
        `'${SETTINGS_KEYS_MAP.LEGACY_TEMPLATES}' setting is deprecated.`,
        `The legacy \${...} template syntax will not be supported in the next major version. Migrate to the {{...}} Handlebars syntax. ${migrationToV6GuideLink("new-template-syntax")}`,
        [[SETTINGS_KEYS_MAP.LEGACY_TEMPLATES]]
      );
    }
    return legacyTemplates;
  }

  reportInvalidBooleanSetting(SETTINGS_KEYS_MAP.LEGACY_TEMPLATES, diagnostics);
  return LEGACY_TEMPLATES_DEFAULT;
}

/**
 * Normalizes elements-single-match setting, validating and applying defaults. Falls back to
 * the deprecated elements-single-type setting when elements-single-match is not provided.
 *
 * @param elementsSingleMatch - Raw elements-single-match setting value.
 * @param elementsSingleType - Raw (deprecated) elements-single-type setting value.
 * @param legacyWarnings - When `false`, skips the deprecation diagnostic for elements-single-type.
 * @param diagnostics - Builder that collects the problems found.
 * @returns Boolean value or default.
 */
function getNormalizedElementsSingleMatch(
  elementsSingleMatch: unknown,
  elementsSingleType: unknown,
  legacyWarnings: boolean,
  diagnostics: DiagnosticsBuilder
): boolean {
  let legacyValue: boolean | undefined;

  if (!isUndefined(elementsSingleType)) {
    if (isBoolean(elementsSingleType)) {
      legacyValue = elementsSingleType;
    } else {
      reportInvalidBooleanSetting(
        SETTINGS_KEYS_MAP.ELEMENTS_SINGLE_TYPE,
        diagnostics
      );
    }
  }

  if (isUndefined(elementsSingleMatch)) {
    if (isUndefined(legacyValue)) {
      return ELEMENTS_SINGLE_TYPE_DEFAULT;
    }

    if (legacyWarnings) {
      diagnostics.deprecation(
        `'${SETTINGS_KEYS_MAP.ELEMENTS_SINGLE_TYPE}' setting is deprecated.`,
        `Use '${SETTINGS_KEYS_MAP.ELEMENTS_SINGLE_MATCH}' instead. ${moreInfoSettingsLink()}`,
        [[SETTINGS_KEYS_MAP.ELEMENTS_SINGLE_TYPE]]
      );
    }
    return legacyValue;
  }

  if (isBoolean(elementsSingleMatch)) {
    return elementsSingleMatch;
  }

  reportInvalidBooleanSetting(
    SETTINGS_KEYS_MAP.ELEMENTS_SINGLE_MATCH,
    diagnostics
  );
  return isUndefined(legacyValue) ? ELEMENTS_SINGLE_TYPE_DEFAULT : legacyValue;
}

/**
 * Normalizes a boolean setting, validating and applying its default.
 *
 * @param value - Raw setting value.
 * @param settingKey - Key of the setting, used in the problem title and path.
 * @param defaultValue - Value when the setting is not set or is invalid.
 * @param diagnostics - Builder that collects the problems found.
 * @returns Boolean value or default.
 */
function getNormalizedBooleanSetting(
  value: unknown,
  settingKey: SettingsKey,
  defaultValue: boolean,
  diagnostics: DiagnosticsBuilder
): boolean {
  if (isUndefined(value)) {
    return defaultValue;
  }

  if (isBoolean(value)) {
    return value;
  }

  reportInvalidBooleanSetting(settingKey, diagnostics);
  return defaultValue;
}

const BOOLEAN_FLAG_AS_EXTERNAL_OPTION_KEYS = [
  "unresolvableAlias",
  "inNodeModules",
  "outsideRootPath",
] as const;

/**
 * Validates a boolean flag-as-external option, reporting it and leaving the default
 * untouched when the provided value is not a valid boolean.
 * @param options - Raw flag-as-external options provided by the user.
 * @param validated - Normalized flag-as-external object to update in place.
 * @param key - Name of the boolean option to validate.
 * @param diagnostics - Builder that collects the problems found.
 */
function validateBooleanFlagAsExternalOption(
  options: Record<string, unknown>,
  validated: Required<FlagAsExternalOptions>,
  key: (typeof BOOLEAN_FLAG_AS_EXTERNAL_OPTION_KEYS)[number],
  diagnostics: DiagnosticsBuilder
): void {
  if (isUndefined(options[key])) {
    return;
  }

  if (isBoolean(options[key])) {
    validated[key] = options[key];
  } else {
    diagnostics.warning(
      `Please provide a valid boolean for '${key}' in '${SETTINGS_KEYS_MAP.FLAG_AS_EXTERNAL}' setting.`,
      moreInfoSettingsLink(),
      [[SETTINGS_KEYS_MAP.FLAG_AS_EXTERNAL, key]]
    );
  }
}

/**
 * Normalizes flag-as-external option, validating and applying defaults.
 *
 * @param flagAsExternal - Raw flag-as-external setting value.
 * @param diagnostics - Builder that collects the problems found.
 * @returns Normalized flag-as-external object with defaults.
 */
function getNormalizedFlagAsExternal(
  flagAsExternal: unknown,
  diagnostics: DiagnosticsBuilder
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
    diagnostics.warning(
      `Please provide a valid value in '${SETTINGS_KEYS_MAP.FLAG_AS_EXTERNAL}' setting.`,
      `The value should be an object. ${moreInfoSettingsLink()}`,
      [[SETTINGS_KEYS_MAP.FLAG_AS_EXTERNAL]]
    );
    return defaults;
  }

  const validated: Required<FlagAsExternalOptions> = { ...defaults };
  const options = flagAsExternal as Record<string, unknown>;

  for (const key of BOOLEAN_FLAG_AS_EXTERNAL_OPTION_KEYS) {
    validateBooleanFlagAsExternalOption(options, validated, key, diagnostics);
  }

  if (!isUndefined(options.customSourcePatterns)) {
    if (
      isArray(options.customSourcePatterns) &&
      options.customSourcePatterns.every(isString)
    ) {
      validated.customSourcePatterns = options.customSourcePatterns;
    } else {
      diagnostics.warning(
        `Please provide a valid array of strings for 'customSourcePatterns' in '${SETTINGS_KEYS_MAP.FLAG_AS_EXTERNAL}' setting.`,
        moreInfoSettingsLink(),
        [[SETTINGS_KEYS_MAP.FLAG_AS_EXTERNAL, "customSourcePatterns"]]
      );
    }
  }

  return validated;
}

/**
 * Normalizes the `boundaries/*` settings: applies their defaults, converts their legacy forms and leaves out the invalid entries, reporting each problem as a diagnostic.
 *
 * @param settings - The settings object of an ESLint config. Only its `boundaries/*` keys are read.
 * @param options - Options of the normalization.
 * @param options.rootPath - The root path of the project, already resolved by the host. Without it, the normalized `rootPath` is the `boundaries/root-path` setting as written.
 * @returns The normalized settings and the problems found, with paths from the root of the settings object.
 */
export function normalizeSettings(
  settings: Record<string, unknown> | undefined,
  { rootPath }: NormalizeSettingsOptions = {}
): ConfigResult<SettingsNormalized> {
  const diagnostics = new DiagnosticsBuilder();
  const rawSettings = settings ?? {};

  // Must be resolved first so it can be passed to all legacy-detecting helpers.
  const legacyWarnings = getNormalizedBooleanSetting(
    rawSettings[SETTINGS_KEYS_MAP.LEGACY_WARNINGS],
    SETTINGS_KEYS_MAP.LEGACY_WARNINGS,
    LEGACY_WARNINGS_DEFAULT,
    diagnostics
  );

  deprecateAlias(
    rawSettings[SETTINGS_KEYS_MAP.ALIAS],
    legacyWarnings,
    diagnostics
  );

  // Normalize all settings from raw values
  const elementDescriptors = getNormalizedElementDescriptors(
    rawSettings[ELEMENTS],
    rawSettings[TYPES],
    legacyWarnings,
    diagnostics
  );

  const fileDescriptors = getNormalizedFileDescriptors(
    rawSettings[SETTINGS_KEYS_MAP.FILES],
    diagnostics
  );

  // At least one classification layer is required. Elements and files are each
  // optional on their own, so only report when neither layer is configured.
  if (!elementDescriptors.length && !fileDescriptors.length) {
    diagnostics.warning(
      `Please provide element descriptors using the '${ELEMENTS}' setting, or file descriptors using the '${SETTINGS_KEYS_MAP.FILES}' setting.`,
      moreInfoSettingsLink()
    );
  }

  const dependencyNodes = getNormalizedDependencyNodes(
    rawSettings[DEPENDENCY_NODES],
    diagnostics
  );

  const additionalDependencyNodes = getNormalizedAdditionalDependencyNodes(
    rawSettings[SETTINGS_KEYS_MAP.ADDITIONAL_DEPENDENCY_NODES],
    diagnostics
  );

  const ignorePaths = getNormalizedStringOrStringArray(
    rawSettings[SETTINGS_KEYS_MAP.IGNORE],
    SETTINGS_KEYS_MAP.IGNORE,
    diagnostics
  );

  const includePaths = getNormalizedStringOrStringArray(
    rawSettings[SETTINGS_KEYS_MAP.INCLUDE],
    SETTINGS_KEYS_MAP.INCLUDE,
    diagnostics
  );

  const legacyTemplates = getNormalizedLegacyTemplates(
    rawSettings[SETTINGS_KEYS_MAP.LEGACY_TEMPLATES],
    legacyWarnings,
    diagnostics
  );

  const elementsSingleMatch = getNormalizedElementsSingleMatch(
    rawSettings[SETTINGS_KEYS_MAP.ELEMENTS_SINGLE_MATCH],
    rawSettings[SETTINGS_KEYS_MAP.ELEMENTS_SINGLE_TYPE],
    legacyWarnings,
    diagnostics
  );

  const filesSingleMatch = getNormalizedBooleanSetting(
    rawSettings[SETTINGS_KEYS_MAP.FILES_SINGLE_MATCH],
    SETTINGS_KEYS_MAP.FILES_SINGLE_MATCH,
    FILES_SINGLE_MATCH_DEFAULT,
    diagnostics
  );

  const cache = getNormalizedBooleanSetting(
    rawSettings[SETTINGS_KEYS_MAP.CACHE],
    SETTINGS_KEYS_MAP.CACHE,
    CACHE_DEFAULT,
    diagnostics
  );

  const flagAsExternal = getNormalizedFlagAsExternal(
    rawSettings[SETTINGS_KEYS_MAP.FLAG_AS_EXTERNAL],
    diagnostics
  );

  const debugSetting = getNormalizedDebug(
    rawSettings[SETTINGS_KEYS_MAP.DEBUG],
    diagnostics
  );

  const rootPathSetting = rawSettings[SETTINGS_KEYS_MAP.ROOT_PATH];

  return {
    value: {
      elementDescriptors,
      elementsSingleMatch,
      fileDescriptors,
      filesSingleMatch,
      ignorePaths,
      includePaths,
      rootPath:
        rootPath ??
        (rootPathSetting && isString(rootPathSetting)
          ? rootPathSetting
          : undefined),
      dependencyNodes: [...dependencyNodes, ...additionalDependencyNodes],
      legacyTemplates,
      cache,
      legacyWarnings,
      flagAsExternal,
      debug: debugSetting,
    },
    diagnostics: diagnostics.build(),
  };
}
