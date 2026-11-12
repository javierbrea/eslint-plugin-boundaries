/**
 * Writes `import.meta.url` as the URL of the file in CommonJS, where Jest runs the specs and `import.meta` does not exist, so that the file that creates the worker runs in its spec as the bundlers of the hosts read it.
 * @param {object} babel The API of Babel.
 * @param {object} babel.template The template builder.
 * @returns {object} The plugin.
 */
function importMetaUrl({ template }) {
  return {
    visitor: {
      MemberExpression(path) {
        const { object, property } = path.node;

        if (
          object.type === "MetaProperty" &&
          object.meta.name === "import" &&
          object.property.name === "meta" &&
          property.type === "Identifier" &&
          property.name === "url"
        ) {
          path.replaceWith(
            template.expression
              .ast`require("node:url").pathToFileURL(__filename).href`
          );
        }
      },
    },
  };
}

module.exports = function config(api) {
  const isTest = api.env("test");
  if (isTest) {
    return {
      plugins: [importMetaUrl],
      presets: [
        [
          "@babel/preset-env",
          { targets: { node: "current", esmodules: true } },
        ],
        "@babel/preset-typescript",
        ["@babel/preset-react", { runtime: "automatic" }],
      ],
    };
  }
};
