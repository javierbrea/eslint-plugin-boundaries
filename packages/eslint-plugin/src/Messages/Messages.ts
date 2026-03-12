import type {
  DependencyDescription,
  DependencyMatchResult,
  BaseElementSelectorData,
  DependencyDataSelectorData,
  ElementDescription,
  ElementParent,
  ElementsDependencyInfo,
} from "@boundaries/elements";

import {
  PLUGIN_ISSUES_URL,
  isArray,
  isObject,
  isUndefined,
  isNull,
} from "../Shared";

const MESSAGE_ERROR = `Not able to create a message for this violation. Please report this at: ${PLUGIN_ISSUES_URL}`;
const NO_RULE_MESSAGE = "There is no rule allowing dependencies";

/**
 * Wraps a value in double quotes.
 * @param value - Value to quote.
 * @returns Quoted string.
 */
function quote(value: unknown): string {
  return `"${String(value)}"`;
}

/**
 * Joins message parts with commas and a final "and".
 * @param parts - List of message parts to join.
 * @returns Joined message string with proper comma and "and" placement.
 */
function joinWithCommasAndAnd(parts: string[]): string {
  if (parts.length === 0) {
    return "";
  }
  if (parts.length === 1) {
    return parts[0];
  }
  if (parts.length === 2) {
    return `${parts[0]} and ${parts[1]}`;
  }
  return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}

/**
 * Converts a primitive or array value to a quoted string representation.
 * @param value - Value to format, which can be a primitive or an array of primitives.
 * @returns Quoted string representation of the value, with arrays joined by commas.
 */
function formatPropertyValue(value: unknown): string {
  if (isArray(value)) {
    return value.map((entry) => quote(entry)).join(", ");
  }
  return quote(value);
}

/**
 * Capitalizes the first character of a message.
 * @param message - Message to capitalize.
 * @returns Message with the first character capitalized.
 */
function capitalizeFirstLetter(message: string): string {
  if (!message.length) {
    return message;
  }
  return `${message.charAt(0).toUpperCase()}${message.slice(1)}`;
}

/**
 * Builds message fragments from a selector-driven list of properties.
 * @param elementDescription - Element to describe.
 * @param properties - List of element properties to include in the description.
 * @param options - Additional options for handling specific properties like "captured".
 * @param options.capturedKeys - If "captured" is included in properties, specifies which captured keys to include in the description.
 * @returns List of formatted message fragments describing the element based on the selected properties.
 */
function buildElementPropertyFragments(
  elementDescription: ElementDescription | ElementParent,
  properties: string[],
  options?: {
    capturedKeys?: string[];
    parentProperties?: string[];
    parentCapturedKeys?: string[];
    includeNullValues?: boolean;
  }
): string[] {
  const fragments: string[] = [];
  const includeNullValues = options?.includeNullValues ?? false;
  for (const propertyName of properties) {
    if (propertyName === "parent") {
      const firstParent = (elementDescription as ElementDescription)
        .parents?.[0];
      if (!firstParent) {
        if (includeNullValues) {
          fragments.push(`parent ${quote(null)}`);
        }
        continue;
      }
      const parentProperties = options?.parentProperties ?? [];
      const parentFragments = buildElementPropertyFragments(
        firstParent,
        parentProperties,
        {
          capturedKeys: options?.parentCapturedKeys,
          includeNullValues,
        }
      );
      if (parentFragments.length) {
        fragments.push(`parent ${joinWithCommasAndAnd(parentFragments)}`);
      }
      continue;
    }

    const value =
      elementDescription[propertyName as keyof typeof elementDescription];
    if (isUndefined(value)) {
      continue;
    }
    if (isNull(value) && !includeNullValues) {
      continue;
    }
    if (propertyName === "captured") {
      if (!isObject(value) || Object.keys(value).length === 0) {
        if (!includeNullValues) {
          continue;
        }
        fragments.push(`captured ${quote(null)}`);
        continue;
      }
      const capturedKeys = options?.capturedKeys ?? Object.keys(value);
      for (const capturedKey of capturedKeys) {
        const capturedValue = value[capturedKey as keyof typeof value];
        if (isUndefined(capturedValue)) {
          continue;
        }
        if (isNull(capturedValue) && !includeNullValues) {
          continue;
        }
        fragments.push(`${capturedKey} ${formatPropertyValue(capturedValue)}`);
      }
      continue;
    }
    fragments.push(`${propertyName} ${formatPropertyValue(value)}`);
  }
  return fragments;
}

/**
 * Describes elements using the selected relevant properties.
 * @param elementDescription - Element to describe.
 * @param properties - List of element properties to include in the description.
 * @param options - Additional options for message formatting.
 * @param options.singleElement - If `true`, uses singular "element" label instead of "elements of".
 * @returns Formatted message describing the element based on the selected properties.
 */
