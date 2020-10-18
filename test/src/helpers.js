const path = require("path");
const RuleTester = require("eslint").RuleTester;

const relativeFilePath = (relativePath) => {
  console.log("Relative", path.join("test", "fixtures", relativePath));
  return path.join("test", "fixtures", relativePath);
};

const absoluteFilePath = (relativePath) => {
  console.log("Absolute", path.resolve(process.cwd(), relativeFilePath(relativePath)));
  return path.resolve(process.cwd(), relativeFilePath(relativePath));
};

const settings = {
  "boundaries/types": ["components", "modules", "helpers"],
  "boundaries/alias": {
    helpers: relativeFilePath("src/helpers"),
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
