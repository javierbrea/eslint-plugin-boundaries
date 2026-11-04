import type { Sketch } from "../../contract";

import { getFolderIds, getProjectItems } from "./ProjectItems";

const SKETCH: Sketch = {
  config: "{}",
  tree: [
    { path: "src/components/Button.js", kind: "file" },
    { path: "src/index.js", kind: "file" },
    { path: "docs", kind: "folder" },
    { path: "index.js", kind: "file" },
  ],
  dependencies: [],
};

describe("ProjectItems", () => {
  describe("getProjectItems", () => {
    it("should put the config node first, with its path as its id", () => {
      // Act
      const [config] = getProjectItems(SKETCH);

      // Assert
      expect(config).toEqual({
        id: "eslint.config.js",
        name: "eslint.config.js",
        label: "eslint.config.js",
        kind: "config",
        children: [],
      });
    });

    it("should follow with the tree: folders first, with a slash after their name, then files", () => {
      // Act
      const items = getProjectItems(SKETCH).slice(1);

      // Assert
      expect(items.map((item) => [item.id, item.label, item.kind])).toEqual([
        ["docs", "docs/", "folder"],
        ["src", "src/", "folder"],
        ["index.js", "index.js", "file"],
      ]);
    });

    it("should nest the children of a folder, with their own path as id and their name", () => {
      // Act
      const src = getProjectItems(SKETCH)[2];

      // Assert
      expect(src.children.map((child) => [child.id, child.name])).toEqual([
        ["src/components", "components"],
        ["src/index.js", "index.js"],
      ]);
      expect(src.children[0].children[0].id).toBe("src/components/Button.js");
    });
  });

  describe("getFolderIds", () => {
    it("should list the folders at any depth, and not the files or the config", () => {
      // Act
      const folders = getFolderIds(getProjectItems(SKETCH));

      // Assert
      expect(folders).toEqual(["docs", "src", "src/components"]);
    });
  });
});
