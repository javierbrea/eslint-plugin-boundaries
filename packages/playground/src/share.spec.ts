/**
 * @jest-environment node
 */
import { decodeHash } from "@/domains/share/helpers/sketchHash";

import { getPlaygroundHash } from "./share";

const CONFIG = "{ settings: {}, rules: {} }\n";

const PROJECT = 'src/a.js\n  import { b } from "./b.js";\nsrc/b.js\n';

// The hash that this project and this config make, written down so that a change in what Node.js computes shows
const HASH =
  "v=1&s=bU7NDsIgDH6VpWeid17BR1APCGWiWyHQGQ3h3e227DBjemj7_bUVbCQfetBQu4LMgfqiu9pUl6cBl7FrFwIFnBFBnyskw3fRl2yP5vAoQj0DOUF8GBCa2ilufxRXBQ4TkkOyAcsS6nMc96Fsco8Mum5mig4F_w1vCsqH2LwFDGOKmUW0DqfV-DLDNDtLQht8wLye3GLNiE7Yuct6k_-kvg";

describe("share entry", () => {
  // The default environment of the package is jsdom, so this file asks for Node.js: the setup file of the package runs in it too, but it only gives Node.js's own TextEncoder and TextDecoder to the globals that already have them
  describe("in plain Node.js", () => {
    it("should have no window and no document", () => {
      // Assert
      expect(typeof window).toBe("undefined");
      expect(typeof document).toBe("undefined");
    });

    it("should compute the hash that the format writes for a project", () => {
      // Act
      const hash = getPlaygroundHash({ config: CONFIG, project: PROJECT });

      // Assert
      expect(hash).toBe(HASH);
    });

    it("should compute a hash that opens the project", () => {
      // Act
      const reading = decodeHash(
        getPlaygroundHash({ config: CONFIG, project: PROJECT })
      );

      // Assert
      expect(reading).toStrictEqual({
        status: "sketch",
        sketch: {
          config: CONFIG,
          tree: [
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
          ],
        },
      });
    });

    it("should throw an error that lists the lines text mode cannot read, so that a docs build fails", () => {
      // Act
      const compute = () =>
        getPlaygroundHash({ config: CONFIG, project: "src/../a.js\n" });

      // Assert
      expect(compute).toThrow(
        "line 1 (src/../a.js): The path cannot have `.` or `..` segments."
      );
    });
  });
});
