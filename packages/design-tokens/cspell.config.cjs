// eslint-disable-next-line import/extensions
const { createConfig } = require("../../support/cspell-config/index.js");

module.exports = createConfig({
  // The fallback typefaces of the font tokens
  words: ["Avenir"],
  ignorePaths: ["static/fonts/LICENSE-*.txt"],
});
