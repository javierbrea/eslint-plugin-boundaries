import type {
  ElementDescriptors,
  IgnoreSetting,
  ElementTypesRule,
  ElementTypesRuleOptions,
  Config,
  Settings,
  Rules,
  ElementDescriptor,
  ElementSelector,
  ElementSelectors,
  AliasSetting,
} from "eslint-plugin-boundaries";

const moduleElementDescriptor: ElementDescriptor = {
  type: "module",
  pattern: "src/modules/*",
  capture: ["module"],
};

const elementsMapping: ElementDescriptors = [
  moduleElementDescriptor,
  {
    type: "component",
    pattern: "src/components/*",
    capture: ["component"],
  },
];

const ignoreSetting: IgnoreSetting = ["**/ignored/**/*.js"];

const allowComponentsFromModules: ElementTypesRule = {
  from: "module",
  allow: ["component"],
};

const componentToComponentRuleAllowMatcher: ElementSelector = [
  "component",
  { name: "foo" },
];

const componentToComponentRuleElementSelectors: ElementSelectors = [
  "component",
  componentToComponentRuleAllowMatcher,
];

const elementTypesRuleOptions: ElementTypesRuleOptions = {
  default: "disallow",
  rules: [
    allowComponentsFromModules,
    {
      from: "component",
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
  "boundaries/element-types": ["error", elementTypesRuleOptions],
  // @ts-expect-error Testing that the rule is not valid for the plugin
  "foo/bar": "off", // This rule should be ignored by the plugin
};

const boundariesConfiguration: Config = {
  files: ["**/*.js", "**/*.ts"],
  settings: boundariesSettings,
  rules: boundariesRules,
};

export default boundariesConfiguration;
