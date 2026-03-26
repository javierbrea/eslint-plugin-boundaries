import type {
  ElementDescriptor,
  ElementDescriptors,
  FileDescriptors,
} from "../Descriptor";
import { isObjectWithAnyOfProperties } from "../Shared";

import type {
  LegacyElementDescriptor,
  LegacyElementDescriptors,
} from "./Descriptor.types";
import { ELEMENT_DESCRIPTOR_MODES_MAP } from "./Descriptor.types";

/**
 * Determines if the given descriptor is a legacy element descriptor.
 * @param descriptor The descriptor to check.
 * @returns True if the descriptor is a legacy element descriptor, false otherwise.
 */
export function isLegacyElementDescriptor(
  descriptor: ElementDescriptor | LegacyElementDescriptor
): descriptor is LegacyElementDescriptor {
  return isObjectWithAnyOfProperties(descriptor, ["mode", "category"]);
}

/**
 * Determines if the given descriptors array contains any legacy element descriptors.
 * @param descriptors The descriptors to check.
 * @returns True if the descriptors array contains any legacy element descriptors, false otherwise.
 */
export function isLegacyElementDescriptors(
  descriptors: ElementDescriptors | LegacyElementDescriptors
): descriptors is LegacyElementDescriptors {
  return descriptors.some(isLegacyElementDescriptor);
}

/**
 * Determines if the given element descriptors and file descriptors are legacy. Legacy element descriptors cannot be used with file descriptors, so if any file descriptors are provided, the function will throw an error.
 * @param elementDescriptors The element descriptors to check.
 * @param fileDescriptors The file descriptors to check.
 * @returns True if the element descriptors are legacy, false otherwise.
 * @throws Error if file descriptors are provided, since legacy element descriptors cannot be used with file descriptors.
 */
export function isLegacyDescriptors(
  elementDescriptors: ElementDescriptors | LegacyElementDescriptors,
  fileDescriptors: FileDescriptors
): elementDescriptors is LegacyElementDescriptors {
  const isLegacy = isLegacyElementDescriptors(elementDescriptors);
  if (fileDescriptors.length > 0) {
    throw new Error(
      "Legacy element descriptors cannot be used with file descriptors. Please update the element descriptors to the new format."
    );
  }
  return isLegacy;
}

/**
 * Converts legacy element descriptors to the new format. Legacy element descriptors with mode "file" will be converted to file descriptors, while those with mode "folder" or "full" will be converted to element descriptors. The function will return an object containing the converted element descriptors and file descriptors.
 * @param legacyElementDescriptors The legacy element descriptors to convert.
 * @returns An object containing the converted element descriptors and file descriptors.
 */
export function convertLegacyElementDescriptors(
  legacyElementDescriptors: LegacyElementDescriptors
): {
  elementDescriptors: ElementDescriptors;
  fileDescriptors: FileDescriptors;
} {
  const elementDescriptors: ElementDescriptors = [];
  const fileDescriptors: FileDescriptors = [];

  legacyElementDescriptors.forEach((descriptor) => {
    if (isLegacyElementDescriptor(descriptor)) {
      const { mode } = descriptor;
      if (mode === ELEMENT_DESCRIPTOR_MODES_MAP.FILE) {
        fileDescriptors.push({
          ...descriptor,
          pattern: descriptor.pattern,
          basePattern: descriptor.basePattern || "**",
          baseCapture: descriptor.baseCapture,
          category: descriptor.category || "uncategorized",
          type: descriptor.type,
        });
      } else if (mode === ELEMENT_DESCRIPTOR_MODES_MAP.FULL) {
        elementDescriptors.push({
          ...descriptor,
          // TODO: Support category temporarily in element descriptors for backward compatibility.
          requireFullMatch: true,
        });
      }
    }
  });

  return { elementDescriptors, fileDescriptors };
}
