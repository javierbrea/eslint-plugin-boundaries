const { TYPES, ELEMENTS, VALID_MATCH_TYPES } = require("../constants/settings");

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
        type: type,
        match: VALID_MATCH_TYPES[0],
        pattern: `${type}/*`,
        capture: ["elementName"],
      };
    }
    // default options
    return {
      match: VALID_MATCH_TYPES[0],
      ...type,
    };
  });
}

function getElements(settings) {
  return transformLegacyTypes(settings[ELEMENTS] || settings[TYPES]);
}

function getElementsTypeNames(settings) {
  return getElements(settings).map((element) => element.type);
}

module.exports = {
  isLegacyType,
  getElements,
  getElementsTypeNames,
};
