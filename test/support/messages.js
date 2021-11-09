const ELEMENT_TYPES_DEFAULT_MESSAGE =
  "Importing elements is disallowed by default. No rule allowing this dependency was found";

function errorMessage(errors, index, defaultMessage) {
  return errors[index] || defaultMessage;
}

function elementTypesErrorMessage(errors, index) {
  return errorMessage(errors, index, ELEMENT_TYPES_DEFAULT_MESSAGE);
}

module.exports = {
  ELEMENT_TYPES_DEFAULT_MESSAGE,
  elementTypesErrorMessage,
};
