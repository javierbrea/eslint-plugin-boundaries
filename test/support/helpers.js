const path = require("path");
const RuleTester = require("eslint").RuleTester;

const codeFilePath = (basePath, relativePath) => {
  return ["test", "fixtures", basePath, relativePath].join("/");
};

const relativeFilePath = (basePath, relativePath) => {
  return path.join("test", "fixtures", basePath, relativePath);
};

const absoluteFilePath = (basePath, relativePath) => {
  return path.resolve(process.cwd(), relativeFilePath(basePath, relativePath));
};

const SETTINGS = {
  deprecated: {
    "boundaries/types": ["components", "modules", "helpers"],
    "boundaries/alias": {
      helpers: codeFilePath("one-level", "helpers"),
      components: codeFilePath("one-level", "components"),
      modules: codeFilePath("one-level", "modules"),
    },
    "import/resolver": {
      "eslint-import-resolver-node": {},
      [path.resolve(process.cwd(), "resolver-legacy-alias")]: {
        helpers: `./${codeFilePath("one-level", "helpers")}`,
        components: `./${codeFilePath("one-level", "components")}`,
        modules: `./${codeFilePath("one-level", "modules")}`,
      },
    },
  },
  oneLevel: {
    "boundaries/elements": [
      {
        type: "helpers",
        pattern: "helpers/*",
        capture: ["elementName"],
      },
      {
        type: "components",
        pattern: "components/*",
        capture: ["elementName"],
      },
      {
        type: "modules",
        pattern: "modules/*",
        capture: ["elementName"],
      },
    ],
    "import/resolver": {
      "eslint-import-resolver-node": {},
      [path.resolve(process.cwd(), "resolver-legacy-alias")]: {
        helpers: `./${codeFilePath("one-level", "helpers")}`,
        components: `./${codeFilePath("one-level", "components")}`,
        modules: `./${codeFilePath("one-level", "modules")}`,
      },
    },
  },
  twoLevels: {
    "boundaries/elements": [
      {
        type: "helpers",
        pattern: "helpers/*",
        capture: ["elementName"],
      },
      {
        type: "components",
        pattern: "components/*/*",
        capture: ["category", "elementName"],
      },
      {
        type: "modules",
        pattern: "modules/*/*",
        capture: ["domain", "elementName"],
      },
    ],
    "import/resolver": {
      "eslint-import-resolver-node": {},
      [path.resolve(process.cwd(), "resolver-legacy-alias")]: {
        helpers: `./${codeFilePath("two-levels", "helpers")}`,
        components: `./${codeFilePath("two-levels", "components")}`,
        modules: `./${codeFilePath("two-levels", "modules")}`,
      },
    },
  },
  twoLevelsWithPrivate: {
    "boundaries/elements": [
      {
        type: "helpers",
        pattern: "helpers/*",
        capture: ["elementName"],
      },
      {
        type: "components",
        pattern: "components/*/*",
        capture: ["category", "elementName"],
      },
      // Trying to capture a left-side folder produces subelements to be wrongly recognized,
      // as the pattern match with the parent element
      // a workaround is to define a different pattern for each subelement level
      {
        type: "modules",
        pattern: "modules/*/**/submodules/**/submodules/*",
        capture: ["domain", "ancestorsPaths", "ancestorSubmodules", "elementName"],
      },
      {
        type: "modules",
        pattern: "modules/*/**/submodules/*",
        capture: ["domain", "ancestorsPaths", "elementName"],
      },
      {
        type: "modules",
        pattern: "modules/*/*",
        capture: ["domain", "elementName"],
      },
    ],
    "import/resolver": {
      "eslint-import-resolver-node": {},
      [path.resolve(process.cwd(), "resolver-legacy-alias")]: {
        helpers: `./${codeFilePath("two-levels-with-private", "helpers")}`,
        components: `./${codeFilePath("two-levels-with-private", "components")}`,
        modules: `./${codeFilePath("two-levels-with-private", "modules")}`,
      },
    },
  },
  nestjsExample: {
    "boundaries/elements": [
      {
        type: "main",
        mode: "file",
        pattern: "*/main.js",
      },
      {
        type: "app",
        mode: "file",
        pattern: "*/app.module.js",
      },
      {
        type: "module",
        pattern: "**/*/*.module.js",
        mode: "file",
        capture: ["base", "feature", "fileName"],
      },
      {
        type: "controller",
        pattern: "**/*/*.controller.js",
        mode: "file",
        capture: ["base", "feature", "fileName"],
      },
      {
        type: "service",
        pattern: "**/*/*.service.js",
        mode: "file",
        capture: ["base", "feature", "fileName"],
      },
      {
        type: "interceptor",
        pattern: "**/*/interceptors/*.interceptor.js",
        mode: "file",
        capture: ["base", "feature", "fileName"],
      },
      {
        type: "interface",
        pattern: "**/*/interfaces/*.interface.js",
        mode: "file",
        capture: ["base", "feature", "fileName"],
      },
      {
        type: "dto",
        pattern: "**/*/dto/*.dto.js",
        mode: "file",
        capture: ["base", "feature", "fileName"],
      },
      {
        type: "common",
        pattern: "**/common/*/*.*.js",
        mode: "file",
        capture: ["base", "category", "fileName"],
      },
    ],
    "import/resolver": {
      "eslint-import-resolver-node": {},
    },
  },
  docsExamples: {
    "boundaries/elements": [
      {
        type: "helpers",
        pattern: "helpers/*/*.js",
        mode: "file",
        capture: ["category", "elementName"],
      },
      {
        type: "components",
        pattern: "components/*/*",
        mode: "folder",
        capture: ["family", "elementName"],
      },
      {
        type: "modules",
        pattern: "modules/*",
        mode: "folder",
        capture: ["elementName"],
      },
    ],
    "import/resolver": {
      "eslint-import-resolver-node": {},
      [path.resolve(process.cwd(), "resolver-legacy-alias")]: {
        helpers: `./${codeFilePath("docs-examples", "helpers")}`,
        components: `./${codeFilePath("docs-examples", "components")}`,
        modules: `./${codeFilePath("docs-examples", "modules")}`,
      },
    },
  },
};

const createRuleTester = (settings) => {
  const ruleTester = new RuleTester({
    parserOptions: { ecmaVersion: 2015, sourceType: "module" },
    settings,
  });

  return ruleTester;
};

const pathResolvers = (basePath) => {
  return {
    codeFilePath: (relativePath) => codeFilePath(basePath, relativePath),
    relativeFilePath: (relativePath) => relativeFilePath(basePath, relativePath),
    absoluteFilePath: (relativePath) => absoluteFilePath(basePath, relativePath),
  };
};

module.exports = {
  SETTINGS,
  createRuleTester,
  pathResolvers,
};
