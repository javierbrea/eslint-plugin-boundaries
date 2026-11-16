// eslint-disable-next-line import/extensions
const { createConfig } = require("../../support/cspell-config/index.js");

module.exports = createConfig({
  // `weberror` is the Playwright event of an uncaught exception in a page of a browser context, `npmjs` is the host of the npm download stats, and `googletagmanager` and `gtag` are the host and the function of Google Analytics, which the consent spec checks
  words: ["googletagmanager", "gtag", "npmjs", "viewports", "weberror"],
  ignorePaths: ["**/test-results/**"],
});
