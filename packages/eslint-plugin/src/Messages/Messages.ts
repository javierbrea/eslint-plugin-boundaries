import type {
  DependencyDescription,
  DependencyMatchResult,
  BaseElementSelectorData,
  DependencyDataSelectorData,
} from "@boundaries/elements";

import { isArray, isObject } from "../Support";

/**
 * Wraps a value in double quotes.
 */
function quote(value: unknown): string {
  return `"${String(value)}"`;
}

/**
 * Joins message parts with commas and a final "and".
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
 */
function formatPropertyValue(value: unknown): string {
  if (isArray(value)) {
    return value.map((entry) => quote(entry)).join(", ");
  }
  return quote(value);
}

/**
 * Capitalizes the first character of a message.
 */
function capitalizeFirstLetter(message: string): string {
  if (!message.length) {
    return message;
  }
  return `${message.charAt(0).toUpperCase()}${message.slice(1)}`;
}

/**
 * Builds message fragments from a selector-driven list of properties.
 */
function buildElementPropertyFragments(
  elementDescription:
    | DependencyDescription["from"]
    | DependencyDescription["to"],
  properties: string[],
  options?: { capturedKeys?: string[] }
): string[] {
  const fragments: string[] = [];
  for (const propertyName of properties) {
    const value =
      elementDescription[propertyName as keyof typeof elementDescription];
    if (value === undefined || value === null) {
      continue;
    }
    if (propertyName === "captured" && isObject(value)) {
      const capturedKeys = options?.capturedKeys ?? Object.keys(value);
      for (const capturedKey of capturedKeys) {
        const capturedValue = value[capturedKey as keyof typeof value];
        if (capturedValue !== undefined && capturedValue !== null) {
          fragments.push(
            `${capturedKey} ${formatPropertyValue(capturedValue)}`
          );
        }
      }
      continue;
    }
    fragments.push(`${propertyName} ${formatPropertyValue(value)}`);
  }
  return fragments;
}

/**
 * Describes elements using the selected relevant properties.
 */
export function elementDescriptionMessage(
  elementDescription:
    | DependencyDescription["from"]
    | DependencyDescription["to"],
  properties: string[]
): string {
  const propertyFragments = buildElementPropertyFragments(
    elementDescription,
    properties
  );
  if (!propertyFragments.length) {
    return "elements";
  }
  return `elements of ${joinWithCommasAndAnd(propertyFragments)}`;
}

/**
 * Describes elements using selector-driven relevant properties and captured keys.
 */
function elementDescriptionMessageFromSelector(
  elementDescription:
    | DependencyDescription["from"]
    | DependencyDescription["to"],
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
  const propertyFragments = buildElementPropertyFragments(
    elementDescription,
    properties,
    {
      capturedKeys,
    }
  );
  if (!propertyFragments.length) {
    return null;
  }
  return `elements of ${joinWithCommasAndAnd(propertyFragments)}`;
}

/**
 * Builds message fragments for dependency metadata from selected properties.
 */
function buildDependencyPropertyFragments(
  dependencyMetadata: DependencyDescription["dependency"],
  properties: string[],
  options?: { relationshipKeys?: Array<"from" | "to"> }
): string[] {
  const fragments: string[] = [];
  for (const propertyName of properties) {
    const value =
      dependencyMetadata[propertyName as keyof typeof dependencyMetadata];
    if (value === undefined || value === null) {
      continue;
    }
    if (propertyName === "relationship" && isObject(value)) {
      const relationshipKeys = options?.relationshipKeys ?? ["from", "to"];
      if (
        relationshipKeys.includes("from") &&
        value.from !== undefined &&
        value.from !== null
      ) {
        fragments.push(`relationship from ${formatPropertyValue(value.from)}`);
      }
      if (
        relationshipKeys.includes("to") &&
        value.to !== undefined &&
        value.to !== null
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
 */
export function dependencyDescriptionMessage(
  dependencyMetadata: DependencyDescription["dependency"],
  properties: string[]
): string {
  const propertyFragments = buildDependencyPropertyFragments(
    dependencyMetadata,
    properties
  );
  if (!propertyFragments.length) {
    return "dependencies";
  }
  return `dependencies of ${joinWithCommasAndAnd(propertyFragments)}`;
}

/**
 * Describes dependency metadata using selector-driven relevant properties.
 */
function dependencyDescriptionMessageFromSelector(
  dependencyMetadata: DependencyDescription["dependency"],
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
    }
  );
  if (!propertyFragments.length) {
    return null;
  }
  return `dependencies of ${joinWithCommasAndAnd(propertyFragments)}`;
}

/**
 * Builds the default message for element-types violations from the matching selector data.
 */
export function elementTypesDefaultErrorMessage(
  matchResult: DependencyMatchResult | null,
  dependency: DependencyDescription
): string {
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

  // TODO: Add "by default", and "There is no rule allowing this kind of dependency" when appropriate, based on ruleMatch index
  let message = "Dependencies are not allowed";

  // TODO: Add "Denied at rule index #"

  if (dependencyPart && toPart && fromPart) {
    message = `${dependencyPart}, to ${toPart}, are not allowed in ${fromPart}`;
  } else if (dependencyPart && toPart) {
    message = `${dependencyPart}, to ${toPart}, are not allowed`;
  } else if (dependencyPart && fromPart) {
    message = `${dependencyPart} are not allowed in ${fromPart}`;
  } else if (toPart && fromPart) {
    message = `Dependencies to ${toPart} are not allowed in ${fromPart}`;
  } else if (toPart) {
    message = `Dependencies to ${toPart} are not allowed`;
  } else if (fromPart) {
    message = `Dependencies are not allowed in ${fromPart}`;
  } else if (dependencyPart) {
    message = `${dependencyPart} are not allowed`;
  }

  return capitalizeFirstLetter(message);
}
