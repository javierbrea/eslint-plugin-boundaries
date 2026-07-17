import typescriptEslintPlugin from "@typescript-eslint/eslint-plugin";
import typescriptParser from "@typescript-eslint/parser";
import boundaries from "eslint-plugin-boundaries";

export default [
  {
    ignores: ["node_modules/**"],
  },
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parser: typescriptParser,
    },
    plugins: {
      "@typescript-eslint": typescriptEslintPlugin,
      boundaries,
    },
    settings: {
      "boundaries/elements": [
        { type: "helper", pattern: "helpers/*" },
        { type: "component", pattern: "components/*" },
        { type: "module", pattern: "modules/*" },
      ],
      // Resolves TypeScript imports, including the path aliases defined in tsconfig.json
      "import/resolver": {
        typescript: {
          alwaysTryTypes: true,
        },
      },
    },
    rules: {
      ...typescriptEslintPlugin.configs.recommended.rules,
      ...boundaries.configs.recommended.rules,
      "boundaries/dependencies": [
        2,
        {
          default: "disallow",
          policies: [
            {
              from: { element: { types: "component" } },
              allow: { to: { element: { types: "helper" } } },
            },
            {
              from: { element: { types: "module" } },
              allow: { to: { element: { types: ["component", "helper"] } } },
            },
          ],
        },
      ],
    },
  },
];
