// eslint-disable-next-line import/extensions
const { createConfig } = require("./support/cspell-config/index.js");

module.exports = createConfig({
  // The Playwright load state that the agent rule of the page objects forbids
  words: ["networkidle"],
});
