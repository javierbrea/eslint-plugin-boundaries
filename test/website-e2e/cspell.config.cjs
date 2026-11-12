// eslint-disable-next-line import/extensions
const { createConfig } = require("../../support/cspell-config/index.js");

module.exports = createConfig({
  // `weberror` is the Playwright event of an uncaught exception in a page of a browser context, and `npmjs` is the host of the npm download stats
  words: ["npmjs", "viewports", "weberror"],
  ignorePaths: ["**/test-results/**"],
});
