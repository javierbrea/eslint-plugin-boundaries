import type {
  DependencyKind,
  CapturedValuesSelector,
  ElementSelector,
  ElementParent,
  ElementsSelector,
  CapturedValues,
  DependencyDescription,
  ElementDescription,
} from "@boundaries/elements";
import {
  isElementDescription,
  isElementSelector,
  normalizeElementsSelector,
} from "@boundaries/elements";

import type { RuleMatcherElementsCapturedValues } from "../Settings";
import { isString, isArray } from "../Support";

function replaceObjectValueInTemplate(
  template: string,
  key: string,
  value: string,
  namespace?: string | null
) {
  const keyToReplace = namespace ? `${namespace}.${key}` : key;
  const regexp = new RegExp(`\\$\\{${keyToReplace}\\}`, "g");
  return template.replace(regexp, value);
}

export function replaceObjectValuesInTemplates(
  strings: string | string[],
  object: Record<string, string>,
  namespace?: string | null
): string | string[] {
  const finalResult = isArray(strings) ? [...strings] : strings;
  return Object.keys(object).reduce((result, objectKey) => {
    // If template is an array, replace key by value in all patterns
    if (isArray(result)) {
      return result.map((resultEntry) => {
        return replaceObjectValueInTemplate(
          resultEntry,
          objectKey,
          object[objectKey],
          namespace
        );
      });
    }
    return replaceObjectValueInTemplate(
      result,
      objectKey,
      object[objectKey],
      namespace
    );
  }, finalResult);
}

export function replaceObjectValuesInTemplate(
  template: string,
  object: Record<string, string>,
  namespace?: string | null
): string {
  return replaceObjectValuesInTemplates(template, object, namespace) as string;
}

export function quote(str: string | undefined | null) {
  return `'${str || ""}'`;
}

function typeMessage(elementMatcher: string) {
  return `elements of type ${quote(elementMatcher)}`;
}

function categoryMessage(category: string) {
  return `category ${quote(category)}`;
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

export function micromatchPatternReplacingObjectsValues(
  pattern: string | string[] | undefined,
  object: Partial<RuleMatcherElementsCapturedValues>
) {
  let patternToReplace = pattern;
  if (!patternToReplace) {
    return "";
  }
  // Backward compatibility. Possibly unused, because the value is already replaced in the next step.
  // For the moment, keep it to avoid unexpected issues until the oncoming refactor.
  if (object.from) {
    patternToReplace = replaceObjectValuesInTemplates(
      patternToReplace,
      object.from
    ) as string;
  }
  return Object.keys(object).reduce((replacedPattern, namespace) => {
    if (!object[namespace as keyof typeof object]) {
      return replacedPattern;
    }
    return replaceObjectValuesInTemplates(
      replacedPattern,
      object[namespace as keyof typeof object] || {},
      namespace
    ) as string;
  }, patternToReplace);
}

function micromatchPatternMessage(
  micromatchPatterns: string | undefined,
  elementCapturedValues: CapturedValues | null
) {
  const micromatchPatternsWithValues = micromatchPatternReplacingObjectsValues(
    micromatchPatterns,
    { from: elementCapturedValues || {} }
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
      ""
    );
  }
  return quote(micromatchPatternsWithValues);
}

function capturedValuesMatcherMessage(
  capturedValuesPattern: CapturedValuesSelector | undefined,
  elementCapturedValues: CapturedValues | null
) {
  const capturedValuesPatternKeys = Object.keys(capturedValuesPattern || {});
  return capturedValuesPatternKeys
    .map((key) => {
      return [key, capturedValuesPattern?.[key]];
    })
    .reduce((message, propertyNameAndMatcher, index) => {
      return `${message}${propertiesConcatenator(capturedValuesPatternKeys, index)} ${
        propertyNameAndMatcher[0]
        // TODO: Support array patterns
      } ${micromatchPatternMessage(propertyNameAndMatcher[1] as string, elementCapturedValues)}`;
    }, "");
}

