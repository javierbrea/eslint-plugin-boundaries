module.exports = function config(api) {
  const isTest = api.env("test");
  if (isTest) {
    return {
      presets: [
        [
          "@babel/preset-env",
          { targets: { node: "current", esmodules: true } },
        ],
        "@babel/preset-typescript",
      ],
    };
  }
};
