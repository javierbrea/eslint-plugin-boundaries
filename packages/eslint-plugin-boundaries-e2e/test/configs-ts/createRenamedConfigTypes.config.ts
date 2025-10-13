// NOTE: This test is not executed. It only checks types in build time
import type { Linter } from "eslint";
import { defineConfig } from "eslint/config";
import { createConfig } from "eslint-plugin-boundaries/config";
import recommendedBoundariesConfig from "eslint-plugin-boundaries/recommended";

export const boundariesConfig = createConfig(
  {
    settings: {
      ...recommendedBoundariesConfig.settings,
      // @ts-expect-error Invalid key because it does not match plugin name nor new name
      "foo/elements": [
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
      "boundaries/ignore": ["**/ignored/**/*.js"],
    },
    rules: {
      ...recommendedBoundariesConfig.rules,
      // @ts-expect-error Invalid key because it does not match plugin name nor new name
      "foo/element-types": [
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
  "customBoundaries",
);

export const config: Linter.Config[] = defineConfig([
  createConfig(
    {
      settings: {
        ...recommendedBoundariesConfig.settings,
        // @ts-expect-error Invalid key because it does not match plugin name nor new name
        "foo/elements": [
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
        "boundaries/ignore": ["**/ignored/**/*.js"],
      },
      rules: {
        ...recommendedBoundariesConfig.rules,
        // @ts-expect-error Invalid key because it does not match plugin name nor new name
        "foo/element-types": [
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
    "customBoundaries",
  ),
]);

export const boundariesConfig2 = createConfig(
  {
    settings: {
      ...recommendedBoundariesConfig.settings,
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
      // @ts-expect-error Invalid key because renamed key can't be used in settings
      "customBoundaries/ignore": ["**/ignored/**/*.js"],
    },
    rules: {
      ...recommendedBoundariesConfig.rules,
      // Function also supports passing renamed rules
      "customBoundaries/element-types": [
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
  "customBoundaries",
);

export const boundariesConfig3 = createConfig({
  settings: {
    ...recommendedBoundariesConfig.settings,
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
    // @ts-expect-error Invalid key because renamed key can't be used in settings
    "customBoundaries/ignore": ["**/ignored/**/*.js"],
  },
  rules: {
    ...recommendedBoundariesConfig.rules,
    // @ts-expect-error Function only supports passing renamed rules if second argument is provided
    "customBoundaries/element-types": [
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
});
