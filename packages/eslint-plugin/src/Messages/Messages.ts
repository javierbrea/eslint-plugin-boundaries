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
  /* istanbul ignore next -- Defensive: callers always guard against empty array */
  if (parts.length === 0) {
    return "";
  }
  if (parts.length === 1) {
    return parts[0];
  }
  if (parts.length === 2) {
    return `${parts[0]} and ${parts[1]}`;
  }
  return `${parts.slice(0, -1).join(", ")} and ${parts.at(-1)}`;
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
  /* istanbul ignore next -- Defensive: capitalizeFirstLetter is always called with non-empty message strings */
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
  options: {
    capturedKeys?: string[];
    parentProperties?: string[];
    parentCapturedKeys?: string[];
    includeNullValues: boolean;
  }
): string[] {
  const includeNullValues = options.includeNullValues;
  const fragments: string[] = [];

  for (const propertyName of properties) {
    if (propertyName === "parent") {
      const parentFragment = buildParentFragment(
        elementDescription,
        options,
        includeNullValues
      );
      if (parentFragment) {
        fragments.push(parentFragment);
      }
      continue;
    }

    const value = getElementPropertyValue(elementDescription, propertyName);
    if (shouldSkipFragmentValue(value, includeNullValues)) {
      continue;
    }

    if (propertyName === "captured") {
      fragments.push(
        ...buildCapturedFragments(
          value,
          options?.capturedKeys,
          includeNullValues
        )
      );
      continue;
    }

    fragments.push(formatPropertyFragment(propertyName, value));
  }

  return fragments;
}

/**
 * Builds a message fragment for the first parent element when requested.
 * @param elementDescription - Element that may include parent information.
 * @param options - Selector-driven options for parent and captured properties.
 * @param includeNullValues - Whether null parent values should be rendered.
 * @returns Parent fragment string, or null when no parent information should be emitted.
 */
