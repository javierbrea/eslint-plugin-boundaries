const { isString, isArray, replaceObjectValuesInTemplates } = require("./utils");
const { micromatchPatternReplacingObjectValues } = require("./rules");

function quote(str) {
  return `'${str}'`;
}

function typeMessage(elementMatcher) {
  return `elements of type ${quote(elementMatcher)}`;
}

function micromatchPatternMessage(micromatchPatterns, elementCapturedValues) {
  const micromatchPatternsWithValues = micromatchPatternReplacingObjectValues(
    micromatchPatterns,
    elementCapturedValues
  );
  if (isString(micromatchPatternsWithValues)) {
    return quote(micromatchPatternsWithValues);
  }
  if (isArray(micromatchPatternsWithValues)) {
    if (micromatchPatternsWithValues.length === 1) {
      return quote(micromatchPatternsWithValues[0]);
    }
    return micromatchPatternsWithValues.reduce((message, micromatchPattern, index) => {
      if (index === 0) {
        return quote(micromatchPattern);
      }
      if (index === micromatchPatternsWithValues.length - 1) {
        return `${message} or ${quote(micromatchPattern)}`;
      }
      return `${message}, ${quote(micromatchPattern)}`;
    }, "");
  }
}

function capturedValuesMatcherMessage(capturedValuesPattern, elementCapturedValues) {
  const capturedValuesPatternKeys = Object.keys(capturedValuesPattern);
  return capturedValuesPatternKeys
    .map((key) => {
      return [key, capturedValuesPattern[key]];
    })
    .reduce((message, propertyNameAndMatcher, index) => {
      const concater =
        capturedValuesPatternKeys.length > 1 && index === capturedValuesPatternKeys.length - 1
          ? " and"
          : " with";
      return `${message}${concater} ${propertyNameAndMatcher[0]} ${micromatchPatternMessage(
        propertyNameAndMatcher[1],
        elementCapturedValues
      )}`;
    }, "");
}

function elementMatcherMessage(elementMatcher, elementCapturedValues) {
  if (isString(elementMatcher)) {
    return typeMessage(elementMatcher);
  }
  return `${typeMessage(elementMatcher[0])}${capturedValuesMatcherMessage(
    elementMatcher[1],
    elementCapturedValues
  )}`;
}

function ruleElementMessage(elementPatterns, elementCapturedValues) {
  if (isString(elementPatterns)) {
    return elementMatcherMessage(elementPatterns, elementCapturedValues);
  }
  if (isArray(elementPatterns)) {
    if (elementPatterns.length === 1) {
      return elementMatcherMessage(elementPatterns[0], elementCapturedValues);
    }
    return elementPatterns.reduce((message, elementPattern, index) => {
      if (index === 0) {
        return elementMatcherMessage(elementPattern, elementCapturedValues);
      }
      return `${message}, or ${elementMatcherMessage(elementPattern, elementCapturedValues)}`;
    }, "");
  }
}

function customErrorMessage(message, file, dependency) {
  return replaceObjectValuesInTemplates(
    replaceObjectValuesInTemplates(message, { ...file.capturedValues, type: file.type }, "file"),
    { ...dependency.capturedValues, type: dependency.type },
    "dependency"
  );
}

module.exports = {
  quote,
  ruleElementMessage,
  customErrorMessage,
};
