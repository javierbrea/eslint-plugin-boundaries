// eslint-disable-next-line import/extensions
const { createConfig } = require("../../support/cspell-config/index.js");

module.exports = createConfig({
  words: [
    "Avenir",
    "fontsource",
    "networkidle",
    "nums",
    "Sora",
    "viewports",
    "woff",
  ],
  ignorePaths: ["static/fonts/LICENSE-*.txt"],
});
