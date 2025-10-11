import boundaries from "eslint-plugin-boundaries";

export default [
  {
    files: ["**/*.js", "**/*.ts"],
    plugins: {
      boundaries,
    },
    settings: {
      "boundaries/elements": [
        {
          type: "module",
          pattern: "src/modules/*",
          capture: ["module"],
        },
        {
          type: "component",
          pattern: "src/components/*",
          capture: ["component"],
        },
      ],
    },
    rules: {
      "boundaries/element-types": [
        "error",
        {
          default: "disallow",
          rules: [
            {
              from: "module",
              allow: ["component"],
            },
          ],
        },
      ],
    },
  },
];
