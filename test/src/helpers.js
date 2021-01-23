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
        match: "exact",
        pattern: "*/main.js",
      },
      {
        type: "app",
        match: "exact",
        pattern: "*/app.module.js",
      },
      {
        type: "module",
        pattern: "**/*/*.module.js",
        match: "exact",
        capture: ["base", "feature", "fileName"],
      },
      {
        type: "controller",
        pattern: "**/*/*.controller.js",
        match: "exact",
        capture: ["base", "feature", "fileName"],
      },
      {
        type: "service",
        pattern: "**/*/*.service.js",
        match: "exact",
        capture: ["base", "feature", "fileName"],
      },
      {
        type: "interceptor",
        pattern: "**/*/interceptors/*.interceptor.js",
        match: "exact",
        capture: ["base", "feature", "fileName"],
      },
      {
        type: "interface",
        pattern: "**/*/interfaces/*.interface.js",
        match: "exact",
        capture: ["base", "feature", "fileName"],
      },
      {
        type: "dto",
        pattern: "**/*/dto/*.dto.js",
        match: "exact",
        capture: ["base", "feature", "fileName"],
      },
      {
        type: "common",
        pattern: "**/common/*/*.*.js",
        match: "exact",
        capture: ["base", "category", "fileName"],
      },
    ],
    "import/resolver": {
      "eslint-import-resolver-node": {},
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
