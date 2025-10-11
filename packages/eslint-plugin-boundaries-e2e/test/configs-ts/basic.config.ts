import boundaries from "eslint-plugin-boundaries";
import type { Config } from "eslint-plugin-boundaries";

const boundariesConfig: Config<"foo"> = {
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
    // @ts-expect-error This should fail because the namespace is different
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
};

export default [boundariesConfig];
