import boundaries from "@boundaries/eslint-plugin";

const STRESS_ELEMENT_TYPES_RULES = Array.from({ length: 15 }, (_, index) => {
  const domainNumber = String((index % 20) + 1).padStart(2, "0");
  const nextDomainNumber = String(((index + 1) % 20) + 1).padStart(2, "0");
  const layerNumber = String((index % 10) + 1).padStart(2, "0");
  const featureNumber = String((index % 5) + 1).padStart(2, "0");

  return {
    from: {
      element: {
        type: "feature",
        captured: {
          domain: `domain-${domainNumber}`,
          layer: `layer-${layerNumber}`,
        },
      },
    },
    disallow: [
      {
        to: {
          element: {
            type: "feature",
            captured: {
              domain: `domain-{${domainNumber},${nextDomainNumber},{{ from.element.captured.domain }}`,
              layer: "layer-*",
              feature: `feature-{${featureNumber},{{ from.element.captured.feature }}`,
            },
          },
        },
      },
      {
        to: {
          element: {
            type: "scenario",
            captured: {
              group: "boundaries,external,{{ from.element.captured.feature }}",
            },
          },
        },
      },
      {
        to: {
          element: {
            type: "library",
            captured: {
              library: "shared,legacy,{{ from.element.captured.domain }}",
            },
          },
        },
      },
      {
        to: {
          element: {
            type: "app",
            captured: {
              app: "main,admin,{{ from.element.captured.layer }}",
            },
          },
        },
      },
    ],
    message:
      "stress rule " +
      (index + 1) +
      " evaluated for {{ from.element.captured.domain }}/{{ from.element.captured.layer }}/{{ from.element.captured.feature }}",
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
      "boundaries/disable-legacy-warnings": true,
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
      "boundaries/dependencies": [
        "error",
        {
          checkAllOrigins: true,
          default: "allow",
          message:
            "dependencies violation: {{ from.element.types.[0] }} -> {{ to.element.types.[0] }} through {{ dependency.source }}",
          rules: [
            {
              disallow: {
                to: {
                  element: {
                    parent: {
                      type: "*",
                    },
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
                element: {
                  type: "library-private",
                  fileInternalPath: "!index.js",
                },
              },
              disallow: {
                from: {
                  element: {
                    type: "*",
                  },
                },
              },
              message:
                "shared library must be consumed through index.js, received {{ dependency.source }}",
            },
            {
              from: {
                element: {
                  type: "scenario",
                  captured: {
                    group: "external",
                  },
                },
              },
              disallow: [
                {
                  to: {
                    module: {
                      origin: "external",
                      source: ["chalk", "eslint"],
                    },
                  },
                },
                {
                  to: {
                    module: {
                      origin: "core",
                      source: ["node:fs", "node:path"],
                    },
                  },
                },
              ],
              message:
                "scenario external cannot import blocked module {{ dependency.source }}",
            },
            {
              from: {
                element: {
                  type: "scenario",
                  captured: {
                    group: "boundaries",
                  },
                },
              },
              disallow: {
                to: {
                  element: {
                    type: ["feature", "library"],
                  },
                },
              },
              message:
                "scenario boundaries cannot import architecture elements: {{ dependency.source }}",
            },
            {
              from: {
                element: {
                  type: "feature",
                  captured: {
                    domain: "domain-10",
                    layer: "layer-10",
                    feature: "feature-05",
                  },
                },
              },
              disallow: [
                {
                  to: {
                    element: {
                      type: "feature",
                      captured: {
                        domain: "domain-01",
                        layer: "layer-10",
                      },
                    },
                  },
                },
              ],
              message:
                "cross-domain import blocked from {{ from.element.captured.domain }} to {{ to.element.captured.domain }}",
            },
            {
              from: {
                element: {
                  type: "feature",
                  captured: {
                    domain: "domain-09",
                    layer: "layer-09",
                    feature: "feature-02",
                  },
                },
              },
              disallow: [
                {
                  to: {
                    element: {
                      type: "feature",
                      captured: {
                        domain: "domain-02",
                        feature: "feature-02",
                      },
                    },
                  },
                },
              ],
              message:
                "cross-domain import blocked from {{ from.element.captured.domain }} to {{ to.element.captured.domain }}",
            },
            ...STRESS_ELEMENT_TYPES_RULES,
          ],
        },
      ],
      "boundaries/no-unknown-dependencies": ["error"],
      "boundaries/no-unknown-files": ["error"],
      "boundaries/no-ignored-dependencies": ["error"],
    },
  },
];
