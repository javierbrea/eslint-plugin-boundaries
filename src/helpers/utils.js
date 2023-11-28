function isString(object) {
  return typeof object === "string";
}

function isArray(object) {
  return Array.isArray(object);
}

function isObject(object) {
  return typeof object === "object" && object !== null && !isArray(object);
}

function getArrayOrNull(value) {
  return isArray(value) ? value : null;
}

function replaceObjectValueInTemplate(template, key, value, namespace) {
  const keyToReplace = namespace ? `${namespace}.${key}` : key;
  const regexp = new RegExp(`\\$\\{${keyToReplace}\\}`, "g");
  return template.replace(regexp, value);
}

function replaceObjectValuesInTemplates(strings, object, namespace) {
  return Object.keys(object).reduce((result, objectKey) => {
    // If template is an array, replace key by value in all patterns
    if (isArray(result)) {
      return result.map((resultEntry) => {
        return replaceObjectValueInTemplate(resultEntry, objectKey, object[objectKey], namespace);
      });
    }
    return replaceObjectValueInTemplate(result, objectKey, object[objectKey], namespace);
  }, strings);
}

module.exports = {
  isString,
  isArray,
  isObject,
  getArrayOrNull,
  replaceObjectValuesInTemplates,
};
