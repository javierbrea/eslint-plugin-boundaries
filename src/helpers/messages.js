const { isString, isArray, replaceObjectValuesInTemplates } = require("./utils");
const { micromatchPatternReplacingObjectValues } = require("./rules");

function quote(str) {
  return `'${str}'`;
}

function typeMessage(elementMatcher) {
  return `elements of type ${quote(elementMatcher)}`;
}

function propertiesConcater(properties, index) {
  if (properties.length > 1 && index === properties.length - 1) {
    return " and";
  }
  if (index === 0) {
    return " with";
  }
  return ",";
}

function micromatchPatternMessage(micromatchPatterns, elementCapturedValues) {
  const micromatchPatternsWithValues = micromatchPatternReplacingObjectValues(
    micromatchPatterns,
    elementCapturedValues
  );
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
  return quote(micromatchPatternsWithValues);
}

function capturedValuesMatcherMessage(capturedValuesPattern, elementCapturedValues) {
  const capturedValuesPatternKeys = Object.keys(capturedValuesPattern);
  return capturedValuesPatternKeys
    .map((key) => {
      return [key, capturedValuesPattern[key]];
    })
    .reduce((message, propertyNameAndMatcher, index) => {
      return `${message}${propertiesConcater(capturedValuesPatternKeys, index)} ${
        propertyNameAndMatcher[0]
      } ${micromatchPatternMessage(propertyNameAndMatcher[1], elementCapturedValues)}`;
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
  return elementMatcherMessage(elementPatterns, elementCapturedValues);
}

function elementPropertiesToReplaceInTemplate(element) {
  return {
    ...element.capturedValues,
    type: element.type,
    internalPath: element.internalPath,
    source: element.source,
  };
}

function customErrorMessage(message, file, dependency, report = {}) {
  let replacedMessage = replaceObjectValuesInTemplates(
    replaceObjectValuesInTemplates(message, elementPropertiesToReplaceInTemplate(file), "file"),
    elementPropertiesToReplaceInTemplate(dependency),
    "dependency"
  );
  if (file.parents[0]) {
    replacedMessage = replaceObjectValuesInTemplates(
      replacedMessage,
      elementPropertiesToReplaceInTemplate(file.parents[0]),
      "file.parent"
    );
  }
  if (dependency.parents[0]) {
    replacedMessage = replaceObjectValuesInTemplates(
      replacedMessage,
      elementPropertiesToReplaceInTemplate(dependency.parents[0]),
      "dependency.parent"
    );
  }
  return replaceObjectValuesInTemplates(replacedMessage, report, "report");
}

function elementCapturedValuesMessage(capturedValues) {
  if (!capturedValues) {
    return "";
  }
  const capturedValuesKeys = Object.keys(capturedValues);
  return capturedValuesKeys
    .map((key) => {
      return [key, capturedValues[key]];
    })
    .reduce((message, propertyNameAndValue, index) => {
      return `${message}${propertiesConcater(capturedValuesKeys, index)} ${
        propertyNameAndValue[0]
      } ${quote(propertyNameAndValue[1])}`;
    }, "");
}

function elementMessage(elementInfo) {
  return `of type ${quote(elementInfo.type)}${elementCapturedValuesMessage(
    elementInfo.capturedValues
  )}`;
}

module.exports = {
  quote,
  ruleElementMessage,
  customErrorMessage,
  elementMessage,
};
