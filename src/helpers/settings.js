const { TYPES, ELEMENTS, VALID_MODES } = require("../constants/settings");
const { isString } = require("./utils");

function isLegacyType(type) {
  return isString(type);
}

// TODO, remove in next major version
function transformLegacyTypes(typesFromSettings) {
  const types = typesFromSettings || [];
  return types.map((type) => {
    // backward compatibility with v1
    if (isLegacyType(type)) {
      return {
        type: type,
        match: VALID_MODES[0],
        pattern: `${type}/*`,
        capture: ["elementName"],
      };
    }
    // default options
    return {
      match: VALID_MODES[0],
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
