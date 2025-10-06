const fs = require("fs");
const path = require("path");

const sourcePath = path.resolve(__dirname, "../../../README.md");
const destinationPath = path.resolve(__dirname, "../README.md");

fs.copyFileSync(sourcePath, destinationPath);
