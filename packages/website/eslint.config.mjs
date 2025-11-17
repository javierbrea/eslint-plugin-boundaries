import config, {
  jestConfig,
  reactConfig,
  reactHooksConfig,
} from "../../support/eslint-config/index.js";

export default [
  ...config,
  {
    ignores: [".docusaurus/**"],
  },
  jestConfig,
  {
    files: ["**/*.tsx", "**/*.ts"],
    rules: {
      "@typescript-eslint/no-require-imports": [2, { allow: ["/.*\\.svg$"] }],
      "import/no-unresolved": [
        2,
        {
          ignore: ["^@theme", "^@docusaurus", "^@site"],
        },
      ],
    },
  },
  reactConfig,
  reactHooksConfig,
];
