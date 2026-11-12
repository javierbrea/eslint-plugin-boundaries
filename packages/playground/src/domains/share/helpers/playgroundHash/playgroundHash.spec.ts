import { QUICK_START_EXAMPLE } from "@/domains/examples/data/examples";
import { toText } from "@/domains/project/helpers/sketch";
import { decodeHash, encodeSketch } from "@/domains/share/helpers/sketchHash";

import { getPlaygroundHash } from "./playgroundHash";

const CONFIG = "{ settings: {}, rules: {} }\n";

describe("playgroundHash", () => {
  describe("getPlaygroundHash", () => {
    it("should make the hash of the Quick start example from its text, the same as encoding the sketch", () => {
      // Arrange
      const { sketch } = QUICK_START_EXAMPLE;
      const project = toText(sketch);

      // Act
      const hash = getPlaygroundHash({ config: sketch.config, project });

      // Assert
      expect(hash).toBe(encodeSketch(sketch));
    });

    it("should make a hash that opens the project that the text writes, with the config as given", () => {
      // Arrange
      const project = [
        "src/",
        "src/a.js",
        '  import { b } from "./b.js";',
        '  import React from "react";',
        "src/b.js",
        "docs/",
        "",
      ].join("\n");

      // Act
      const reading = decodeHash(
        getPlaygroundHash({ config: CONFIG, project })
      );

      // Assert
      expect(reading).toStrictEqual({
        status: "sketch",
        sketch: {
          config: CONFIG,
          tree: [
            { path: "docs", kind: "folder" },
            { path: "src/a.js", kind: "file" },
            { path: "src/b.js", kind: "file" },
          ],
          dependencies: [
            {
              from: "src/a.js",
              target: { kind: "node", path: "src/b.js" },
              syntax: "import",
              importKind: "value",
              specifiers: [{ kind: "named", name: "b" }],
            },
            {
              from: "src/a.js",
              target: { kind: "external", name: "react" },
              syntax: "import",
              importKind: "value",
              specifiers: [{ kind: "default", name: "React" }],
            },
          ],
        },
      });
    });

    it("should resolve a source that leaves out its extension, as text mode does", () => {
      // Arrange
      const project = 'a.js\n  import "./b";\nb.js\n';

      // Act
      const reading = decodeHash(
        getPlaygroundHash({ config: CONFIG, project })
      );

      // Assert
      expect(reading).toMatchObject({
        status: "sketch",
        sketch: {
          dependencies: [{ target: { kind: "node", path: "b.js" } }],
        },
      });
    });

    it("should make a hash for an empty project", () => {
      // Act
      const reading = decodeHash(
        getPlaygroundHash({ config: "", project: "" })
      );

      // Assert
      expect(reading).toStrictEqual({
        status: "sketch",
        sketch: { config: "", tree: [], dependencies: [] },
      });
    });

    it("should throw an error that lists each line that text mode cannot read, with its number", () => {
      // Arrange
      const project = [
        "src/a.js",
        "  not a statement",
        "../outside.js",
        "src/b.js",
        '  import { x } from "./missing.js";',
        "",
      ].join("\n");

      // Act
      const getHash = () => getPlaygroundHash({ config: CONFIG, project });

      // Assert
      expect(getHash).toThrow(
        new Error(
          [
            "The project of the playground link cannot be read as text mode reads it:",
            '  line 2 (not a statement): Text mode reads the statements import, export … from, require("…") and import("…"), such as import { a } from "./a";',
            "  line 3 (../outside.js): The path cannot have `.` or `..` segments.",
            '  line 5 (import { x } from "./missing.js";): "./missing.js" does not resolve to a file of the project.',
          ].join("\n")
        )
      );
    });

    it("should throw rather than make a hash when only one line cannot be read", () => {
      // Arrange
      const project = 'src/a.js\n  import "./a.js";\n';

      // Act
      const getHash = () => getPlaygroundHash({ config: CONFIG, project });

      // Assert
      expect(getHash).toThrow(
        '  line 2 (import "./a.js";): A file cannot depend on itself.'
      );
    });
  });
});
