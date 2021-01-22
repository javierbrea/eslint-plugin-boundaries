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
