// eslint-disable-next-line import/extensions
const { createConfig } = require("../../support/cspell-config/index.js");

module.exports = createConfig({
  // Names of the libraries the playground uses, and the words of their APIs
  words: [
    "describedby",
    "dontMock",
    "fflate",
    "haspopup",
    "keymap",
    "keyshortcuts",
    "labelledby",
    "menuitemradio",
    "momoa",
    "noreferrer",
  ],
  // Misspelled on purpose in the tests of the problems panel: the mockup's config problem is a typo of `disallow`
  ignoreWords: ["dissallow"],
});
