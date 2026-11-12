import type {
  DependencyDescription,
  EntityDescription,
} from "@/domains/evaluation/helpers/engine";
import { formatValue } from "@/domains/files/ui/helpers/formatValue";
import type { DescribedValue } from "@/domains/files/ui/helpers/formatValue";
import type { EntityBoxName } from "@/domains/files/ui/helpers/inspectorPlaces";

import type { EntityBox, PropertyEntry } from "./descriptionEntries.types";

/** The properties of a box as pairs, the first of which is the one a folded box shows. */
type BoxPairs = readonly [
  first: readonly [key: string, value: DescribedValue],
  ...rest: readonly (readonly [key: string, value: DescribedValue])[],
];

/**
 * Builds a box from the pairs of its properties.
 * @param boxName Which box it is.
 * @param pairs Its properties, in order.
 * @returns The box, with the formatted value of its first property as its digest.
 */
function createBox(boxName: EntityBoxName, pairs: BoxPairs): EntityBox {
  return {
    name: boxName,
    entries: pairs.map(([key, value]) => ({ key, value })),
    digest: formatValue(pairs[0][1]),
  };
}

/**
 * Lists every property that a selector matches of an entity, in three boxes named as the selectors that match them. The selector shortcuts `type` and `parent` and the deprecated `category` are not properties of the description, so they are not here.
 * @param description What the engine says about a file of the sketch, or about the module a dependency points to.
 * @returns The `element`, `file` and `module` boxes, in that order.
 */
export function describeEntityBoxes(
  description: EntityDescription
): readonly EntityBox[] {
  const { element, file, module: moduleDescription } = description;

  return [
    createBox("element", [
      ["types", element.types],
      ["path", element.path],
      ["fileInternalPath", element.fileInternalPath],
      ["captured", element.captured],
      ["parents", element.parents],
      ["isIgnored", element.isIgnored],
      ["isUnknown", element.isUnknown],
    ]),
    createBox("file", [
      ["categories", file.categories],
      ["path", file.path],
      ["captured", file.captured],
      ["isIgnored", file.isIgnored],
      ["isUnknown", file.isUnknown],
    ]),
    createBox("module", [
      ["origin", moduleDescription.origin],
      ["source", moduleDescription.source],
      ["internalPath", moduleDescription.internalPath],
    ]),
  ];
}

/**
 * Lists every property that a dependency selector matches of a dependency. The relationship has no value of its own: its two sides follow it as nested properties.
 * @param description The `dependency` of what the engine says about a dependency that the plugin reads.
 * @returns The properties, in the order the plugin names them.
 */
export function describeDependencyEntries(
  description: DependencyDescription["dependency"]
): readonly PropertyEntry[] {
  const { kind, nodeKind, source, specifiers, relationship } = description;

  return [
    { key: "kind", value: kind },
    { key: "nodeKind", value: nodeKind },
    { key: "source", value: source },
    { key: "specifiers", value: specifiers },
    { key: "relationship" },
    { key: "from", value: relationship.from, isNested: true },
    { key: "to", value: relationship.to, isNested: true },
  ];
}
