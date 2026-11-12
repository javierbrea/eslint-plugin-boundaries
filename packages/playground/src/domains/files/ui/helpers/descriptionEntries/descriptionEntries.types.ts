import type { DescribedValue } from "@/domains/files/ui/helpers/formatValue";
import type { EntityBoxName } from "@/domains/files/ui/helpers/inspectorPlaces";

/** A property of a description as the inspector lists it: its name and its value, as the plugin gives them. */
export type PropertyEntry = {
  /** The name of the property, as a selector spells it. */
  readonly key: string;
  /** Its value. It is left out for a property that only groups the entries after it, such as `relationship`. */
  readonly value?: DescribedValue;
  /** Whether it is one of the properties of the entry above it, which the list indents. */
  readonly isNested?: boolean;
};

/** A box of the description of an entity: what one kind of selector matches of it. */
export type EntityBox = {
  /** Which box it is. */
  readonly name: EntityBoxName;
  /** Its properties, in the order the plugin names them. */
  readonly entries: readonly PropertyEntry[];
  /** The formatted value of its first property, which a folded box shows after its name. */
  readonly digest: string;
};
