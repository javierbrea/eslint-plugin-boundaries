function errorMessage(errors, index, defaultMessage) {
  return errors[index] || defaultMessage;
}

function elementTypesErrorMessage(errors, index, defaultMessage) {
  return errorMessage(errors, index, defaultMessage);
}

function elementTypesNoRuleMessage({ file, dep }) {
  return `No rule allowing this dependency was found. File is of type ${file}. Dependency is of type ${dep}`;
}

module.exports = {
  elementTypesErrorMessage,
  elementTypesNoRuleMessage,
};
