const { RULE_NO_EXTERNAL_V2 } = require("../constants/settings");

const { meta2 } = require("../helpers/rules");
const { fileInfo } = require("../core/elementsInfo");
const { dependencyInfo } = require("../core/dependencyInfo");

const {
  TYPES_MATCHER_SCHEMA,
  validateTypesMatcher,
  validateSettings,
} = require("../helpers/validations");

function validateOptionsMatchers(matchers = [], settings) {
  matchers.forEach((matcher) => {
    validateTypesMatcher(matcher.from, settings);
  });
}

function validateOptions(options, settings) {
  validateOptionsMatchers(options.disallow, settings);
}

module.exports = {
  ...meta2({
    ruleName: RULE_NO_EXTERNAL_V2,
    description: `Enforce elements of one type to not use some external dependencies`,
    schema: [
      {
        type: "object",
        properties: {
          disallow: {
            type: "array",
            items: {
              type: "object",
              properties: {
                from: TYPES_MATCHER_SCHEMA,
                target: {
                  oneOf: [
                    {
                      type: "string",
                    },
                    {
                      type: "array",
                      items: {
                        oneOf: [
                          {
                            type: "string",
                          },
                          {
                            type: "array",
                            items: [
                              {
                                type: "string",
                              },
                              {
                                type: "object",
                                properties: {
                                  specifiers: {
                                    type: "array",
                                    items: {
                                      type: "string",
                                    },
                                  },
                                },
                                additionalProperties: false,
                              },
                            ],
                          },
                        ],
                      },
                    },
                  ],
                },
              },
              additionalProperties: false,
            },
          },
        },
        additionalProperties: false,
      },
    ],
  }),

  create: function (context) {
    const options = context.options[0];
    const file = fileInfo(context);
    if (!options || file.isIgnored || !file.type) {
      return {};
    }

    validateOptions(options, context.settings);
    validateSettings(context.settings);

    return {
      ImportDeclaration: (node) => {
        const dependency = dependencyInfo(node.source.value, context);

        console.log("-----------------------------------");
        console.log("file");
        console.log(JSON.stringify(file, null, 2));
        console.log("dependency");
        console.log(JSON.stringify(dependency, null, 2));
      },
    };
  },
};
