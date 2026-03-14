const { createConfig } = require("../../support/cspell-config/index.js");

module.exports = createConfig({
  ignorePaths: ["**/test/fixtures/performance/**"],
});
