import boundaries from "@boundaries/eslint-plugin";

const STRESS_ELEMENT_TYPES_RULES = Array.from({ length: 15 }, (_, index) => {
  const domainNumber = String((index % 20) + 1).padStart(2, "0");
  const nextDomainNumber = String(((index + 1) % 20) + 1).padStart(2, "0");
  const layerNumber = String((index % 10) + 1).padStart(2, "0");
  const featureNumber = String((index % 5) + 1).padStart(2, "0");

  return {
    from: [
      "feature",
      {
        domain: `domain-${domainNumber}`,
        layer: `layer-${layerNumber}`,
      },
    ],
    disallow: [
      [
        "feature",
        {
          domain: `domain-{${domainNumber},${nextDomainNumber},\${from.domain}`,
          layer: "layer-*",
          feature: `feature-{${featureNumber},\${from.feature}`,
        },
      ],
      [
        "scenario",
        {
          group: "boundaries,external,${from.feature}",
        },
      ],
      ["library", { library: "shared,legacy,${from.domain}" }],
      [
        "app",
        {
          app: "main,admin,${from.layer}",
        },
      ],
    ],
    message:
      "stress rule " +
      (index + 1) +
      " evaluated for ${from.domain}/${from.layer}/${from.feature}",
  };
});

export default [
  {
    files: ["**/*.js"],
    plugins: {
      boundaries,
    },
    settings: {
      "boundaries/elements": [
        {
          type: "app",
          pattern: "src/apps/*/index.js",
          mode: "file",
          capture: ["app"],
        },
        {
          type: "feature",
          pattern: "src/domains/*/layers/*/features/*",
          mode: "folder",
          capture: ["domain", "layer", "feature"],
        },
        {
          type: "library",
          pattern: "src/libraries/*/index.js",
          mode: "file",
          capture: ["library"],
        },
        {
          type: "library-private",
          pattern: "src/libraries/*/private/*",
          mode: "folder",
          capture: ["library", "privateName"],
        },
        {
          type: "scenario",
          pattern: "src/scenarios/*/*.js",
          mode: "file",
          capture: ["group", "name"],
        },
      ],
      "boundaries/include": ["**/*.js"],
      "boundaries/ignore": ["src/ignored/**"],
      "boundaries/dependency-nodes": [
        "import",
        "require",
        "export",
        "dynamic-import",
      ],
      "boundaries/additional-dependency-nodes": [
        {
          selector:
            "CallExpression[callee.object.name=jest][callee.property.name=mock] > Literal:first-child",
          kind: "value",
          name: "jest-mock",
        },
      ],
      "boundaries/root-path": ".",
      "boundaries/cache": true,
      "boundaries/flag-as-external": {
        unresolvableAlias: true,
        inNodeModules: true,
        outsideRootPath: false,
        customSourcePatterns: ["@boundaries/*"],
      },
      "boundaries/legacy-templates": true,
    },
    rules: {
      "boundaries/element-types": [
        "error",
        {
          default: "allow",
          checkAllOrigins: true,
          checkUnknownLocals: true,
          checkInternals: true,
          message:
            "element-types violation: ${file.type} -> ${dependency.type} through ${dependency.source}",
          rules: [
            {
              from: ["scenario", { group: "boundaries" }],
              disallow: ["feature", "library"],
              message:
                "scenario boundaries cannot import architecture elements: ${dependency.source}",
            },
            {
              from: [
                "feature",
                {
                  domain: "domain-10",
                  layer: "layer-10",
                  feature: "feature-05",
                },
              ],
              disallow: [
                ["feature", { domain: "domain-01", layer: "layer-10" }],
              ],
              message:
                "cross-domain import blocked from ${from.domain} to ${target.domain}",
            },
            {
              from: [
                "feature",
                {
                  domain: "domain-09",
                  layer: "layer-09",
                  feature: "feature-02",
                },
              ],
              disallow: [
                ["feature", { domain: "domain-02", feature: "feature-02" }],
              ],
              message:
                "cross-domain import blocked from ${from.domain} to ${target.domain}",
            },
            ...STRESS_ELEMENT_TYPES_RULES,
          ],
        },
      ],
      "boundaries/external": [
        "error",
        {
          default: "allow",
          message: "external dependency is not allowed: ${dependency.source}",
          rules: [
            {
              from: ["scenario", { group: "external" }],
              disallow: ["chalk", "eslint", "node:fs", "node:path"],
              message:
                "scenario external cannot import blocked module ${dependency.source}",
            },
          ],
        },
      ],
      "boundaries/entry-point": [
        "error",
        {
          default: "allow",
          message: "entry-point violation for ${dependency.source}",
          rules: [
            {
              target: "library-private",
              allow: "index.js",
              message:
                "shared library must be consumed through index.js, received ${dependency.source}",
            },
          ],
        },
      ],
      "boundaries/no-private": [
        "error",
        {
          allowUncles: false,
          message:
            "no-private violation from ${file.type} to ${dependency.source}",
        },
      ],
      "boundaries/no-unknown": ["error"],
      "boundaries/no-unknown-files": ["error"],
      "boundaries/no-ignored": ["error"],
    },
  },
];
