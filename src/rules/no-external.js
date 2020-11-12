const { PLUGIN_NAME } = require("../constants/plugin");
const { RULE_NO_EXTERNAL } = require("../constants/settings");
const { meta, dependencyLocation, getContextInfo, checkOptions } = require("../helpers/rules");
const { getDependencyInfo, isNotRecognizedOrIgnored } = require("../helpers/elements");

const forbiddenSpecifiers = (forbiddenSpecifierNames, specifiers) => {
  if (!forbiddenSpecifierNames) {
    return [];
  }
  const importedSpecifiersNames = specifiers
    .filter((specifier) => {
      return specifier.type === "ImportSpecifier" && specifier.imported.name;
    })
    .map((specifier) => specifier.imported.name);
  return forbiddenSpecifierNames.reduce((forbiddenFound, forbiddenSpecifier) => {
    if (importedSpecifiersNames.includes(forbiddenSpecifier)) {
      forbiddenFound.push(forbiddenSpecifier);
    }
    return forbiddenFound;
  }, []);
};

module.exports = {
  ...meta(`Enforce elements of one type to not use some external dependencies`, PLUGIN_NAME, [
    {
      type: "object",
      properties: {
        forbid: {
          type: "object",
        },
      },
      additionalProperties: true,
    },
  ]),

  create: function (context) {
    const { currentElementInfo, fileName } = getContextInfo(context);
    if (isNotRecognizedOrIgnored(currentElementInfo)) {
      return {};
    }
    checkOptions(context, "forbid", RULE_NO_EXTERNAL);
    const forbidOptions = (context.options[0] && context.options[0].forbid) || {};
    const currentElementOptions = forbidOptions[currentElementInfo.type];
    const currentElementDestructuredOptions = {};

    if (currentElementOptions) {
      currentElementOptions.forEach((forbid) => {
        const libraryNameAsKey = Object.keys(forbid)[0];
        if (
          typeof forbid !== "string" &&
          libraryNameAsKey &&
          Array.isArray(forbid[libraryNameAsKey])
        ) {
          currentElementDestructuredOptions[libraryNameAsKey] = forbid[libraryNameAsKey];
        }
      });
    }

    return {
      ImportDeclaration: (node) => {
        const dependencyInfo = getDependencyInfo(fileName, node.source.value, context.settings);
        const cleanDependencyName = dependencyInfo.name.split("/")[0];

        if (!dependencyInfo.isLocal && currentElementOptions) {
          if (currentElementOptions.includes(cleanDependencyName)) {
            // library is not allowed
            context.report({
              message: `Usage of external module '${cleanDependencyName}' is not allowed in '${currentElementInfo.type}'`,
              type: PLUGIN_NAME,
              node: node,
              ...dependencyLocation(node, context),
            });
          } else {
            const forbiddenSpecifiersFound = forbiddenSpecifiers(
              currentElementDestructuredOptions[cleanDependencyName],
              node.source.parent.specifiers
            );
            if (forbiddenSpecifiersFound.length > 0) {
              // specifier is not allowed
              context.report({
                message: `Usage of '${forbiddenSpecifiersFound.join(
                  ", "
                )}' from external module '${cleanDependencyName}' is not allowed in '${
                  currentElementInfo.type
                }'`,
                type: PLUGIN_NAME,
                node: node,
                ...dependencyLocation(node, context),
              });
            }
          }
        }
      },
    };
  },
};
