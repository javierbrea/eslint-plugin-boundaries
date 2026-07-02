import boundaries from "@boundaries/eslint-plugin";
// eslint disabled because eslint-plugin-import seems not to be resolving exports defined in package.json
// eslint-disable-next-line import/no-unresolved
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
      "boundaries/dependencies": [
        "error",
        {
          // Check external dependencies too, so the deprecated external rule
          // can be folded into this one through the to.module sub-selector.
          checkAllOrigins: true,
          default: "disallow",
          policies: [
            {
              from: {
                element: {
                  type: "component",
                },
              },
              // Only local helpers are allowed. A helper outside the root path
              // is flagged as external (module origin "external") and, although
              // it still matches the helper element pattern, must be disallowed
              // here to fold in the deprecated external rule behavior.
              allow: [
                {
                  to: {
                    element: {
                      type: "helper",
                    },
                    module: {
                      origin: "local",
                    },
                  },
                },
              ],
            },
            {
              from: {
                element: {
                  type: "helper",
                },
              },
              allow: [
                {
                  to: {
                    element: {
                      type: "helper",
                    },
                    module: {
                      origin: "local",
                    },
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  },
];
