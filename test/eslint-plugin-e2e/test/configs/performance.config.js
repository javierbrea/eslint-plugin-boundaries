import boundaries from "@boundaries/eslint-plugin";

const STRESS_ELEMENT_TYPES_RULES = Array.from({ length: 15 }, (_, index) => {
  const domainNumber = String((index % 20) + 1).padStart(2, "0");
  const nextDomainNumber = String(((index + 1) % 20) + 1).padStart(2, "0");
  const layerNumber = String((index % 10) + 1).padStart(2, "0");
  const featureNumber = String((index % 5) + 1).padStart(2, "0");

  return {
    from: {
      type: "feature",
      captured: {
        domain: `domain-${domainNumber}`,
        layer: `layer-${layerNumber}`,
      },
    },
    disallow: [
      {
        to: {
          type: "feature",
          captured: {
            domain: `domain-{${domainNumber},${nextDomainNumber},{{ from.captured.domain }}`,
            layer: "layer-*",
            feature: `feature-{${featureNumber},{{ from.captured.feature }}`,
          },
        },
      },
      {
        to: {
          type: "scenario",
          captured: {
            group: "boundaries,external,{{ from.captured.feature }}",
          },
        },
      },
      {
        to: {
          type: "library",
          captured: {
            library: "shared,legacy,{{ from.captured.domain }}",
          },
        },
      },
      {
        to: {
          type: "app",
          captured: {
            app: "main,admin,{{ from.captured.layer }}",
          },
        },
      },
    ],
    message:
      "stress rule " +
      (index + 1) +
      " evaluated for {{ from.captured.domain }}/{{ from.captured.layer }}/{{ from.captured.feature }}",
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
    },
    rules: {
      "boundaries/element-types": [
        "error",
        {
          checkAllOrigins: true,
          default: "allow",
          message:
            "element-types violation: {{ from.type }} -> {{ to.type }} through {{ dependency.source }}",
          rules: [
            {
              disallow: {
                to: {
                  parent: {
                    type: "*",
                  },
                },
              },
            },
            {
              allow: {
                dependency: {
                  relationship: {
                    to: ["child", "sibling"],
                  },
                },
              },
            },
            {
              to: {
                type: "library-private",
                internalPath: "!index.js",
              },
              disallow: {
                from: {
                  type: "*",
                },
              },
              message:
                "shared library must be consumed through index.js, received {{ dependency.source }}",
            },
            {
              from: {
                type: "scenario",
                captured: {
                  group: "external",
                },
              },
              disallow: [
                {
                  to: {
                    origin: "external",
                  },
                  dependency: {
                    module: ["chalk", "eslint"],
                  },
                },
                {
                  to: {
                    origin: "core",
                  },
                  dependency: {
                    module: ["node:fs", "node:path"],
                  },
                },
              ],
              message:
                "scenario external cannot import blocked module {{ dependency.source }}",
            },
            {
              from: {
                type: "scenario",
                captured: {
                  group: "boundaries",
                },
              },
              disallow: {
                to: {
                  type: ["feature", "library"],
                },
              },
              message:
                "scenario boundaries cannot import architecture elements: {{ dependency.source }}",
            },
            {
              from: {
                type: "feature",
                captured: {
                  domain: "domain-10",
                  layer: "layer-10",
                  feature: "feature-05",
                },
              },
              disallow: [
                {
                  to: {
                    type: "feature",
                    captured: {
                      domain: "domain-01",
                      layer: "layer-10",
                    },
                  },
                },
              ],
              message:
                "cross-domain import blocked from {{ from.captured.domain }} to {{ to.captured.domain }}",
            },
            {
              from: {
                type: "feature",
                captured: {
                  domain: "domain-09",
                  layer: "layer-09",
                  feature: "feature-02",
                },
              },
              disallow: [
                {
                  to: {
                    type: "feature",
                    captured: {
                      domain: "domain-02",
                      feature: "feature-02",
                    },
                  },
                },
              ],
              message:
                "cross-domain import blocked from {{ from.captured.domain }} to {{ to.captured.domain }}",
            },
            ...STRESS_ELEMENT_TYPES_RULES,
          ],
        },
      ],
      "boundaries/no-unknown": ["error"],
      "boundaries/no-unknown-files": ["error"],
      "boundaries/no-ignored": ["error"],
    },
  },
];
