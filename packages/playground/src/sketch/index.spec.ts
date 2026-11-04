import {
  CONFIG_PATH,
  addNode,
  buildTree,
  countFilesUnder,
  fromText,
  getFiles,
  getName,
  getParentPath,
  getPathError,
  getUniquePath,
  hasNode,
  isSameOrInside,
  isSameProject,
  movePath,
  normalizePath,
  readTextProblems,
  removeNode,
  renameInFolder,
  renameNode,
  setConfig,
  toText,
} from "./index";

describe("sketch", () => {
  it("should export the config path", () => {
    // Assert
    expect(CONFIG_PATH).toBe("eslint.config.js");
  });

  it.each([
    ["addNode", addNode],
    ["buildTree", buildTree],
    ["countFilesUnder", countFilesUnder],
    ["fromText", fromText],
    ["getFiles", getFiles],
    ["getName", getName],
    ["getParentPath", getParentPath],
    ["getPathError", getPathError],
    ["getUniquePath", getUniquePath],
    ["hasNode", hasNode],
    ["isSameOrInside", isSameOrInside],
    ["isSameProject", isSameProject],
    ["movePath", movePath],
    ["normalizePath", normalizePath],
    ["readTextProblems", readTextProblems],
    ["removeNode", removeNode],
    ["renameInFolder", renameInFolder],
    ["renameNode", renameNode],
    ["setConfig", setConfig],
    ["toText", toText],
  ])("should export %s as a function", (_name, exported) => {
    // Assert
    expect(typeof exported).toBe("function");
  });
});
