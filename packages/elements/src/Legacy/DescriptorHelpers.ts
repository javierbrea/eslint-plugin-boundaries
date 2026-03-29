import type { ElementDescriptor, ElementDescriptors } from "../Descriptor";
import { isObjectWithProperty, isUndefined } from "../Shared";

import type {
  LegacyElementDescriptor,
  BackwardCompatibleElementDescriptors,
  LegacyDescriptorsConfig,
  BackwardCompatibleDescriptorsConfig,
} from "./Descriptor.types";

/**
 * Determines if the given descriptor is a legacy element descriptor.
 * @param descriptor The descriptor to check.
 * @returns True if the descriptor is a legacy element descriptor, false otherwise.
 */
export function isLegacyElementDescriptor(
  descriptor: ElementDescriptor | LegacyElementDescriptor
): descriptor is LegacyElementDescriptor {
  return (
    isObjectWithProperty(descriptor, "mode") && !isUndefined(descriptor.mode)
  );
}

/**
 * Determines if the given descriptors array contains any legacy element descriptors.
 * @param descriptors The descriptors to check.
 * @returns True if the descriptors array contains any legacy element descriptors, false otherwise.
 */
export function isLegacyElementDescriptors(
  descriptors: ElementDescriptors | BackwardCompatibleElementDescriptors
): descriptors is BackwardCompatibleElementDescriptors {
  return descriptors.some(isLegacyElementDescriptor);
}

/**
 * Determines if the given element descriptors and file descriptors are legacy. Legacy element descriptors cannot be used with file descriptors, so if any file descriptors are provided, the function will throw an error.
 * @param elementDescriptors The element descriptors to check.
 * @param fileDescriptors The file descriptors to check.
 * @returns True if the element descriptors are legacy, false otherwise.
 * @throws Error if file descriptors are provided, since legacy element descriptors cannot be used with file descriptors.
 */
export function isLegacyDescriptorsConfig(
  descriptors: BackwardCompatibleDescriptorsConfig
): descriptors is LegacyDescriptorsConfig {
  if (!descriptors.elements) {
    return false;
  }
  const isLegacy = isLegacyElementDescriptors(descriptors.elements);
  if (descriptors.files) {
    throw new Error(
      "Legacy element descriptors cannot be used with file descriptors. Please update the element descriptors to the new format."
    );
  }
  return isLegacy;
}