function buildParentFragment(
  elementDescription: ElementDescription | ElementParent,
  options:
    | {
        capturedKeys?: string[];
        parentProperties?: string[];
        parentCapturedKeys?: string[];
        includeNullValues?: boolean;
      }
    | undefined,
  includeNullValues: boolean
): string | null {
  const firstParent = (elementDescription as ElementDescription).parents?.[0];
  if (!firstParent) {
    return includeNullValues ? `parent ${quote(null)}` : null;
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

  if (!parentFragments.length) {
    return null;
  }

  return `parent ${joinWithCommasAndAnd(parentFragments)}`;
}

/**
 * Reads an element property value using a dynamic property name.
 * @param elementDescription - Element metadata source object.
 * @param propertyName - Property name to read.
 * @returns Raw value for the requested property.
 */
function getElementPropertyValue(
  elementDescription: ElementDescription | ElementParent,
  propertyName: string
): unknown {
  return elementDescription[propertyName as keyof typeof elementDescription];
}

/**
 * Determines whether a property value should be skipped when building fragments.
 * @param value - Property value to evaluate.
 * @param includeNullValues - Whether null values are allowed in output.
 * @returns True when the value should be ignored for message output.
 */
function shouldSkipFragmentValue(
  value: unknown,
  includeNullValues: boolean
): boolean {
  return isUndefined(value) || (isNull(value) && !includeNullValues);
}

/**
 * Builds captured-property message fragments from selected captured keys.
 * @param value - Captured value container to inspect.
 * @param capturedKeys - Captured keys selected by the selector.
 * @param includeNullValues - Whether empty captured values should render as null.
 * @returns List of captured fragments ready to be joined in a message.
 */
function buildCapturedFragments(
  value: unknown,
  capturedKeys: string[] | undefined,
  includeNullValues: boolean
): string[] {
  if (!isObject(value) || Object.keys(value).length === 0) {
    return includeNullValues ? [`captured ${quote(null)}`] : [];
  }

  const fragments: string[] = [];
  const keys = capturedKeys ?? Object.keys(value);

  for (const capturedKey of keys) {
    const capturedValue = value[capturedKey];
    if (isUndefined(capturedValue)) {
      continue;
    }
    fragments.push(`${capturedKey} ${formatPropertyValue(capturedValue)}`);
  }

  return fragments;
}

/**
 * Formats a generic property fragment using key and value.
 * @param propertyName - Property name label.
 * @param value - Property value to serialize.
 * @returns Formatted property fragment.
 */
function formatPropertyFragment(propertyName: string, value: unknown): string {
  return `${propertyName} ${formatPropertyValue(value)}`;
}

/**
 * Determines whether a dependency property value should be rendered.
 * @param value - Property value to evaluate.
 * @param includeNullValues - Whether null values should be included in the output.
 * @returns True when the value should be rendered.
 */
function shouldRenderDependencyValue(
  value: unknown,
  includeNullValues: boolean
): boolean {
  return !isUndefined(value) && (!isNull(value) || includeNullValues);
}

/**
 * Builds a relationship-side fragment when the selected side should be rendered.
 * @param relationship - Relationship metadata value.
 * @param relationshipKey - Relationship side to describe.
 * @param includeNullValues - Whether null values should be included in the output.
 * @returns Formatted relationship fragment, or null when the side should be ignored.
 */
function buildRelationshipFragment(
  relationship: NonNullable<ElementsDependencyInfo["relationship"]>,
  relationshipKey: "from" | "to",
  includeNullValues: boolean
): string | null {
  const relationshipValue = relationship[relationshipKey];
  if (!shouldRenderDependencyValue(relationshipValue, includeNullValues)) {
    return null;
  }
  return `relationship ${relationshipKey} ${formatPropertyValue(relationshipValue)}`;
}

/**
 * Builds message fragments for selected relationship sides.
 * @param relationship - Relationship metadata value.
 * @param relationshipKeys - Relationship sides to include.
 * @param includeNullValues - Whether null values should be included in the output.
 * @returns List of relationship fragments.
 */
function buildRelationshipFragments(
  relationship: NonNullable<ElementsDependencyInfo["relationship"]>,
  relationshipKeys: Array<"from" | "to"> | undefined,
  includeNullValues: boolean
): string[] {
  const fragments: string[] = [];
  for (const relationshipKey of relationshipKeys ?? ["from", "to"]) {
    const fragment = buildRelationshipFragment(
      relationship,
      relationshipKey,
      includeNullValues
    );
    if (fragment) {
      fragments.push(fragment);
    }
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
  {
    singleElement = false,
    includeNullValues = false,
  }: { singleElement?: boolean; includeNullValues?: boolean } = {}
): string {
  const propertyFragments = buildElementPropertyFragments(
    elementDescription,
    properties,
    {
      includeNullValues,
    }
  );
  if (!propertyFragments.length) {
    return "";
  }
  const elementLabel = singleElement ? "element" : "elements";
  return `${elementLabel} of ${joinWithCommasAndAnd(propertyFragments)}`;
}

/**
 * Describes elements using selector-driven relevant properties and captured keys.
 * @param elementDescription - Element to describe.
 * @param selectorData - Selector data that determines which properties and captured keys to include in the description.
 */
export function elementDescriptionMessageFromSelector(
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
    if (!shouldRenderDependencyValue(value, includeNullValues)) {
      continue;
    }
    if (propertyName === "relationship" && isObject(value)) {
      fragments.push(
        ...buildRelationshipFragments(
          value,
          options?.relationshipKeys,
          includeNullValues
        )
      );
      continue;
    }
    fragments.push(formatPropertyFragment(propertyName, value));
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
export function dependencyDescriptionMessageFromSelector(
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

/**
 * Resolves the fallback no-rules message from available description fragments.
 * @param fromDescription - Description of the source element.
 * @param toDescription - Description of the target element.
 * @param dependencyDescription - Description of dependency metadata.
 * @param originDescription - Optional origin description when target details are not available.
 * @returns The most specific no-rules message that can be composed.
 */
function resolveNoRulesMatchedMessage(
  fromDescription: string,
  toDescription: string,
  dependencyDescription: string,
  originDescription: string | null
): string {
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
 * Builds the fallback no-rules message when no rule matches a dependency.
 * @param dependency - Dependency description used to derive message details.
 * @returns Human-readable fallback message for no-rules scenarios.
 */
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

  return resolveNoRulesMatchedMessage(
    fromDescription,
    toDescription,
    dependencyDescription,
    originDescription
  );
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
    ? elementDescriptionMessageFromSelector(dependency.from, matchResult!.from)
    : null;
  const toPart = toProperties.length
    ? elementDescriptionMessageFromSelector(dependency.to, matchResult!.to)
    : null;
  const dependencyPart = dependencyProperties.length
    ? dependencyDescriptionMessageFromSelector(
        dependency.dependency,
        matchResult!.dependency
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
