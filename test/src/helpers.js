const path = require("path");
const RuleTester = require("eslint").RuleTester;

const relativeFilePath = (relativePath) => path.join("test", "fixtures", relativePath);

const absoluteFilePath = (relativePath) =>
  path.resolve(process.cwd(), path.join("test", "fixtures", relativePath));

const settings = {
  "boundaries/types": ["components", "modules", "helpers"],
  "boundaries/alias": {
    components: relativeFilePath("src/components"),
    modules: relativeFilePath("src/modules"),
  },
};

const createRuleTester = (extendSettings) => {
  const ruleTester = new RuleTester({
    parserOptions: { ecmaVersion: 2015, sourceType: "module" },
    settings: {
      ...settings,
      ...extendSettings,
    },
  });

  return ruleTester;
};

module.exports = {
  createRuleTester,
  absoluteFilePath,
  relativeFilePath,
};
