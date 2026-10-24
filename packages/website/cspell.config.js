// eslint-disable-next-line import/extensions
const { createConfig } = require("../../support/cspell-config/index.js");

module.exports = createConfig({
  words: [
    "Avenir",
    "blockquotes",
    "fontsource",
    "networkidle",
    "nums",
    "Sora",
    "sublabel",
    "viewports",
    "woff",
  ],
  ignorePaths: ["static/fonts/LICENSE-*.txt"],
});
