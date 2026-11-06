import { parseConfig } from "./parseConfig";
import type { ConfigRead } from "./parseConfig.types";
import { readResolvers } from "./resolvers";

const NODE_EXTENSIONS = [".mjs", ".js", ".json", ".node"];

const TYPESCRIPT_EXTENSIONS = [
  ".ts",
  ".tsx",
  ".d.ts",
  ".js",
  ".jsx",
  ".json",
  ".node",
];

const RUNS_ONLY =
  'The playground finds the files of the sources with the "node" and "typescript" resolvers only, so ESLint can resolve a source to another file.';

const NONE_RUN =
  'None of the resolvers of the setting is one it runs, so it uses "node" with its default extensions.';

/**
 * Writes a config text with the settings that are given.
 * @param settings The settings of the config.
 * @returns The config text.
 */
function writeConfig(settings: unknown): string {
  return JSON.stringify({ settings }, null, 2);
}

/**
 * Reads a config text as one JSON5 object, as the engine does.
 * @param text The config text.
 * @returns The config as written.
 */
function read(text: string): ConfigRead {
  const config = parseConfig(text);
  if (!config.parsed) {
    throw new Error("The config text should be one JSON5 object");
  }
  return config;
}

/**
 * Reads the resolvers of the settings that are given.
 * @param settings The settings of the config.
 * @returns The resolvers and the warnings, and the text that the warnings are placed in.
 */
function readSettings(settings: unknown): {
  resolvers: ReturnType<typeof readResolvers>["resolvers"];
  problems: ReturnType<typeof readResolvers>["problems"];
  text: string;
} {
  const text = writeConfig(settings);
  return { ...readResolvers(read(text)), text };
}

/**
 * Reads the text a range covers.
 * @param text The config text.
 * @param range A range of the text.
 * @param range.from
 * @param range.to
 * @returns The text in the range.
 */
function slice(text: string, { from, to }: { from: number; to: number }) {
  return text.slice(from, to);
}

