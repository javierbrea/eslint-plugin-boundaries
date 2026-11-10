import type { PropertyEntry } from "@/domains/files/ui/helpers/descriptionEntries";

/** Props of {@link PropertyList}. */
export type PropertyListProps = {
  /** The properties to list, in order. */
  readonly entries: readonly PropertyEntry[];
  /** Draws a frame around the list, for a list that is a box of its own and not the body of one. */
  readonly isFramed?: boolean;
};

/** How a property list lays out its keys and values, as its page object reads it. */
export type PropertyListLayout = Pick<
  CSSStyleDeclaration,
  "display" | "gridTemplateColumns" | "columnGap" | "rowGap"
>;
