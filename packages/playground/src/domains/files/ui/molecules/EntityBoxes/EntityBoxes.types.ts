import type { EntityDescription } from "@/domains/evaluation/helpers/engine";
import type {
  EntitySide,
  InspectorOpenPlaces,
  InspectorPlace,
} from "@/domains/files/ui/helpers/inspectorPlaces";

/** Props of {@link EntityBoxes}. */
export type EntityBoxesProps = {
  /** What the engine says about the entity: a file of the sketch, or an external module. */
  readonly description: EntityDescription;
  /** The section of the inspector that holds the boxes, which is what names their places: `from.element`, `to.module`. */
  readonly side: EntitySide;
  /** Whether each place of the inspector is open. */
  readonly openPlaces: InspectorOpenPlaces;
  /** Called with the place of the box whose header was pressed, so that the owner of the state flips it. */
  readonly onToggle: (place: InspectorPlace) => void;
  /** The test id of the root element. It is the one of the boxes when it is unset. */
  readonly testId?: string;
};
