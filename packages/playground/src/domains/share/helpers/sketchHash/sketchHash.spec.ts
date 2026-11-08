import type { InflateOptions } from "fflate";
import { deflateSync, inflateSync } from "fflate";

import type { Sketch } from "@/contract";
import { QUICK_START_EXAMPLE } from "@/domains/examples/data/examples";
import {
  fromText,
  isSameProject,
  toText,
} from "@/domains/project/helpers/sketch";

import { fromBase64Url, toBase64Url } from "./base64Url";
import { decodeHash, encodeSketch, isLongLink } from "./sketchHash";
import {
  LONG_LINK_LENGTH,
  MAX_SKETCH_JSON_BYTES,
} from "./sketchHash.constants";

/** The signature of `inflateSync` that the mock below keeps */
type Inflate = (data: Uint8Array, options?: InflateOptions) => Uint8Array;

// The real `inflateSync`, which the test of the limit watches
jest.mock<{ inflateSync: Inflate }>("fflate", () => {
  const actual = jest.requireActual<{ inflateSync: Inflate }>("fflate");

  return { ...actual, inflateSync: jest.fn(actual.inflateSync) };
});

/** A link made with the raw deflate of Node.js (`zlib.deflateRawSync`), which is not the implementation that writes ours, for the sketch `TINY_SKETCH` */
const ZLIB_LINK =
  "v=1&s=bY1BDsIgFESvQmb9o3uu4BG0CwqfirZAgBoN4e7G1i4aXc0s5r2p0MFbN0CiisylOD9kKWojkeaRlyraxYNQEjPkuSKqcoVETvqoDrcMwt15AwnrRkaj3aL_s-gIhiN7w147zovUpjDtpUWlgQtk3WAfDIN-5I2QX76oJyTcFEMqoG85reBDjfOHzJG1s47Terlp1cQGtCQkerSude0N";

const TINY_SKETCH: Sketch = {
  config: "{ settings: {}, rules: {} }\n",
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
};

/** Every syntax and every kind of name, with names that look like keywords, in the order that text mode reads back */
const EVERY_SYNTAX: Sketch = {
  config: "// comment\n{ settings: {}, rules: {} }\n",
  tree: [
    { path: "a b/ü.js", kind: "file" },
    { path: "empty", kind: "folder" },
    { path: "lib/b.js", kind: "file" },
    { path: "a.js", kind: "file" },
  ],
  dependencies: [
    {
      from: "a b/ü.js",
      target: { kind: "node", path: "a.js" },
      syntax: "import",
      importKind: "value",
      specifiers: [
        { kind: "default", name: "type" },
        { kind: "named", name: "default", alias: "from" },
      ],
    },
    {
      from: "lib/b.js",
      target: { kind: "external", name: "react" },
      syntax: "require",
      importKind: "value",
      specifiers: [],
    },
    {
      from: "lib/b.js",
      target: { kind: "node", path: "a.js" },
      syntax: "dynamic-import",
      importKind: "value",
      specifiers: [],
    },
    {
      from: "a.js",
      target: { kind: "external", name: "@scope/pkg" },
      syntax: "import",
      importKind: "value",
      specifiers: [
        { kind: "default", name: "c" },
        { kind: "namespace", name: "ns" },
      ],
    },
    {
      from: "a.js",
      target: { kind: "external", name: "node:fs" },
      syntax: "import",
      importKind: "type",
      specifiers: [{ kind: "named", name: "T", alias: "U" }],
    },
    {
      from: "a.js",
      target: { kind: "node", path: "lib/b.js" },
      syntax: "export-from",
      importKind: "value",
      specifiers: [{ kind: "namespace", name: "everything" }],
    },
    {
      from: "a.js",
      target: { kind: "node", path: "lib/b.js" },
      syntax: "export-from",
      importKind: "type",
      specifiers: [],
    },
  ],
};

/**
 * Makes the hash of a link from the JSON text of its data, as a link of this format is made.
 * @param json The text to pack.
 */
function hashOfJson(json: string): string {
  return `v=1&s=${toBase64Url(deflateSync(new TextEncoder().encode(json), { level: 9 }))}`;
}

