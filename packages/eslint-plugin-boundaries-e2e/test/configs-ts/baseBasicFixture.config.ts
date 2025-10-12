import type {
  ElementMappings,
  IgnoreSetting,
  ElementTypesRule,
  ElementTypesRuleOptions,
  Config,
  Settings,
  Rules,
  ElementMapping,
  ElementMatcher,
  ElementMatchers,
  AliasSetting,
} from "eslint-plugin-boundaries";

const moduleElementMapping: ElementMapping = {
  type: "module",
  pattern: "src/modules/*",
  capture: ["module"],
};

const elementsMapping: ElementMappings = [
  moduleElementMapping,
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

const componentToComponentRuleAllowMatcher: ElementMatcher = [
  "component",
  { name: "foo" },
];

const componentToComponentRuleElementMatchers: ElementMatchers = [
  "component",
  componentToComponentRuleAllowMatcher,
];

const elementTypesRuleOptions: ElementTypesRuleOptions = {
  default: "disallow",
  rules: [
    allowComponentsFromModules,
    {
      from: "component",
      allow: componentToComponentRuleElementMatchers,
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