describe("Resolvers", () => {
  describe("readResolvers", () => {
    describe("when no setting names a resolver", () => {
      it("should use the node resolver with its default extensions, and warn about nothing", () => {
        // Act
        const { resolvers, problems } = readSettings({});

        // Assert
        expect(resolvers).toEqual([
          { name: "node", extensions: NODE_EXTENSIONS },
        ]);
        expect(problems).toEqual([]);
      });

      it("should use it when the config has no settings", () => {
        // Act
        const { resolvers, problems } = readResolvers(read("{}"));

        // Assert
        expect(resolvers).toEqual([
          { name: "node", extensions: NODE_EXTENSIONS },
        ]);
        expect(problems).toEqual([]);
      });

      it("should give the same resolvers for any config text that does not set them", () => {
        // Act
        const first = readSettings({ "boundaries/cache": true }).resolvers;
        const second = readSettings({}).resolvers;

        // Assert
        expect(first).toBe(second);
      });

      it("should use the options of import/resolve for the node resolver", () => {
        // Act
        const { resolvers, problems } = readSettings({
          "import/resolve": { extensions: [".js", ".ts"] },
        });

        // Assert
        expect(resolvers).toEqual([
          { name: "node", extensions: [".js", ".ts"] },
        ]);
        expect(problems).toEqual([]);
      });

      it.each([null, false, 0, ""])(
        "should use import/resolve when import/resolver is %p, as ESLint does",
        (empty) => {
          // Act
          const { resolvers, problems } = readSettings({
            "import/resolver": empty,
            "import/resolve": { extensions: [".ts"] },
          });

          // Assert
          expect(resolvers).toEqual([{ name: "node", extensions: [".ts"] }]);
          expect(problems).toEqual([]);
        }
      );

      it("should use the default extensions when import/resolve has no valid extensions", () => {
        // Act
        const { resolvers } = readSettings({ "import/resolve": true });

        // Assert
        expect(resolvers).toEqual([
          { name: "node", extensions: NODE_EXTENSIONS },
        ]);
      });
    });

    describe("when import/resolver names the resolvers", () => {
      it.each([
        ["node", "node", NODE_EXTENSIONS],
        ["typescript", "typescript", TYPESCRIPT_EXTENSIONS],
        ["eslint-import-resolver-node", "node", NODE_EXTENSIONS],
        [
          "eslint-import-resolver-typescript",
          "typescript",
          TYPESCRIPT_EXTENSIONS,
        ],
      ])(
        "should run the resolver that the string %s names, with its default extensions",
        (written, resolverName, extensions) => {
          // Act
          const { resolvers, problems } = readSettings({
            "import/resolver": written,
          });

          // Assert
          expect(resolvers).toEqual([{ name: resolverName, extensions }]);
          expect(problems).toEqual([]);
        }
      );

      it("should run the resolvers of an array in the order it lists them, each one a string or an object", () => {
        // Act
        const { resolvers, problems } = readSettings({
          "import/resolver": [
            "eslint-import-resolver-typescript",
            { node: { extensions: [".js"] } },
          ],
        });

        // Assert
        expect(resolvers).toEqual([
          { name: "typescript", extensions: TYPESCRIPT_EXTENSIONS },
          { name: "node", extensions: [".js"] },
        ]);
        expect(problems).toEqual([]);
      });

      it("should run the resolvers of a nested array", () => {
        // Act
        const { resolvers, problems } = readSettings({
          "import/resolver": [["typescript"], [["node"]]],
        });

        // Assert
        expect(resolvers.map((resolver) => resolver.name)).toEqual([
          "typescript",
          "node",
        ]);
        expect(problems).toEqual([]);
      });

      it("should run the resolvers of an object in the order it writes the keys, with the extensions of each", () => {
        // Act
        const { resolvers, problems } = readSettings({
          "import/resolver": {
            typescript: true,
            node: { extensions: [".js", ".ts"], moduleDirectory: ["x"] },
          },
        });

        // Assert
        expect(resolvers).toEqual([
          { name: "typescript", extensions: TYPESCRIPT_EXTENSIONS },
          { name: "node", extensions: [".js", ".ts"] },
        ]);
        expect(problems).toEqual([]);
      });

      it("should replace the default extensions of the typescript resolver with the extensions option", () => {
        // Act
        const { resolvers } = readSettings({
          "import/resolver": { typescript: { extensions: [".ts", ".tsx"] } },
        });

        // Assert
        expect(resolvers).toEqual([
          { name: "typescript", extensions: [".ts", ".tsx"] },
        ]);
      });

      it("should accept an empty list of extensions, which adds none", () => {
        // Act
        const { resolvers } = readSettings({
          "import/resolver": { node: { extensions: [] } },
        });

        // Assert
        expect(resolvers).toEqual([{ name: "node", extensions: [] }]);
      });

      it.each(["x", 5, [".ts", 5], { 0: ".ts" }])(
        "should use the default extensions when the extensions option is %p",
        (extensions) => {
          // Act
          const { resolvers, problems } = readSettings({
            "import/resolver": { node: { extensions } },
          });

          // Assert
          expect(resolvers).toEqual([
            { name: "node", extensions: NODE_EXTENSIONS },
          ]);
          expect(problems).toEqual([]);
        }
      );

      it("should ignore the other options and import/resolve", () => {
        // Act
        const { resolvers, problems } = readSettings({
          "import/resolver": {
            typescript: { alwaysTryTypes: true, project: "tsconfig.json" },
          },
          "import/resolve": { extensions: [".mjs"] },
        });

        // Assert
        expect(resolvers).toEqual([
          { name: "typescript", extensions: TYPESCRIPT_EXTENSIONS },
        ]);
        expect(problems).toEqual([]);
      });

      it("should keep the place of a resolver that is written twice, with the options of its last entry", () => {
        // Act
        const { resolvers } = readSettings({
          "import/resolver": [
            "node",
            "typescript",
            { node: { extensions: [".js"] } },
            "typescript",
          ],
        });

        // Assert
        expect(resolvers).toEqual([
          { name: "node", extensions: [".js"] },
          { name: "typescript", extensions: TYPESCRIPT_EXTENSIONS },
        ]);
      });

      it("should read the same resolver under its two names as two resolvers, as ESLint does", () => {
        // Act
        const { resolvers } = readSettings({
          "import/resolver": [
            { node: { extensions: [".js"] } },
            "eslint-import-resolver-node",
          ],
        });

        // Assert
        expect(resolvers).toEqual([
          { name: "node", extensions: [".js"] },
          { name: "node", extensions: NODE_EXTENSIONS },
        ]);
      });
    });

    describe("when import/resolver names a resolver that the playground does not run", () => {
      it("should warn at the entry, and keep the resolvers it runs", () => {
        // Act
        const { resolvers, problems, text } = readSettings({
          "import/resolver": ["typescript", "alias", "node"],
        });

        // Assert
        expect(resolvers.map((resolver) => resolver.name)).toEqual([
          "typescript",
          "node",
        ]);
        expect(problems).toEqual([
          {
            level: "warning",
            title: 'The playground does not run the "alias" resolver.',
            detail: RUNS_ONLY,
            links: [],
            path: ["settings", "import/resolver", 1],
            range: expect.objectContaining({ line: 5, column: 7 }),
            source: "config",
          },
        ]);
        expect(slice(text, problems[0].range)).toBe('"alias"');
      });

      it("should warn at the key of an object, whatever its options are", () => {
        // Act
        const { resolvers, problems, text } = readSettings({
          "import/resolver": {
            node: {},
            webpack: { config: "webpack.config.js" },
          },
        });

        // Assert
        expect(resolvers.map((resolver) => resolver.name)).toEqual(["node"]);
        expect(problems.map(({ title, path }) => ({ title, path }))).toEqual([
          {
            title: 'The playground does not run the "webpack" resolver.',
            path: ["settings", "import/resolver", "webpack"],
          },
        ]);
        expect(slice(text, problems[0].range)).toBe(
          '{\n        "config": "webpack.config.js"\n      }'
        );
      });

      it("should warn at an entry of a nested array", () => {
        // Act
        const { problems, text } = readSettings({
          "import/resolver": [["node", "alias"]],
        });

        // Assert
        expect(problems.map(({ path }) => path)).toEqual([
          ["settings", "import/resolver", 0, 1],
        ]);
        expect(slice(text, problems[0].range)).toBe('"alias"');
      });

      it("should warn for each resolver it does not run, in the order they are written", () => {
        // Act
        const { problems } = readSettings({
          "import/resolver": ["alias", "node", "./my-resolver.js", "oxc"],
        });

        // Assert
        expect(problems.map(({ title }) => title)).toEqual([
          'The playground does not run the "alias" resolver.',
          'The playground does not run the "./my-resolver.js" resolver.',
          'The playground does not run the "oxc" resolver.',
        ]);
      });

      it("should name the package of a resolver as it is written", () => {
        // Act
        const { problems } = readSettings({
          "import/resolver": ["node", "eslint-import-resolver-alias"],
        });

        // Assert
        expect(problems.map(({ title }) => title)).toEqual([
          'The playground does not run the "eslint-import-resolver-alias" resolver.',
        ]);
      });

      it("should use the node resolver, and say so in each warning, when it runs none", () => {
        // Act
        const { resolvers, problems, text } = readSettings({
          "import/resolver": "alias",
        });

        // Assert
        expect(resolvers).toEqual([
          { name: "node", extensions: NODE_EXTENSIONS },
        ]);
        expect(problems).toEqual([
          {
            level: "warning",
            title: 'The playground does not run the "alias" resolver.',
            detail: `${RUNS_ONLY} ${NONE_RUN}`,
            links: [],
            path: ["settings", "import/resolver"],
            range: expect.objectContaining({ line: 3, column: 24 }),
            source: "config",
          },
        ]);
        expect(slice(text, problems[0].range)).toBe('"alias"');
      });

      it("should say it in each warning when every entry of a list is a resolver it does not run", () => {
        // Act
        const { resolvers, problems } = readSettings({
          "import/resolver": { alias: {}, webpack: {} },
        });

        // Assert
        expect(resolvers).toEqual([
          { name: "node", extensions: NODE_EXTENSIONS },
        ]);
        expect(problems.map(({ detail }) => detail)).toEqual([
          `${RUNS_ONLY} ${NONE_RUN}`,
          `${RUNS_ONLY} ${NONE_RUN}`,
        ]);
      });
    });

    describe("when import/resolver holds a value that is not a resolver config", () => {
      it.each([5, true])(
        "should warn at the setting for %p, and use the node resolver",
        (value) => {
          // Act
          const { resolvers, problems } = readSettings({
            "import/resolver": value,
          });

          // Assert
          expect(resolvers).toEqual([
            { name: "node", extensions: NODE_EXTENSIONS },
          ]);
          expect(problems).toEqual([
            {
              level: "warning",
              title:
                'The playground does not run a value of "import/resolver" that is not a resolver.',
              detail: `A resolver is written as its name, as a list of them, or as an object with a name for each key. ${NONE_RUN}`,
              links: [],
              path: ["settings", "import/resolver"],
              range: expect.objectContaining({ line: 3 }),
              source: "config",
            },
          ]);
        }
      );

      it("should warn at the entry of a list, and keep the resolvers it runs", () => {
        // Act
        const { resolvers, problems, text } = readSettings({
          "import/resolver": ["typescript", 5, false, "node"],
        });

        // Assert
        expect(resolvers.map((resolver) => resolver.name)).toEqual([
          "typescript",
          "node",
        ]);
        expect(problems.map(({ path }) => path)).toEqual([
          ["settings", "import/resolver", 1],
          ["settings", "import/resolver", 2],
        ]);
        expect(problems.map(({ range }) => slice(text, range))).toEqual([
          "5",
          "false",
        ]);
        expect(problems.map(({ detail }) => detail)).toEqual([
          "A resolver is written as its name, as a list of them, or as an object with a name for each key.",
          "A resolver is written as its name, as a list of them, or as an object with a name for each key.",
        ]);
      });

      it.each([[], {}, [null], [[]]])(
        "should warn at the setting that %p lists no resolver, and use the node resolver",
        (value) => {
          // Act
          const { resolvers, problems } = readSettings({
            "import/resolver": value,
          });

          // Assert
          expect(resolvers).toEqual([
            { name: "node", extensions: NODE_EXTENSIONS },
          ]);
          expect(problems).toEqual([
            {
              level: "warning",
              title: 'The setting "import/resolver" lists no resolver.',
              detail:
                'ESLint finds no file for a source then, and the playground uses "node" with its default extensions.',
              links: [],
              path: ["settings", "import/resolver"],
              range: expect.objectContaining({ line: 3 }),
              source: "config",
            },
          ]);
        }
      );
    });
  });
});
