const { TYPES } = require("../constants/settings");

function isLegacyType(type) {
  return typeof type === "string";
}

// TODO, remove in next major version
function transformLegacyTypes(typesFromSettings) {
  const types = typesFromSettings || [];
  return types.map((type) => {
    // backward compatibility with v1
    if (isLegacyType(type)) {
      return {
        name: type,
        matchType: "parentFolders",
        pattern: `${type}/*`,
        capture: ["elementName"],
      };
    }
    // default options
    return {
      matchType: "parentFolders",
      ...type,
    };
  });
}

function getTypes(settings) {
  return transformLegacyTypes(settings[TYPES]);
}

function getTypesNames(settings) {
  return getTypes(settings).map((type) => type.name);
}

module.exports = {
  isLegacyType,
  getTypes,
  getTypesNames,
};
