import config, {
  createFixedWaitConfig,
  typescriptConfig,
} from "../../support/eslint-config/index.js";

// A spec reaches the page only through page objects, which the components own: a change in the DOM of a component updates its page objects and no spec
const PAGE_OBJECT_MESSAGE =
  "A spec holds no locator or selector: query and act through a page object, which the component owns.";

// The methods of a Playwright page that take a selector or return a locator, a frame or a handle. The `Locator` itself is never in a spec, since a page object hands out none
const PAGE_SELECTOR_METHODS = [
  "locator",
  "getBy\\w+",
  "frameLocator",
  "frame",
  "frames",
  "mainFrame",
  "\\$\\$?",
  "\\$\\$?eval",
  "check",
  "uncheck",
  "setChecked",
  "click",
  "dblclick",
  "tap",
  "hover",
  "focus",
  "fill",
  "press",
  "type",
  "selectOption",
  "setInputFiles",
  "dragAndDrop",
  "dispatchEvent",
  "getAttribute",
  "innerHTML",
  "innerText",
  "inputValue",
  "textContent",
  "isChecked",
  "isDisabled",
  "isEditable",
  "isEnabled",
  "isHidden",
  "isVisible",
  "waitForSelector",
];

// A Playwright page is the `page` fixture, a page that a spec opens, or a member of that name. The match is by name, so that a page object, whose methods may share these names, is never flagged: name a page object after the component, such as `playgroundPage`, and a variable that holds a page `page` or `somethingPage`
const PAGE = "/^(page|popup|\\w*Page)$/";
const METHOD = `/^(${PAGE_SELECTOR_METHODS.join("|")})$/`;

const SPEC_RESTRICTED_SYNTAX = [
  `CallExpression[callee.object.name=${PAGE}][callee.property.name=${METHOD}]`,
  `CallExpression[callee.object.property.name=${PAGE}][callee.property.name=${METHOD}]`,
  `VariableDeclarator[init.name=${PAGE}] > ObjectPattern > Property[key.name=${METHOD}]`,
  "CallExpression[callee.property.name=/^querySelector(All)?$/]",
].map((selector) => ({ selector, message: PAGE_OBJECT_MESSAGE }));

export default [
  ...config,
  typescriptConfig,
  // No file of the project waits with a fixed wait, on a selector or on the network
  createFixedWaitConfig(["**/*.{js,cjs,mjs,ts}"]),
  // A later config replaces the options of a rule, so the specs repeat the guard above with the page methods added
  createFixedWaitConfig(["test/**/*.spec.ts"], SPEC_RESTRICTED_SYNTAX),
  {
    ignores: ["test-results/**"],
  },
];
