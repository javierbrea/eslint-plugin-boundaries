import { getMenuGroups } from "./projectMenu";

describe("projectMenu", () => {
  describe("getMenuGroups", () => {
    it.each([
      ["file", "src/index.js"],
      ["folder", "src"],
    ] as const)(
      "should offer to add a file or a folder, then to rename or remove the node, on a %s",
      (kind, path) => {
        // Act
        const groups = getMenuGroups({ kind, path });

        // Assert
        expect(groups).toEqual([
          ["add-file", "add-folder"],
          ["rename", "delete"],
        ]);
      }
    );

    it("should only offer to add a file or a folder on the root, which can be neither renamed nor removed", () => {
      // Act
      const groups = getMenuGroups({ kind: "folder", path: "" });

      // Assert
      expect(groups).toEqual([["add-file", "add-folder"]]);
    });
  });
});
