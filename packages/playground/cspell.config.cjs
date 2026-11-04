// eslint-disable-next-line import/extensions
const { createConfig } = require("../../support/cspell-config/index.js");

module.exports = createConfig({
  // Names of the libraries the playground uses, and the words of their APIs
  words: ["keymap", "momoa", "noreferrer"],
});
