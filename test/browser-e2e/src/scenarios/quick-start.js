/**
 * The settings of the quick-start guide of the docs.
 */
export const QUICK_START_SETTINGS = {
  "boundaries/elements": [
    { type: "helper", pattern: "helpers/*" },
    { type: "component", pattern: "components/*/*" },
    { type: "module", pattern: "modules/*" },
  ],
  "boundaries/files": [
    { pattern: "**/*.spec.js", category: "test" },
    { pattern: "**/*.css", category: "style" },
  ],
};

/**
 * The dependencies rule of the last step of the quick-start guide of the docs, without the predefined rules of the plugin that the guide spreads first.
 */
export const QUICK_START_RULES = {
  "boundaries/dependencies": [
    2,
    {
      default: "disallow",
      policies: [
        {
          from: { element: { type: "component" } },
          allow: { to: { element: { type: "helper" } } },
        },
        {
          from: { element: { type: "module" } },
          allow: { to: { element: { types: ["component", "helper"] } } },
        },
        {
          disallow: { to: { file: { categories: "test" } } },
        },
      ],
    },
  ],
};

/**
 * Files of a project that the quick-start configuration classifies: one of each element type, a test, a style and a file outside every element.
 */
export const QUICK_START_FILES = [
  "src/helpers/format/index.js",
  "src/components/atoms/Button/index.js",
  "src/components/atoms/Button/Button.spec.js",
  "src/components/atoms/Button/Button.css",
  "src/modules/checkout/index.js",
  "src/index.js",
];
