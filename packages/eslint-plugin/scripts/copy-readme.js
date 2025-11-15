const fs = require("node:fs");
const path = require("node:path");

const sourcePath = path.resolve(__dirname, "../../../README.md");
const destinationPath = path.resolve(__dirname, "../README.md");

fs.copyFileSync(sourcePath, destinationPath);
