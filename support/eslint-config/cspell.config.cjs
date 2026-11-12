// eslint-disable-next-line import/extensions
const { createConfig } = require("../cspell-config/index.js");

module.exports = createConfig({
  // The Playwright load state that the fixed-wait guard forbids
  words: ["networkidle"],
});
