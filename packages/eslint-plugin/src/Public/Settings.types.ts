export { DEPENDENCY_KINDS_MAP, isDependencyKind } from "@boundaries/elements";
import { DEPENDENCY_KINDS_MAP } from "@boundaries/elements";
export type {
  ElementDescriptorMode,
  ElementDescriptor,
  ElementDescriptors,
} from "@boundaries/elements";
export {
  ELEMENT_DESCRIPTOR_MODES_MAP,
  isElementDescriptorMode,
} from "@boundaries/elements";

export type {
  Settings,
  IgnoreSetting,
  IncludeSetting,
  RootPathSetting,
  DebugSetting,
  DebugFilterSetting,
  SettingsKey,
  DependencyNodeKey,
  DependencyNodeSelector,
  AliasSetting,
} from "../Shared";

export { DEPENDENCY_NODE_KEYS_MAP, SETTINGS_KEYS_MAP } from "../Shared";

/**
 * Map of the kinds of import, either a type import or a value import.
 * @deprecated Use DEPENDENCY_KINDS_MAP instead
 */
export const IMPORT_KINDS_MAP = DEPENDENCY_KINDS_MAP;

export { isImportKind, isDependencyNodeKey, isSettingsKey } from "../Settings";
