import {
  getAncestors,
  getName,
  getParentPath,
  getPathError,
  isSameOrInside,
  joinPath,
  movePath,
  normalizePath,
} from "./paths";
import { CONFIG_PATH } from "./sketch.constants";

describe("Paths", () => {
  describe("cONFIG_PATH", () => {
    it("should be the config file at the root", () => {
      // Assert
      expect(CONFIG_PATH).toBe("eslint.config.js");
    });
  });

  describe("normalizePath", () => {
    it("should return a clean path as it is", () => {
      // Act
      const result = normalizePath("src/index.js");

      // Assert
      expect(result).toEqual({ path: "src/index.js", isFolder: false });
    });

    it("should trim the input", () => {
      // Act
      const result = normalizePath("  src/index.js \t");

      // Assert
      expect(result).toEqual({ path: "src/index.js", isFolder: false });
    });

    it("should turn backslashes into slashes", () => {
      // Act
      const result = normalizePath("src\\components\\Price.js");

      // Assert
      expect(result).toEqual({
        path: "src/components/Price.js",
        isFolder: false,
      });
    });

    it("should collapse repeated slashes", () => {
      // Act
      const result = normalizePath("src///components//Price.js");

      // Assert
      expect(result).toEqual({
        path: "src/components/Price.js",
        isFolder: false,
      });
    });

    it.each([
      "./src/index.js",
      "/src/index.js",
      "././src/index.js",
      ".//src/index.js",
    ])("should drop the leading %s", (input) => {
      // Act
      const result = normalizePath(input);

      // Assert
      expect(result).toEqual({ path: "src/index.js", isFolder: false });
    });

    it("should return a trailing slash apart as a folder", () => {
      // Act
      const result = normalizePath("src/components/");

      // Assert
      expect(result).toEqual({ path: "src/components", isFolder: true });
    });

    it("should collapse repeated trailing slashes into one", () => {
      // Act
      const result = normalizePath("src//");

      // Assert
      expect(result).toEqual({ path: "src", isFolder: true });
    });

    it("should keep a dot that does not start a segment of dots", () => {
      // Act
      const result = normalizePath(".github/workflows/");

      // Assert
      expect(result).toEqual({ path: ".github/workflows", isFolder: true });
    });

    it("should keep `..` segments, for getPathError to refuse them", () => {
      // Act
      const result = normalizePath("../src/index.js");

      // Assert
      expect(result).toEqual({ path: "../src/index.js", isFolder: false });
    });

    it.each(["", "   ", "/", "./"])(
      "should return an empty path for %p",
      (input) => {
        // Act
        const { path } = normalizePath(input);

        // Assert
        expect(path).toBe("");
      }
    );
  });

  describe("getPathError", () => {
    it.each([
      "index.js",
      "src/index.js",
      "src/components/Price/index.js",
      ".github/workflows",
      "src/my file.js",
      "src/eslint.config.js",
      "src/...",
    ])("should return undefined for the valid path %s", (path) => {
      // Act
      const error = getPathError(path);

      // Assert
      expect(error).toBeUndefined();
    });

    it("should refuse an empty path", () => {
      // Act
      const error = getPathError("");

      // Assert
      expect(error).toBe("The path is empty.");
    });

    it.each(["/src", "src/", "src//index.js"])(
      "should refuse the empty segment of %p",
      (path) => {
        // Act
        const error = getPathError(path);

        // Assert
        expect(error).toBe("The path has an empty segment.");
      }
    );

    it.each([".", "..", "src/.", "src/../index.js", "./src"])(
      "should refuse the dot segment of %p",
      (path) => {
        // Act
        const error = getPathError(path);

        // Assert
        expect(error).toBe("The path cannot have `.` or `..` segments.");
      }
    );

    it.each([
      ["a tab", "src/a\tb.js"],
      ["a null character", "src/a\u0000b.js"],
      ["a delete character", "src/a\u007Fb.js"],
      ["a line break", "src/a\nb.js"],
    ])("should refuse a path with %s", (_name, path) => {
      // Act
      const error = getPathError(path);

      // Assert
      expect(error).toBe("The path cannot have control characters.");
    });

    it.each([
      ["a double quote", 'src/say"hi".js'],
      ["a single quote", "src/it's.js"],
      ["a backslash", "src\\index.js"],
    ])("should refuse a path with %s", (_name, path) => {
      // Act
      const error = getPathError(path);

      // Assert
      expect(error).toBe("A path cannot have quotes or backslashes.");
    });

    it("should accept characters above the control range", () => {
      // Act
      const error = getPathError("src/\u0080-é-\u{1F600}.js");

      // Assert
      expect(error).toBeUndefined();
    });

    it("should refuse the config file at the root", () => {
      // Act
      const error = getPathError("eslint.config.js");

      // Assert
      expect(error).toBe(
        "eslint.config.js at the root is the config node, not a file or a folder."
      );
    });

    it("should refuse a path under the config file at the root", () => {
      // Act
      const error = getPathError("eslint.config.js/index.js");

      // Assert
      expect(error).toBe(
        "eslint.config.js at the root is the config node, not a file or a folder."
      );
    });

    it("should accept the config file and a path under it out of the root", () => {
      // Act
      const errors = [
        getPathError("src/eslint.config.js"),
        getPathError("src/eslint.config.js/index.js"),
      ];

      // Assert
      expect(errors).toEqual([undefined, undefined]);
    });
  });

  describe("getParentPath", () => {
    it("should return the folder of a nested path", () => {
      // Act
      const folder = getParentPath("src/components/Price.js");

      // Assert
      expect(folder).toBe("src/components");
    });

    it("should return an empty string for a path at the root", () => {
      // Act
      const folder = getParentPath("src");

      // Assert
      expect(folder).toBe("");
    });
  });

  describe("getName", () => {
    it("should return the last segment of a nested path", () => {
      // Act
      const lastSegment = getName("src/components/Price.js");

      // Assert
      expect(lastSegment).toBe("Price.js");
    });

    it("should return the whole path at the root", () => {
      // Act
      const lastSegment = getName("src");

      // Assert
      expect(lastSegment).toBe("src");
    });
  });

  describe("joinPath", () => {
    it("should join a folder and a name", () => {
      // Act
      const path = joinPath("src/components", "Price.js");

      // Assert
      expect(path).toBe("src/components/Price.js");
    });

    it("should return the name for the root", () => {
      // Act
      const path = joinPath("", "src");

      // Assert
      expect(path).toBe("src");
    });
  });

  describe("getAncestors", () => {
    it("should return the folders above a path, from the root down", () => {
      // Act
      const ancestors = getAncestors("a/b/c.js");

      // Assert
      expect(ancestors).toEqual(["a", "a/b"]);
    });

    it("should return nothing for a path at the root", () => {
      // Act
      const ancestors = getAncestors("a");

      // Assert
      expect(ancestors).toEqual([]);
    });
  });

  describe("isSameOrInside", () => {
    it("should be true for the same path", () => {
      // Act
      const result = isSameOrInside("src/a", "src/a");

      // Assert
      expect(result).toBe(true);
    });

    it("should be true for a path inside the folder", () => {
      // Act
      const result = isSameOrInside("src/a/b.js", "src/a");

      // Assert
      expect(result).toBe(true);
    });

    it("should be false for a sibling that starts with the same text", () => {
      // Act
      const result = isSameOrInside("src/ab/c.js", "src/a");

      // Assert
      expect(result).toBe(false);
    });
  });

  describe("movePath", () => {
    it("should move the path of the node that moves", () => {
      // Act
      const result = movePath("src", "src", "lib");

      // Assert
      expect(result).toBe("lib");
    });

    it("should move a path inside the folder that moves, keeping the rest of it", () => {
      // Act
      const result = movePath("src/a/b.js", "src", "lib/core");

      // Assert
      expect(result).toBe("lib/core/a/b.js");
    });

    it("should leave a sibling that starts with the same text", () => {
      // Act
      const result = movePath("src-old/a.js", "src", "lib");

      // Assert
      expect(result).toBe("src-old/a.js");
    });
  });
});
