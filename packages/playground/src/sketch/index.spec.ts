import {
  CONFIG_PATH,
  addNode,
  buildTree,
  fromText,
  getFiles,
  getName,
  getParentPath,
  getPathError,
  getUniquePath,
  hasNode,
  isSameOrInside,
  movePath,
  normalizePath,
  removeNode,
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
    ["fromText", fromText],
    ["getFiles", getFiles],
    ["getName", getName],
    ["getParentPath", getParentPath],
    ["getPathError", getPathError],
    ["getUniquePath", getUniquePath],
    ["hasNode", hasNode],
    ["isSameOrInside", isSameOrInside],
    ["movePath", movePath],
    ["normalizePath", normalizePath],
    ["removeNode", removeNode],
    ["renameNode", renameNode],
    ["setConfig", setConfig],
    ["toText", toText],
  ])("should export %s as a function", (_name, exported) => {
    // Assert
    expect(typeof exported).toBe("function");
  });
});
