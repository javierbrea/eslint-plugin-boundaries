import type {
  ElementDescriptors,
  IgnoreSetting,
  DependenciesRule,
  DependenciesRuleOptions,
  Config,
  Settings,
  Rules,
  ElementDescriptor,
  ElementSelectorWithOptions,
  AliasSetting,
} from "@boundaries/eslint-plugin";

const moduleElementDescriptor: ElementDescriptor = {
  type: "module",
  pattern: "src/modules/*",
  capture: ["module"],
};

const elementsMapping: ElementDescriptors = [
  moduleElementDescriptor,
  {
    type: "component",
    category: "ui",
    pattern: "src/components/*",
    capture: ["component"],
  },
];

const ignoreSetting: IgnoreSetting = ["**/ignored/**/*.js"];

const allowComponentsFromModules: DependenciesRule = {
  from: { type: "module" },
  allow: [{ to: { type: "component" } }],
};

const componentToComponentRuleAllowMatcher: ElementSelectorWithOptions = [
  "component",
  { name: "foo" },
];

const componentToComponentRuleElementSelectors = [
  "component",
  componentToComponentRuleAllowMatcher,
];

const dependenciesRuleOptions: DependenciesRuleOptions = {
  default: "disallow",
  rules: [
    allowComponentsFromModules,
    {
      from: {
        type: "component",
      },
      allow: componentToComponentRuleElementSelectors,
    },
  ],
};

const deprecatedAliasSetting: AliasSetting = {
  "@modules": "./src/modules",
  "@components": "./src/components",
};

const boundariesSettings: Settings = {
  "boundaries/elements": elementsMapping,
  "boundaries/ignore": ignoreSetting,
  "boundaries/alias": deprecatedAliasSetting,
  // @ts-expect-error Testing that the setting is not valid for the plugin
  "foo/bar": "baz", // This setting should be ignored by the plugin
};

const boundariesRules: Rules = {
  "boundaries/dependencies": ["error", dependenciesRuleOptions],
  // @ts-expect-error Testing that the rule is not valid for the plugin
  "foo/bar": "off", // This rule should be ignored by the plugin
};

const boundariesConfiguration: Config = {
  files: ["**/*.js", "**/*.ts"],
  settings: boundariesSettings,
  rules: boundariesRules,
};

export default boundariesConfiguration;
