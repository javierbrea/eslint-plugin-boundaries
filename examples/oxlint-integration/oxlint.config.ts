import { defineConfig } from "oxlint";

export default defineConfig({
  jsPlugins: [{ name: "boundaries", specifier: "eslint-plugin-boundaries" }],
  settings: {
    "boundaries/include": ["src/**/*.ts"],
    "boundaries/elements": [
      { type: "helper", pattern: "src/helpers/*" },
      { type: "component", pattern: "src/components/*" },
      { type: "module", pattern: "src/modules/*" },
    ],
    // Required: Oxlint activates no resolver by default, and unresolved imports are
    // classified as "external", causing false positives in the rules below.
    "import/resolver": {
      typescript: {
        alwaysTryTypes: true,
      },
      node: true,
    },
  },
  rules: {
    "boundaries/no-unknown-dependencies": "error",
    "boundaries/dependencies": [
      "error",
      {
        default: "disallow",
        policies: [
          {
            from: { element: { type: "component" } },
            allow: { to: { element: { type: "helper" } } },
          },
          {
            from: { element: { type: "module" } },
            allow: { to: { element: { type: ["component", "helper"] } } },
          },
        ],
      },
    ],
  },
});
