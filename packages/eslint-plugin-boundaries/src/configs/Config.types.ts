import type { Linter } from "eslint";

import type {
  ElementTypesRuleOptions,
  EntryPointRuleOptions,
  ExternalRuleOptions,
  NoPrivateOptions,
} from "../constants/Options.types";
import type { PLUGIN_NAME } from "../constants/plugin";
import type {
  ELEMENT_TYPES,
  ENTRY_POINT,
  EXTERNAL,
  NO_IGNORED,
  NO_PRIVATE,
  NO_UNKNOWN,
  NO_UNKNOWN_FILES,
} from "../constants/rules";
import type { Settings } from "../constants/settings";

export type {
  ElementTypesRuleOptions,
  EntryPointRuleOptions,
  ExternalRuleOptions,
  NoPrivateOptions,
} from "../constants/Options.types";

export interface Config<TNamespace extends string = typeof PLUGIN_NAME>
  extends Linter.Config {
  settings?: Settings;
  rules?: {
    [K in `${TNamespace}/${
      | typeof ELEMENT_TYPES
      | typeof ENTRY_POINT
      | typeof EXTERNAL
      | typeof NO_IGNORED
      | typeof NO_PRIVATE
      | typeof NO_UNKNOWN_FILES
      | typeof NO_UNKNOWN}`]?: K extends `${TNamespace}/${typeof ELEMENT_TYPES}`
      ? Linter.RuleEntry<ElementTypesRuleOptions[]>
      : K extends `${TNamespace}/${typeof ENTRY_POINT}`
        ? Linter.RuleEntry<EntryPointRuleOptions[]>
        : K extends `${TNamespace}/${typeof EXTERNAL}`
          ? Linter.RuleEntry<ExternalRuleOptions[]>
          : K extends `${TNamespace}/${typeof NO_PRIVATE}`
            ? Linter.RuleEntry<NoPrivateOptions[]>
            : Linter.RuleEntry<never>;
  };
}
