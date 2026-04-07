/* eslint-disable no-unused-vars,@typescript-eslint/no-unused-vars */
// NOTE: This config is not executed in any test. It only checks types in build time
import {
  createConfig,
  PLUGIN_NAME,
  RULE_SHORT_NAMES_MAP,
  RULE_NAMES_MAP,
  isRuleShortName,
  isRuleName,
  isDependencyKind,
  DEPENDENCY_KINDS_MAP,
  DEPENDENCY_NODE_KEYS_MAP,
  isDependencyNodeKey,
  SETTINGS_KEYS_MAP,
  isSettingsKey,
  ELEMENT_DESCRIPTOR_MODES_MAP,
  RULE_POLICIES_MAP,
  isRulePolicy,
  FlagAsExternalOptions,
  isElementSelector,
  DependenciesRuleOptions,
  DependenciesRule,
} from "@boundaries/eslint-plugin/config";
import type {
  RulePolicy,
  SettingsKey,
  DependencyNodeKey,
  DebugSetting,
} from "@boundaries/eslint-plugin/config";
import recommendedBoundariesConfig from "@boundaries/eslint-plugin/recommended";

const settingKey: SettingsKey = SETTINGS_KEYS_MAP.ELEMENTS;

const anotherSettingKey = SETTINGS_KEYS_MAP.ROOT_PATH;

const flagAsExternalKey = SETTINGS_KEYS_MAP.FLAG_AS_EXTERNAL;

if (!isSettingsKey(anotherSettingKey)) {
  throw new Error(`This should not happen: ${anotherSettingKey}`);
}

const allowRulePolicy: RulePolicy = RULE_POLICIES_MAP.ALLOW;

// @ts-expect-error Testing invalid value
const wrongRulePolicy: RulePolicy = "deny"; // This should show a type error

const dependencyNodeKey: DependencyNodeKey = DEPENDENCY_NODE_KEYS_MAP.EXPORT;

const debugOptions: DebugSetting = {
  enabled: true,
  messages: {
    files: true,
    dependencies: true,
    violations: true,
  },
  filter: {
    files: [{ categories: "components" }],
  },
};

if (!isRulePolicy(wrongRulePolicy)) {
  throw new Error();
}

export const boundariesLegacyConfig = createConfig(
  {
    settings: {
      ...recommendedBoundariesConfig.settings,
      [settingKey]: [
        {
          type: "internal",
          pattern: "src/internal/**",
          mode: ELEMENT_DESCRIPTOR_MODES_MAP.FOLDER,
        },
      ],
      [anotherSettingKey]: "some-value",
      [SETTINGS_KEYS_MAP.DEPENDENCY_NODES]: ["import", dependencyNodeKey],
      [SETTINGS_KEYS_MAP.FLAG_AS_EXTERNAL]: {
        inNodeModules: true,
        outsideRootPath: false,
        unresolvableAlias: true,
        customSourcePatterns: ["custom/**"],
      },
      [SETTINGS_KEYS_MAP.DEBUG]: debugOptions,
    },
    rules: {
      [RULE_NAMES_MAP.ELEMENT_TYPES]: [
        2,
        {
          default: allowRulePolicy,
          rules: [
            {
              from: ["internal", "external"],
              importKind: DEPENDENCY_KINDS_MAP.TYPE,
            },
            {
              from: [{ type: "components" }],
              dependency: {
                kind: DEPENDENCY_KINDS_MAP.TYPE,
              },
              to: { internalPath: "foo" },
              allow: {
                from: [{ type: "utils" }],
                to: [{ internalPath: "foo" }],
                dependency: {
                  relationship: {
                    from: ["parent"],
                    // NOTE: Micromatch patterns are allowed
                    to: ["foo"],
                  },
                  nodeKind: "Foo",
                  kind: ["type"],
                },
              },
              disallow: {
                from: [{ type: "utils" }],
                to: [{ internalPath: "bar" }],
                dependency: [
                  {
                    kind: "type",
                  },
                ],
              },
            },
          ],
        },
      ],
      [RULE_NAMES_MAP.EXTERNAL]: 2,
      [`foo/${RULE_SHORT_NAMES_MAP.NO_PRIVATE}` as const]: 2,
    },
  },
  "foo"
);

export const boundariesConfig = createConfig(
  {
    settings: {
      ...recommendedBoundariesConfig.settings,
      [settingKey]: [
        {
          type: "internal",
          pattern: "src/internal/**",
          mode: ELEMENT_DESCRIPTOR_MODES_MAP.FOLDER,
        },
      ],
      [anotherSettingKey]: "some-value",
      [SETTINGS_KEYS_MAP.DEPENDENCY_NODES]: ["import", dependencyNodeKey],
      [SETTINGS_KEYS_MAP.FLAG_AS_EXTERNAL]: {
        inNodeModules: true,
        outsideRootPath: false,
        unresolvableAlias: true,
        customSourcePatterns: ["custom/**"],
      },
      [SETTINGS_KEYS_MAP.DEBUG]: debugOptions,
    },
    rules: {
      [RULE_NAMES_MAP.DEPENDENCIES]: [
        2,
        {
          default: allowRulePolicy,
          rules: [
            {
              from: ["internal", "external"],
              importKind: DEPENDENCY_KINDS_MAP.TYPE,
            },
            {
              from: [{ type: "components" }],
              dependency: {
                kind: DEPENDENCY_KINDS_MAP.TYPE,
              },
              to: { internalPath: "foo" },
              allow: {
                from: [{ type: "utils" }],
                to: [{ internalPath: "foo" }],
                dependency: {
                  relationship: {
                    from: ["parent"],
                    // NOTE: Micromatch patterns are allowed
                    to: ["foo"],
                  },
                  nodeKind: "Foo",
                  kind: ["type"],
                },
              },
              disallow: {
                from: [{ type: "utils" }],
                to: [{ internalPath: "bar" }],
                dependency: [
                  {
                    kind: "type",
                  },
                ],
              },
            },
          ],
        },
      ],
      [RULE_NAMES_MAP.EXTERNAL]: 2,
      [`foo/${RULE_SHORT_NAMES_MAP.NO_PRIVATE}` as const]: 2,
    },
  },
  "foo"
);
