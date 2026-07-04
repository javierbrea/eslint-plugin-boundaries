export { DependenciesMatcher } from "./Dependency";
export {
  isLegacyDependencyInfoSingleSelector,
  isLegacyDependencyInfoSelector,
  isDependencyInfoSingleSelector,
  isDependencyInfoSelector,
  isBackwardCompatibleDependencyInfoSingleSelector,
  isBackwardCompatibleDependencyInfoSelector,
  normalizeLegacyDependencyInfoSingleSelector,
  isBaseDependencySingleSelector,
  isLegacyDependencySingleSelector,
  isLegacyDependencySelector,
  isDependencySingleSelector,
  isDependencySelector,
  isBackwardCompatibleDependencySingleSelector,
  isBackwardCompatibleDependencySelector,
  normalizeSingleDependencyInfoSelector,
  normalizeDependencyInfoSelector,
  normalizeLegacyDependencySingleSelector,
  normalizeSingleDependencySelector,
  normalizeDependencySelector,
} from "./Dependency";
export type {
  DependencySingleSelectorMatchResult,
  DependencyMatchResult,
  DependencyInfoSingleSelector,
  LegacyDependencyInfoSingleSelector,
  LegacyDependencyInfoSelector,
  BackwardCompatibleDependencyInfoSingleSelector,
  BackwardCompatibleDependencyInfoSelector,
  DependencyInfoSelector,
  DependencyInfoSelectorNormalized,
  LegacyDependencySingleSelector,
  LegacyDependencySelector,
  DependencySingleSelector,
  DependencySelector,
  BackwardCompatibleDependencySingleSelector,
  BackwardCompatibleDependencySelector,
  DependencySingleSelectorNormalized,
  DependencySelectorNormalized,
} from "./Dependency";

export { ElementsMatcher } from "./Element";
export {
  isLegacySimpleElementSingleSelectorByType,
  isLegacySimpleElementSingleSelectorByTypeWithOptions,
  isLegacySimpleElementSingleSelector,
  isLegacySimpleElementSelector,
  isLegacyParentElementSingleSelector,
  isLegacyElementSingleObjectSelector,
  isLegacyElementSingleSelector,
  isLegacyElementSelector,
  isElementSingleSelector,
  isElementSelector,
  isBackwardCompatibleElementSingleSelector,
  isBackwardCompatibleElementSelector,
  normalizeLegacySimpleElementSingleSelector,
  normalizeLegacyParentElementSelectors,
  normalizeParentElementSelector,
  normalizeParentInElementSingleSelector,
  normalizeLegacyElementSingleObjectSelector,
  normalizeLegacyElementSingleSelector,
  normalizeSingleElementSelector,
  normalizeElementSelector,
} from "./Element";
export type {
  ParentElementSingleSelector,
  ParentElementArrayQuery,
  LegacyParentElementSingleSelector,
  LegacyParentElementSelector,
  ParentElementSelector,
  BackwardCompatibleParentElementSingleSelector,
  BackwardCompatibleParentElementSelector,
  ParentElementSelectorNormalized,
  LegacySimpleElementSingleSelectorByType,
  LegacySimpleElementSingleSelectorByTypeWithOptions,
  LegacySimpleElementSingleSelector,
  LegacyElementSimpleSelector,
  ElementSingleSelector,
  LegacyElementSingleObjectSelector,
  LegacyElementObjectSelector,
  ElementSingleSelectorNormalized,
  LegacyElementSingleSelector,
  LegacyElementSelector,
  ElementSelector,
  BackwardCompatibleElementSingleSelector,
  BackwardCompatibleElementSelector,
  ElementSelectorNormalized,
} from "./Element";

export { EntitiesMatcher } from "./Entity";
export {
  isLegacyEntitySingleSelector,
  isLegacyEntitySelector,
  isEntitySingleSelector,
  isEntitySelector,
  normalizeSingleEntitySelector,
  normalizeEntitySelector,
} from "./Entity";
export type {
  EntitySingleSelectorMatchResult,
  EntityMatchResult,
  LegacyEntitySingleSelector,
  LegacyEntitySelector,
  EntitySingleSelector,
  EntitySelector,
  BackwardCompatibleEntitySingleSelector,
  BackwardCompatibleEntitySelector,
  EntitySingleSelectorNormalized,
  EntitySelectorNormalized,
} from "./Entity";

export { FilesMatcher } from "./File";
export {
  isFileSingleSelector,
  isFileSelector,
  normalizeSingleFileSelector,
  normalizeFileSelector,
} from "./File";
export type {
  FileSingleSelector,
  FileSelector,
  FileSelectorNormalized,
} from "./File";

export { ModulesMatcher } from "./Module";
export {
  isModuleSingleSelector,
  isModuleSelector,
  normalizeModuleSingleSelector,
  normalizeModuleSelector,
} from "./Module";
export type {
  ModuleSingleSelector,
  ModuleSelector,
  ModuleSelectorNormalized,
} from "./Module";

export {
  BaseElementsMatcher,
  Micromatch,
  ARRAY_QUERY_KEYS,
  isArrayQuery,
  isStringArrayQuery,
  isExpandItem,
  resolveExpandItem,
  expandStringArrayQuery,
  isCapturedValuesSingleSelector,
  isCapturedValuesSelector,
  extendsSingleSelector,
} from "./Shared";
export type {
  ArrayQueryAtIndex,
  ArrayQuery,
  ArrayQueryExpandItem,
  StringArrayQueryMatcher,
  StringArrayQuery,
  TemplateData,
  MatcherOptions,
  EntityMatcherOptions,
  CapturedValuesSingleSelector,
  CapturedValuesSelector,
  BaseSingleSelector,
  MicromatchSerializedCache,
} from "./Shared";

export { Matcher } from "./Matcher";
export type { MatcherSerializedCache } from "./Matcher.types";