/**
 * Gets the sketch that a hash holds, which must hold one.
 * @param hash The hash to read.
 */
function getSketch(hash: string): Sketch {
  const reading = decodeHash(hash);

  if (reading.status !== "sketch") {
    throw new Error(`The hash holds no sketch: ${JSON.stringify(reading)}`);
  }
  return reading.sketch;
}

/**
 * Gets why a hash cannot be read, which it must not be.
 * @param hash The hash to read.
 */
function getError(hash: string): string | undefined {
  const reading = decodeHash(hash);

  return reading.status === "error" ? reading.error : undefined;
}

/**
 * Gets the text of the JSON that the data of a hash holds.
 * @param hash The hash made by {@link encodeSketch}.
 */
function unpackJson(hash: string): string {
  const data = new URLSearchParams(hash).get("s") ?? "";

  return new TextDecoder().decode(
    inflateSync(fromBase64Url(data) ?? new Uint8Array(0))
  );
}

describe("sketchHash", () => {
  describe("encodeSketch", () => {
    it("should write the version and the data, with no leading `#`", () => {
      // Act
      const hash = encodeSketch(TINY_SKETCH);

      // Assert
      expect(hash).toMatch(/^v=1&s=[\w-]+$/);
    });

    it("should write the same hash for the same sketch", () => {
      // Act
      const hashes = [encodeSketch(EVERY_SYNTAX), encodeSketch(EVERY_SYNTAX)];

      // Assert
      expect(hashes[0]).toBe(hashes[1]);
    });

    it("should write only the known keys of the sketch, in a fixed order", () => {
      // Arrange
      const noisy = {
        tree: [{ kind: "file", path: "src/a.js", mode: 0o644 }],
        extra: "ignored",
        dependencies: [
          {
            specifiers: [
              { alias: "x", name: "a", kind: "named", note: "ignored" },
              { name: "b", kind: "default" },
            ],
            importKind: "value",
            line: 3,
            syntax: "import",
            target: { path: "src/b.js", kind: "node", id: 1 },
            from: "src/a.js",
          },
          {
            from: "src/a.js",
            syntax: "require",
            importKind: "value",
            specifiers: [],
            target: { name: "react", kind: "external", id: 2 },
          },
        ],
        config: "{}",
      } as unknown as Sketch;

      // Act
      const json = unpackJson(encodeSketch(noisy));

      // Assert
      expect(json).toBe(
        JSON.stringify({
          config: "{}",
          tree: [{ path: "src/a.js", kind: "file" }],
          dependencies: [
            {
              from: "src/a.js",
              target: { kind: "node", path: "src/b.js" },
              syntax: "import",
              importKind: "value",
              specifiers: [
                { kind: "named", name: "a", alias: "x" },
                { kind: "default", name: "b" },
              ],
            },
            {
              from: "src/a.js",
              target: { kind: "external", name: "react" },
              syntax: "require",
              importKind: "value",
              specifiers: [],
            },
          ],
        })
      );
    });

    it("should write a name without an alias with no `alias` key", () => {
      // Act
      const json = unpackJson(encodeSketch(TINY_SKETCH));

      // Assert
      expect(json).toContain('"specifiers":[{"kind":"named","name":"b"}]');
    });

    it("should write the Quick start example in less characters than a long link has", () => {
      // Act
      const hash = encodeSketch(QUICK_START_EXAMPLE.sketch);

      // Assert
      expect(hash.length).toBeLessThan(1000);
      expect(isLongLink(hash)).toBe(false);
    });

    it("should compress with the most effort, so that a sketch of 40 files and 80 dependencies is 1,484 characters and not more", () => {
      // Arrange
      const tree = Array.from({ length: 40 }, (_unused, index) => ({
        path: `src/module${index % 8}/part${index}.js`,
        kind: "file" as const,
      }));
      const sketch: Sketch = {
        config: "{ settings: {}, rules: {} }",
        tree,
        dependencies: tree.flatMap(({ path }, index) => [
          {
            from: path,
            target: {
              kind: "node" as const,
              path: tree[(index + 1) % 40].path,
            },
            syntax: "import" as const,
            importKind: "value" as const,
            specifiers: [{ kind: "named" as const, name: `part${index}` }],
          },
          {
            from: path,
            target: { kind: "external" as const, name: "react" },
            syntax: "import" as const,
            importKind: "value" as const,
            specifiers: [{ kind: "default" as const, name: `React${index}` }],
          },
        ]),
      };

      // Act
      const hash = encodeSketch(sketch);

      // Assert
      // Compression level 3 writes 1,654 characters and level 1 writes 1,758
      expect(hash).toHaveLength(1484);
      expect(getSketch(hash).tree).toHaveLength(40);
      expect(getSketch(hash).dependencies).toHaveLength(80);
    });

    it("should write the characters of the sketch that are not ASCII so that they read back", () => {
      // Arrange
      const sketch: Sketch = {
        ...TINY_SKETCH,
        config: "// 日本語 ñ 🙂\n{}",
      };

      // Act
      const read = getSketch(encodeSketch(sketch));

      // Assert
      expect(read.config).toBe("// 日本語 ñ 🙂\n{}");
    });
  });

  describe("decodeHash", () => {
    describe("when the hash holds a sketch", () => {
      it.each([
        ["the Quick start example", QUICK_START_EXAMPLE.sketch],
        ["a sketch with every syntax and every kind of name", EVERY_SYNTAX],
        [
          "a sketch with nothing in it",
          { config: "", tree: [], dependencies: [] },
        ],
      ])("should read back %s", (_name, sketch) => {
        // Arrange
        const hash = encodeSketch(sketch);

        // Act
        const read = getSketch(hash);

        // Assert
        expect(read).toStrictEqual(sketch);
      });

      it("should read the hash with a leading `#` as the hash without it", () => {
        // Arrange
        const hash = encodeSketch(TINY_SKETCH);

        // Act
        const readings = [decodeHash(hash), decodeHash(`#${hash}`)];

        // Assert
        expect(readings[1]).toStrictEqual(readings[0]);
        expect(readings[0]).toStrictEqual({
          status: "sketch",
          sketch: TINY_SKETCH,
        });
      });

      it("should read the parameters in any order", () => {
        // Arrange
        const hash = encodeSketch(TINY_SKETCH);
        const [version, data] = hash.split("&");

        // Act
        const read = getSketch(`${data}&${version}`);

        // Assert
        expect(read).toStrictEqual(TINY_SKETCH);
      });

      it("should read a link that another implementation of raw deflate wrote", () => {
        // Act
        const read = getSketch(ZLIB_LINK);

        // Assert
        expect(read).toStrictEqual(TINY_SKETCH);
      });

      it("should read a link that has other parameters, which it ignores", () => {
        // Arrange
        const hash = `utm=docs&${encodeSketch(TINY_SKETCH)}&other=1`;

        // Act
        const read = getSketch(hash);

        // Assert
        expect(read).toStrictEqual(TINY_SKETCH);
      });

      it("should put the sketch in the order that text mode reads back, so that its first text read is no edit", () => {
        // Arrange
        const unordered: Sketch = {
          config: "{}",
          tree: [
            { path: "src/b.js", kind: "file" },
            { path: "src/a.js", kind: "file" },
          ],
          dependencies: [
            {
              from: "src/b.js",
              target: { kind: "external", name: "react" },
              syntax: "import",
              importKind: "value",
              specifiers: [
                { kind: "named", name: "useState" },
                { kind: "default", name: "React" },
              ],
            },
            {
              from: "src/a.js",
              target: { kind: "node", path: "src/b.js" },
              syntax: "import",
              importKind: "value",
              specifiers: [],
            },
          ],
        };

        // Act
        const read = getSketch(encodeSketch(unordered));
        const { sketch: reread, problems } = fromText(toText(read), read);

        // Assert
        expect(read.tree.map(({ path }) => path)).toStrictEqual([
          "src/a.js",
          "src/b.js",
        ]);
        expect(read.dependencies.map(({ from }) => from)).toStrictEqual([
          "src/a.js",
          "src/b.js",
        ]);
        expect(
          read.dependencies[1].specifiers.map(({ kind }) => kind)
        ).toStrictEqual(["default", "named"]);
        expect(problems).toStrictEqual([]);
        expect(isSameProject(read, reread)).toBe(true);
      });
    });

    describe("when the hash holds no sketch", () => {
      it.each([
        ["empty", ""],
        ["only the `#`", "#"],
        ["the anchor of a heading", "#installation"],
        ["a heading with a dash and digits", "#step-2-configure"],
        ["a version and no data", "#v=1"],
        ["other parameters", "#a=1&b=2"],
      ])("should hold none when it is %s", (_name, hash) => {
        // Act
        const reading = decodeHash(hash);

        // Assert
        expect(reading).toStrictEqual({ status: "empty" });
      });
    });

    describe("when the version is not the one it reads", () => {
      it("should refuse a link with no version", () => {
        // Arrange
        const data = new URLSearchParams(encodeSketch(TINY_SKETCH)).get("s");

        // Act
        const error = getError(`s=${data}`);

        // Assert
        expect(error).toBe('The link has no format version, "v".');
      });

      it.each(["2", "0", "1.0", "01", ""])(
        "should refuse the version %j, and say which it is",
        (version) => {
          // Arrange
          const data = new URLSearchParams(encodeSketch(TINY_SKETCH)).get("s");

          // Act
          const error = getError(`v=${version}&s=${data}`);

          // Assert
          expect(error).toBe(
            `The link has the format version "${version}", which this playground does not know.`
          );
        }
      );
    });

    describe("when the data is damaged", () => {
      it.each([
        ["has characters outside the alphabet", "v=1&s=ab+cd/ef="],
        ["is empty", "v=1&s="],
        ["has a length that no bytes can have", "v=1&s=abcde"],
      ])("should refuse data that %s", (_name, hash) => {
        // Act
        const error = getError(hash);

        // Assert
        expect(error).toBe(
          'The link is damaged: the data after "s=" is not valid base64url text.'
        );
      });

      it("should refuse data that is not raw deflate", () => {
        // Arrange
        // A block of the reserved type 3 is no deflate data
        const hash = `v=1&s=${toBase64Url(new Uint8Array([0xff, 0xff, 0xff]))}`;

        // Act
        const error = getError(hash);

        // Assert
        expect(error).toBe(
          "The link is damaged: its data cannot be unpacked. It may be cut short."
        );
      });

      it("should refuse data that is cut short", () => {
        // Arrange
        const hash = encodeSketch(EVERY_SYNTAX);
        const cut = hash.slice(0, hash.length - 40);

        // Act
        const error = getError(cut);

        // Assert
        expect(error).toMatch(/^The link is damaged: /);
      });

      it("should refuse data that unpacks to text that is not JSON", () => {
        // Act
        const error = getError(hashOfJson('{"config": '));

        // Assert
        expect(error).toBe(
          "The link is damaged: its data is not a sketch written as JSON."
        );
      });

      it("should refuse data that unpacks to bytes that are not UTF-8 text, instead of loading replacement characters", () => {
        // Arrange
        // A sketch whose config has the byte 0xff, which UTF-8 never uses
        const before = new TextEncoder().encode('{"config":"');
        const after = new TextEncoder().encode(
          '","tree":[],"dependencies":[]}'
        );
        const bytes = new Uint8Array([...before, 0xff, ...after]);
        const hash = `v=1&s=${toBase64Url(deflateSync(bytes))}`;

        // Act
        const error = getError(hash);

        // Assert
        expect(error).toBe(
          "The link is damaged: its data is not a sketch written as JSON."
        );
      });
    });

    describe("when the data is JSON that is not a sketch", () => {
      it.each([
        ["null", "null"],
        ["a list", "[]"],
        ["text", '"a sketch"'],
        ["an object of other keys", '{"a":1}'],
      ])(
        "should refuse %s with the reason that the reader gives",
        (_name, json) => {
          // Act
          const error = getError(hashOfJson(json));

          // Assert
          expect(error).toMatch(/^The (data is not a sketch|sketch needs)/);
        }
      );

      it("should refuse a sketch that fails the checks of the edits, and say why", () => {
        // Arrange
        const json = JSON.stringify({
          config: "{}",
          tree: [{ path: "src/../a.js", kind: "file" }],
          dependencies: [],
        });

        // Act
        const error = getError(hashOfJson(json));

        // Assert
        expect(error).toBe(
          '"src/../a.js" cannot be in the tree. The path cannot have `.` or `..` segments.'
        );
      });

      it("should refuse a dependency that the sketch cannot hold, and say which", () => {
        // Arrange
        const json = JSON.stringify({
          config: "{}",
          tree: [{ path: "src/a.js", kind: "file" }],
          dependencies: [
            {
              from: "src/a.js",
              target: { kind: "node", path: "src/missing.js" },
              syntax: "import",
              importKind: "value",
              specifiers: [],
            },
          ],
        });

        // Act
        const error = getError(hashOfJson(json));

        // Assert
        expect(error).toBe(
          'Dependency 1 cannot be in the sketch. "src/missing.js" is not a file of the sketch.'
        );
      });
    });

    describe("the size of what it unpacks", () => {
      /**
       * Makes a sketch whose JSON has exactly the bytes given, all of them ASCII.
       * @param bytes The size of the JSON.
       */
      function createSketchOfBytes(bytes: number): Sketch {
        const empty: Sketch = { config: "", tree: [], dependencies: [] };
        const overhead = JSON.stringify(empty).length;

        return { ...empty, config: "a".repeat(bytes - overhead) };
      }

      it("should read a sketch whose JSON has the most bytes it accepts", () => {
        // Arrange
        const sketch = createSketchOfBytes(MAX_SKETCH_JSON_BYTES);

        // Act
        const read = getSketch(encodeSketch(sketch));

        // Assert
        expect(read.config).toBe(sketch.config);
      });

      it("should refuse a sketch whose JSON has one byte more", () => {
        // Arrange
        const sketch = createSketchOfBytes(MAX_SKETCH_JSON_BYTES + 1);

        // Act
        const error = getError(encodeSketch(sketch));

        // Assert
        expect(error).toBe(
          "The sketch in the link is larger than 8 MiB, which the playground does not load."
        );
      });

      it("should never unpack more than the limit and one byte, so that a few bytes of deflate cannot take the memory of the page", () => {
        // Arrange
        const inflate = jest.mocked(inflateSync);
        const hash = `v=1&s=${toBase64Url(deflateSync(new Uint8Array(MAX_SKETCH_JSON_BYTES * 4)))}`;

        // Act
        decodeHash(hash);

        // Assert
        const [[, options]] = inflate.mock.calls;
        const [{ value: unpacked }] = inflate.mock.results;

        expect(options?.out).toHaveLength(MAX_SKETCH_JSON_BYTES + 1);
        expect(unpacked).toHaveLength(MAX_SKETCH_JSON_BYTES + 1);
      });

      it("should refuse data that unpacks to many times the limit, which a few bytes of deflate can make", () => {
        // Arrange
        const packed = deflateSync(new Uint8Array(MAX_SKETCH_JSON_BYTES * 4));
        const hash = `v=1&s=${toBase64Url(packed)}`;

        // Act
        const error = getError(hash);

        // Assert
        expect(packed.length).toBeLessThan(100_000);
        expect(error).toMatch(/is larger than 8 MiB/);
      });
    });
  });

  describe("isLongLink", () => {
    it("should be long above 8192 characters", () => {
      // Act
      const longer = isLongLink("a".repeat(8193));

      // Assert
      expect(longer).toBe(true);
    });

    it("should not be long at 8192 characters", () => {
      // Act
      const same = isLongLink("a".repeat(8192));

      // Assert
      expect(same).toBe(false);
    });

    it("should not be long with fewer characters", () => {
      // Act
      const shorter = isLongLink("https://example.com/playground/#v=1&s=abc");

      // Assert
      expect(shorter).toBe(false);
    });

    it("should have 8192 as the limit it exports", () => {
      // Assert
      expect(LONG_LINK_LENGTH).toBe(8192);
    });
  });
});
