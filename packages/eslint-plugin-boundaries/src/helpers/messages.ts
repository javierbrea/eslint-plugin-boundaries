import type {
  CapturedValues,
  ElementMatcher,
  ElementMatchers,
  CapturedValuesMatcher,
} from "../constants/Options.types";
import type { ImportKind } from "../constants/settings";
import type { DependencyInfo } from "../core/DependencyInfo.types";
import type { ElementInfo, FileInfo } from "../core/ElementsInfo.types";

import { micromatchPatternReplacingObjectsValues } from "./rules";
import {
  isDependencyInfo,
  isString,
  isArray,
  replaceObjectValuesInTemplate,
} from "./utils";

export function quote(str: string | undefined | null) {
  return `'${str || ""}'`;
}

function typeMessage(elementMatcher: string) {
  return `elements of type ${quote(elementMatcher)}`;
}

function propertiesConcatenator(properties: string[], index: number) {
  if (properties.length > 1 && index === properties.length - 1) {
    return " and";
  }
  if (index === 0) {
    return " with";
  }
  return ",";
}

function micromatchPatternMessage(
  micromatchPatterns: string | undefined,
  elementCapturedValues: CapturedValues,
) {
  const micromatchPatternsWithValues = micromatchPatternReplacingObjectsValues(
    micromatchPatterns,
    { from: elementCapturedValues },
  );
  if (isArray(micromatchPatternsWithValues)) {
    if (micromatchPatternsWithValues.length === 1) {
      return quote(micromatchPatternsWithValues[0]);
    }
    return micromatchPatternsWithValues.reduce(
      (message, micromatchPattern, index) => {
        if (index === 0) {
          return quote(micromatchPattern);
        }
        if (index === micromatchPatternsWithValues.length - 1) {
          return `${message} or ${quote(micromatchPattern)}`;
        }
        return `${message}, ${quote(micromatchPattern)}`;
      },
      "",
    );
  }
  return quote(micromatchPatternsWithValues);
}

function capturedValuesMatcherMessage(
  capturedValuesPattern: CapturedValuesMatcher | undefined,
  elementCapturedValues: CapturedValues,
) {
  const capturedValuesPatternKeys = Object.keys(capturedValuesPattern || {});
  return capturedValuesPatternKeys
    .map((key) => {
      return [key, capturedValuesPattern?.[key]];
    })
    .reduce((message, propertyNameAndMatcher, index) => {
      return `${message}${propertiesConcatenator(capturedValuesPatternKeys, index)} ${
        propertyNameAndMatcher[0]
      } ${micromatchPatternMessage(propertyNameAndMatcher[1], elementCapturedValues)}`;
    }, "");
}

function elementMatcherMessage(
  elementMatcher: ElementMatcher | CapturedValuesMatcher | undefined,
  elementCapturedValues: CapturedValues,
) {
  if (!elementMatcher) {
    return "";
  }
  if (isString(elementMatcher)) {
    return typeMessage(elementMatcher);
  }
  return `${typeMessage(elementMatcher[0])}${capturedValuesMatcherMessage(
    elementMatcher[1] as CapturedValuesMatcher,
    elementCapturedValues,
  )}`;
}

export function ruleElementMessage(
  elementPatterns: ElementMatchers | undefined,
  elementCapturedValues: CapturedValues,
) {
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

function elementPropertiesToReplaceInTemplate(
  element: ElementInfo | FileInfo | DependencyInfo,
) {
  if (isDependencyInfo(element)) {
    return {
      ...element.capturedValues,
      type: element.type || "",
      internalPath: element.internalPath || "",
      source: element.source || "",
      importKind: element.importKind || "",
    };
  }
  return {
    ...element.capturedValues,
    type: element.type || "",
    internalPath: element.internalPath || "",
  };
}

export function customErrorMessage(
  message: string,
  file: FileInfo,
  dependency: DependencyInfo,
  report = {},
) {
  let replacedMessage = replaceObjectValuesInTemplate(
    replaceObjectValuesInTemplate(
      message,
      elementPropertiesToReplaceInTemplate(file),
      "file",
    ),
    elementPropertiesToReplaceInTemplate(dependency),
    "dependency",
  );
  replacedMessage = replaceObjectValuesInTemplate(
    replaceObjectValuesInTemplate(
      replacedMessage,
      elementPropertiesToReplaceInTemplate(file),
      "from",
    ),
    elementPropertiesToReplaceInTemplate(dependency),
    "target",
  );
  if (file.parents[0]) {
    replacedMessage = replaceObjectValuesInTemplate(
      replacedMessage,
      elementPropertiesToReplaceInTemplate(file.parents[0]),
      "file.parent",
    );
    replacedMessage = replaceObjectValuesInTemplate(
      replacedMessage,
      elementPropertiesToReplaceInTemplate(file.parents[0]),
      "from.parent",
    );
  }
  if (dependency.parents[0]) {
    replacedMessage = replaceObjectValuesInTemplate(
      replacedMessage,
      elementPropertiesToReplaceInTemplate(dependency.parents[0]),
      "dependency.parent",
    );
    replacedMessage = replaceObjectValuesInTemplate(
      replacedMessage,
      elementPropertiesToReplaceInTemplate(dependency.parents[0]),
      "target.parent",
    );
  }
  return replaceObjectValuesInTemplate(replacedMessage, report, "report");
}

function elementCapturedValuesMessage(capturedValues: CapturedValues) {
  if (!capturedValues) {
    return "";
  }
  const capturedValuesKeys = Object.keys(capturedValues);
  return capturedValuesKeys
    .map((key) => {
      return [key, capturedValues[key]];
    })
    .reduce((message, propertyNameAndValue, index) => {
      return `${message}${propertiesConcatenator(capturedValuesKeys, index)} ${
        propertyNameAndValue[0]
      } ${quote(propertyNameAndValue[1])}`;
    }, "");
}

export function elementMessage(elementInfo: ElementInfo) {
  return `of type ${quote(elementInfo.type)}${elementCapturedValuesMessage(
    elementInfo.capturedValues,
  )}`;
}

function hasToPrintKindMessage(
  ruleImportKind: ImportKind | undefined,
  dependencyInfo: DependencyInfo,
) {
  return ruleImportKind && dependencyInfo.importKind;
}

export function dependencyImportKindMessage(
  ruleImportKind: ImportKind | undefined,
  dependencyInfo: DependencyInfo,
) {
  if (hasToPrintKindMessage(ruleImportKind, dependencyInfo)) {
    return `kind ${quote(dependencyInfo.importKind)} from `;
  }
  return "";
}

export function dependencyUsageKindMessage(
  ruleImportKind: ImportKind | undefined,
  dependencyInfo: DependencyInfo,
  {
    suffix = " ",
    prefix = "",
  }: {
    suffix?: string;
    prefix?: string;
  } = {},
) {
  if (hasToPrintKindMessage(ruleImportKind, dependencyInfo)) {
    return `${prefix}${dependencyInfo.importKind}${suffix}`;
  }
  return "";
}
