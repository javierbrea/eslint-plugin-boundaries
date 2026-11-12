/** Which entity of a dependency a section of the inspector describes: the file that has it, or what it points to. */
export type EntitySide = "from" | "to";

/** A box of the description of an entity, named as the property of the plugin that its selector matches. */
export type EntityBoxName = "element" | "file" | "module";

/** A place of the file inspector that the user can fold: its three sections, and the three boxes of each section that describes an entity. The names are the ones the inspector shows, such as `from.element`. */
export type InspectorPlace =
  | "from"
  | "to"
  | "dependency"
  | `${EntitySide}.${EntityBoxName}`;

/** What the user chose to open or fold, by place. A place that is not here has its default. */
export type InspectorChoices = Readonly<
  Partial<Record<InspectorPlace, boolean>>
>;

/** Whether each place of the inspector is open. */
export type InspectorOpenPlaces = Readonly<Record<InspectorPlace, boolean>>;
