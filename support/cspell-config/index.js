const { resolve } = require("path");

const deepMerge = require("deepmerge");

const DICTIONARIES_BASE_PATH = resolve(__dirname, "dictionaries");

function createConfig(config = {}) {
  return deepMerge(
    {
      // Version of the setting file.  Always 0.2
      version: "0.2",
      // Paths to be ignored
      ignorePaths: [
        "**/node_modules/**",
        ".husky/**",
        "**/pnpm-lock.yaml",
        "**/components/cspell-config/*.txt",
        "**/.gitignore",
        "**/coverage/**",
        "**/dist/**",
        "**/reports/**",
        "**/build/**",
        "**/*.svg",
      ],
      caseSensitive: false,
      // Language - current active spelling language
      language: "en",
      // Dictionaries to be used
      dictionaryDefinitions: [
        { name: "node-custom", path: `${DICTIONARIES_BASE_PATH}/node.txt` },
        {
          name: "missing-en",
          path: `${DICTIONARIES_BASE_PATH}/missing-en.txt`,
        },
        { name: "people", path: `${DICTIONARIES_BASE_PATH}/people.txt` },
        { name: "tech", path: `${DICTIONARIES_BASE_PATH}/tech.txt` },
      ],
      dictionaries: ["company", "node-custom", "missing-en", "people", "tech"],
      // Global ignore patterns
      ignoreRegExpList: [
        // Ignore words that start with @
        "/@\\w+/g",
      ],
      languageSettings: [
        {
          // In markdown files
          languageId: "markdown",
          // Exclude code blocks from spell checking
          ignoreRegExpList: ["/^\\s*```[\\s\\S]*?^\\s*```/gm"],
        },
      ],
      // The minimum length of a word before it is checked.
      minWordLength: 4,
      // cspell:disable-next-line FlagWords - list of words to be always considered incorrect. This is useful for offensive words and common spelling errors. For example "hte" should be "the"
      flagWords: ["hte"],
    },
    config
  );
}

module.exports = {
  createConfig,
};
