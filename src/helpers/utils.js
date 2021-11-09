function isString(object) {
  return typeof object === "string";
}

function isArray(object) {
  return Array.isArray(object);
}

function replaceObjectValueInTemplate(template, key, value, namespace) {
  const keyToReplace = namespace ? `${namespace}.${key}` : key;
  return template.replace(`\${${keyToReplace}}`, value);
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
  replaceObjectValuesInTemplates,
};