export function elementDescriptionMessage(
  elementDescription: ElementDescription | ElementParent,
  properties: string[],
  options: { singleElement?: boolean; includeNullValues?: boolean } = {
    singleElement: false,
    includeNullValues: false,
  }
): string {
  const propertyFragments = buildElementPropertyFragments(
    elementDescription,
    properties,
    {
      includeNullValues: options.includeNullValues,
    }
  );
  if (!propertyFragments.length) {
    return "";
  }
  const elementLabel = options.singleElement ? "element" : "elements";
  return `${elementLabel} of ${joinWithCommasAndAnd(propertyFragments)}`;
}

/**
 * Describes elements using selector-driven relevant properties and captured keys.
 * @param elementDescription - Element to describe.
 * @param selectorData - Selector data that determines which properties and captured keys to include in the description.
 */
function elementDescriptionMessageFromSelector(
  elementDescription: ElementDescription | ElementParent,
  selectorData: BaseElementSelectorData | null
): string | null {
  if (!selectorData) {
    return null;
  }
  const properties = Object.keys(selectorData);
  if (!properties.length) {
    return null;
  }
  const capturedKeys = isObject(selectorData.captured)
    ? Object.keys(selectorData.captured)
    : undefined;
  const parentProperties = isObject(selectorData.parent)
    ? Object.keys(selectorData.parent)
    : undefined;
  const parentCapturedKeys =
    isObject(selectorData.parent) && isObject(selectorData.parent.captured)
      ? Object.keys(selectorData.parent.captured)
      : undefined;
  const propertyFragments = buildElementPropertyFragments(
    elementDescription,
    properties,
    {
      capturedKeys,
      parentProperties,
      parentCapturedKeys,
      includeNullValues: true,
    }
  );
  if (!propertyFragments.length) {
    return null;
  }
  return `elements of ${joinWithCommasAndAnd(propertyFragments)}`;
}

/**
 * Builds message fragments for dependency metadata from selected properties.
 * @param dependencyMetadata - Dependency metadata to describe.
 * @param properties - List of dependency metadata properties to include in the description.
 * @param options - Additional options for handling specific properties like "relationship".
 * @param options.relationshipKeys - If "relationship" is included in properties, specifies which relationship sides ("from", "to") to include in the description.
 * @returns List of formatted message fragments describing the dependency metadata.
 */
function buildDependencyPropertyFragments(
  dependencyMetadata: ElementsDependencyInfo,
  properties: string[],
  options?: {
    relationshipKeys?: Array<"from" | "to">;
    includeNullValues?: boolean;
  }
): string[] {
  const fragments: string[] = [];
  const includeNullValues = options?.includeNullValues ?? false;
  for (const propertyName of properties) {
    const value =
      dependencyMetadata[propertyName as keyof typeof dependencyMetadata];
    if (isUndefined(value)) {
      continue;
    }
    if (isNull(value) && !includeNullValues) {
      continue;
    }
    if (propertyName === "relationship" && isObject(value)) {
      const relationshipKeys = options?.relationshipKeys ?? ["from", "to"];
      if (
        relationshipKeys.includes("from") &&
        !isUndefined(value.from) &&
        (!isNull(value.from) || includeNullValues)
      ) {
        fragments.push(`relationship from ${formatPropertyValue(value.from)}`);
      }
      if (
        relationshipKeys.includes("to") &&
        !isUndefined(value.to) &&
        (!isNull(value.to) || includeNullValues)
      ) {
        fragments.push(`relationship to ${formatPropertyValue(value.to)}`);
      }
      continue;
    }
    fragments.push(`${propertyName} ${formatPropertyValue(value)}`);
  }
  return fragments;
}

/**
 * Describes dependency metadata using selected relevant properties.
 * @param dependencyMetadata - Dependency metadata to describe.
 * @param properties - List of dependency metadata properties to include in the description.
 * @returns Formatted message describing the dependency metadata based on the selected properties.
 */
export function dependencyDescriptionMessage(
  dependencyMetadata: ElementsDependencyInfo,
  properties: string[],
  options?: { includeNullValues?: boolean }
): string {
  const propertyFragments = buildDependencyPropertyFragments(
    dependencyMetadata,
    properties,
    {
      includeNullValues: options?.includeNullValues,
    }
  );
  if (!propertyFragments.length) {
    return "";
  }
  return joinWithCommasAndAnd(propertyFragments);
}

/**
 * Describes dependency metadata using selector-driven relevant properties.
 * @param dependencyMetadata - Dependency metadata to describe.
 * @param selectorData - Selector data that determines which properties and captured keys to include in the description.
 * @returns Formatted message describing the dependency metadata based on the selected properties.
 */
