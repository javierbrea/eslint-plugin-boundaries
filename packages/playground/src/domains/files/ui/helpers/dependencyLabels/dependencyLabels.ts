import type { SketchSpecifier } from "@/contract";
import type { FileDescription } from "@/domains/evaluation/helpers/engine";

import {
  NO_ELEMENT_LABEL,
  SPECIFIER_KIND_LABELS,
} from "./dependencyLabels.constants";
import type { ChipParts } from "./dependencyLabels.types";

/**
 * Writes what the picker shows of an element next to a file: the types of its element, joined with a comma.
 * @param description The description of the file, or `undefined` when the engine has none for it.
 * @returns The types, or `no element` when no element descriptor matches the file.
 */
export function getFileOptionLabel(
  description: FileDescription | undefined
): string {
  const types = description?.element.types ?? [];

  return types.length === 0 ? NO_ELEMENT_LABEL : types.join(", ");
}

/**
 * Splits a name of a statement in the parts of its chip: its kind and its name, with the alias after `as` when it has one.
 * @param specifier The name.
 * @returns The two parts, so that the chip draws the kind apart from the name.
 */
export function getChipParts(specifier: SketchSpecifier): ChipParts {
  const { alias } = specifier;
  const specifierName = specifier.name;

  return {
    kind: SPECIFIER_KIND_LABELS[specifier.kind],
    name: alias === undefined ? specifierName : `${specifierName} as ${alias}`,
  };
}

/**
 * Writes the text of the chip of a name, such as `default format`, `named round as r` or `namespace ns`.
 * @param specifier The name.
 * @returns The kind and the name joined by a space.
 */
export function getChipLabel(specifier: SketchSpecifier): string {
  const { kind, name: chipName } = getChipParts(specifier);

  return `${kind} ${chipName}`;
}
