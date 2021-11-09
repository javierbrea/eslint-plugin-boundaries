const ELEMENT_TYPES_DEFAULT_MESSAGE =
  "Importing elements is disallowed by default. No rule allowing this dependency was found";

function errorMessage(errors, index, defaultMessage) {
  return errors[index] || defaultMessage;
}

function elementTypesErrorMessage(errors, index, defaultMessage) {
  return errorMessage(errors, index, defaultMessage || ELEMENT_TYPES_DEFAULT_MESSAGE);
}

function elementTypesNoRuleMessage({ file, dep }) {
  return `No rule allowing this dependency was found. File is of type ${file}. Dependency is of type ${dep}`;
}

module.exports = {
  ELEMENT_TYPES_DEFAULT_MESSAGE,
  elementTypesErrorMessage,
  elementTypesNoRuleMessage,
};