function dependencyDescriptionMessageFromSelector(
  dependencyMetadata: ElementsDependencyInfo,
  selectorData: DependencyDataSelectorData | null
): string | null {
  if (!selectorData) {
    return null;
  }
  const properties = Object.keys(selectorData);
  if (!properties.length) {
    return null;
  }
  const relationshipKeys = isObject(selectorData.relationship)
    ? (Object.keys(selectorData.relationship) as Array<"from" | "to">)
    : undefined;
  const propertyFragments = buildDependencyPropertyFragments(
    dependencyMetadata,
    properties,
    {
      relationshipKeys,
      includeNullValues: true,
    }
  );
  if (!propertyFragments.length) {
    return null;
  }
  return joinWithCommasAndAnd(propertyFragments);
}

function elementTypesNoRulesMatchedMessage(
  dependency: DependencyDescription
): string {
  const fromDescription = elementDescriptionMessage(dependency.from, [
    "type",
    "category",
    "captured",
  ]);
  const toDescription = elementDescriptionMessage(dependency.to, [
    "type",
    "category",
    "captured",
  ]);
  const propertyToShowInDependency = dependency.dependency.module
    ? "module"
    : "source";
  const dependencyDescription = dependencyDescriptionMessage(
    dependency.dependency,
    [propertyToShowInDependency]
  );
  const originDescription = !toDescription.length
    ? elementDescriptionMessage(dependency.to, ["origin"])
    : null;

  if (fromDescription && toDescription) {
    return `${NO_RULE_MESSAGE} from ${fromDescription} to ${toDescription}`;
  }
  if (fromDescription && dependencyDescription && originDescription) {
    return `${NO_RULE_MESSAGE} from ${fromDescription} to ${originDescription} with ${dependencyDescription}`;
  }
  if (fromDescription && dependencyDescription) {
    return `${NO_RULE_MESSAGE} from ${fromDescription} with ${dependencyDescription}`;
  }
  if (toDescription && dependencyDescription) {
    return `${NO_RULE_MESSAGE} to ${toDescription} with ${dependencyDescription}`;
  }
  if (dependencyDescription && originDescription) {
    return `${NO_RULE_MESSAGE} to ${originDescription} with ${dependencyDescription}`;
  }
  if (fromDescription) {
    return `${NO_RULE_MESSAGE} from ${fromDescription}`;
  }
  if (toDescription) {
    return `${NO_RULE_MESSAGE} to ${toDescription}`;
  }
  if (dependencyDescription) {
    return `${NO_RULE_MESSAGE} with ${dependencyDescription}`;
  }
  if (originDescription) {
    return `${NO_RULE_MESSAGE} to ${originDescription}`;
  }

  return MESSAGE_ERROR;
}

/**
 * Builds the default message for dependencies rule violations from the matching selector data.
 * @param matchResult - Result of matching the dependency against the rule's selector, containing the relevant selector data for the from/to elements and the dependency metadata.
 * @param ruleIndex - Index of the matching rule.
 * @param dependency - Described dependency that triggered the violation, used to extract element and dependency metadata for message construction.
 * @returns Formatted error message describing the violation based on the matching selector data.
 */
export function dependenciesRuleDefaultErrorMessage(
  matchResult: DependencyMatchResult | null,
  ruleIndex: number | null,
  dependency: DependencyDescription
): string {
  if (isNull(ruleIndex)) {
    return elementTypesNoRulesMatchedMessage(dependency);
  }

  const fromProperties = Object.keys(
    (matchResult?.from ?? {}) as BaseElementSelectorData
  );
  const toProperties = Object.keys(
    (matchResult?.to ?? {}) as BaseElementSelectorData
  );
  const dependencyProperties = Object.keys(
    (matchResult?.dependency ?? {}) as DependencyDataSelectorData
  );

  const fromPart = fromProperties.length
    ? elementDescriptionMessageFromSelector(
        dependency.from,
        matchResult?.from ?? null
      )
    : null;
  const toPart = toProperties.length
    ? elementDescriptionMessageFromSelector(
        dependency.to,
        matchResult?.to ?? null
      )
    : null;
  const dependencyPart = dependencyProperties.length
    ? dependencyDescriptionMessageFromSelector(
        dependency.dependency,
        matchResult?.dependency ?? null
      )
    : null;

  let message = MESSAGE_ERROR;

  if (dependencyPart && toPart && fromPart) {
    message = `Dependencies with ${dependencyPart} to ${toPart} are not allowed in ${fromPart}`;
  } else if (dependencyPart && toPart) {
    message = `Dependencies with ${dependencyPart} to ${toPart} are not allowed`;
  } else if (dependencyPart && fromPart) {
    message = `Dependencies with ${dependencyPart} are not allowed in ${fromPart}`;
  } else if (toPart && fromPart) {
    message = `Dependencies to ${toPart} are not allowed in ${fromPart}`;
  } else if (toPart) {
    message = `Dependencies to ${toPart} are not allowed`;
  } else if (fromPart) {
    message = `Dependencies are not allowed in ${fromPart}`;
  } else if (dependencyPart) {
    message = `Dependencies with ${dependencyPart} are not allowed`;
  }

  return `${capitalizeFirstLetter(message)}. Denied by rule at index ${ruleIndex}`;
}
