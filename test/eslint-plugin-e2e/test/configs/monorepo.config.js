import boundaries from "@boundaries/eslint-plugin";
// eslint disabled because eslint-plugin-import seems not to be resolving exports defined in package.json
// eslint -disable-next-line import/no-unresolved
import strictBoundariesConfig from "@boundaries/eslint-plugin/strict";

export default [
  {
    files: ["**/*.js", "**/*.ts"],
    plugins: {
      boundaries,
    },
    settings: {
      "boundaries/elements": [
        {
          type: "component",
          pattern: "components/*",
          capture: ["name"],
        },
        {
          type: "helper",
          pattern: "helpers/*",
          capture: ["name"],
        },
      ],
      "boundaries/dependency-nodes": ["import"],
    },
    /** @type {import('@boundaries/eslint-plugin').Rules} */
    rules: {
      ...strictBoundariesConfig.rules,
      "boundaries/element-types": [
        "error",
        {
          default: "disallow",
          rules: [
            {
              from: "component",
              allow: ["helper"],
            },
            {
              from: {
                type: "helper",
              },
              allow: [
                {
                  to: {
                    type: "helper",
                  },
                },
              ],
            },
          ],
        },
      ],
      "boundaries/external": ["error", { default: "disallow" }],
    },
  },
];
