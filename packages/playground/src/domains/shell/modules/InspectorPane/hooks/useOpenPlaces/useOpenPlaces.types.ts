import type {
  InspectorOpenPlaces,
  InspectorPlace,
} from "@/domains/files/ui/helpers/inspectorPlaces";

/** What the inspector pane keeps of the sections and the boxes the user folded or opened. */
export type OpenPlaces = {
  /** Whether each section and each box of the inspector of a file is open. */
  readonly openPlaces: InspectorOpenPlaces;
  /** Opens a place that is folded and folds one that is open. It keeps the same identity between renders. */
  readonly onToggle: (place: InspectorPlace) => void;
};