function elementMatcherMessage(
  elementMatcher: ElementSelector | CapturedValuesSelector | undefined,
  elementCapturedValues: CapturedValues | null
) {
  if (!elementMatcher) {
    return "";
  }
  if (isElementSelector(elementMatcher)) {
    const selector = normalizeElementsSelector(elementMatcher);
    const parts: string[] = [];
    const toAdd: string[] = [];
    if (selector[0].type) {
      // @ts-expect-error Types have to be aligned properly
      toAdd.push(typeMessage(selector[0].type));
    }
    if (selector[0].category) {
      toAdd.push(
        propertiesConcatenator(parts, parts.length + toAdd.length + 1),
        // @ts-expect-error Types have to be aligned properly
        categoryMessage(selector[0].category)
      );
    }
    if (selector[0].captured) {
      toAdd.push(
        capturedValuesMatcherMessage(
          selector[0].captured,
          elementCapturedValues
        )
      );
    }
    parts.push(...toAdd);
    return parts.map((part) => part.trim()).join(" ");
  }
  // Backward compatibility. Code should not reach here normally.
  if (isString(elementMatcher)) {
    return typeMessage(elementMatcher);
  }
  // TODO: Support array patterns
  return `${typeMessage(elementMatcher[0] as string)}${capturedValuesMatcherMessage(
    elementMatcher[1] as unknown as CapturedValuesSelector,
    elementCapturedValues
  )}`;
}

export function ruleElementMessage(
  elementPatterns: ElementsSelector | undefined,
  elementCapturedValues: CapturedValues | null
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
  element: ElementDescription | ElementParent,
  importKind: string
) {
  if (isElementDescription(element)) {
    return {
      ...element.captured,
      type: element.type || "",
      internalPath: element.internalPath || "",
      source: element.source || "",
      importKind: importKind || "",
    };
  }
  return {
    ...element.captured,
    type: element.type || "",
    internalPath: "",
    source: "",
    importKind: importKind || "",
  };
}

export function customErrorMessage(
  message: string,
  dependency: DependencyDescription,
  report = {}
) {
  let replacedMessage = replaceObjectValuesInTemplate(
    replaceObjectValuesInTemplate(
      message,
      elementPropertiesToReplaceInTemplate(
        dependency.from,
        dependency.dependency.kind
      ),
      "file"
    ),
    elementPropertiesToReplaceInTemplate(
      dependency.to,
      dependency.dependency.kind
    ),
    "dependency"
  );
  replacedMessage = replaceObjectValuesInTemplate(
    replaceObjectValuesInTemplate(
      replacedMessage,
      elementPropertiesToReplaceInTemplate(
        dependency.from,
        dependency.dependency.kind
      ),
      "from"
    ),
    elementPropertiesToReplaceInTemplate(
      dependency.to,
      dependency.dependency.kind
    ),
    "target"
  );
  if (dependency.from.parents?.[0]) {
    replacedMessage = replaceObjectValuesInTemplate(
      replacedMessage,
      elementPropertiesToReplaceInTemplate(
        dependency.from.parents?.[0],
        dependency.dependency.kind
      ),
      "file.parent"
    );
    replacedMessage = replaceObjectValuesInTemplate(
      replacedMessage,
      elementPropertiesToReplaceInTemplate(
        dependency.from.parents?.[0],
        dependency.dependency.kind
      ),
      "from.parent"
    );
  }
  if (dependency.to.parents?.[0]) {
    replacedMessage = replaceObjectValuesInTemplate(
      replacedMessage,
      elementPropertiesToReplaceInTemplate(
        dependency.to.parents?.[0],
        dependency.dependency.kind
      ),
      "dependency.parent"
    );
    replacedMessage = replaceObjectValuesInTemplate(
      replacedMessage,
      elementPropertiesToReplaceInTemplate(
        dependency.to.parents?.[0],
        dependency.dependency.kind
      ),
      "target.parent"
    );
  }
  return replaceObjectValuesInTemplate(replacedMessage, report, "report");
}

function elementCapturedValuesMessage(capturedValues: CapturedValues | null) {
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

export function elementMessage(
  elementInfo: ElementDescription | ElementParent
) {
  return `of type ${quote(elementInfo.type)}${elementCapturedValuesMessage(
    elementInfo.captured
  )}`;
}

function hasToPrintKindMessage(
  ruleImportKind: DependencyKind | undefined,
  dependency: DependencyDescription
) {
  return ruleImportKind && dependency.dependency.kind;
}

export function dependencyImportKindMessage(
  ruleImportKind: DependencyKind | undefined,
  dependency: DependencyDescription
) {
  if (hasToPrintKindMessage(ruleImportKind, dependency)) {
    return `kind ${quote(dependency.dependency.kind)} from `;
  }
  return "";
}

export function dependencyUsageKindMessage(
  ruleImportKind: DependencyKind | undefined,
  dependency: DependencyDescription,
  {
    suffix = " ",
    prefix = "",
  }: {
    suffix?: string;
    prefix?: string;
  } = {}
) {
  if (hasToPrintKindMessage(ruleImportKind, dependency)) {
    return `${prefix}${dependency.dependency.kind}${suffix}`;
  }
  return "";
}
