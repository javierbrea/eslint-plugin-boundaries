import type { Evaluation } from "@/domains/evaluation/helpers/engine";
import type {
  InspectorOpenPlaces,
  InspectorPlace,
} from "@/domains/files/ui/helpers/inspectorPlaces";

/** Props of the file inspector. */
export type FileInspectorProps = {
  /** Path of the file in focus. */
  readonly path: string;
  /** What the engine says about the sketch. */
  readonly evaluation: Evaluation;
  /** The position of the dependency in focus among the dependencies of the file, from 0. It is unset while no dependency of the file is in focus. */
  readonly dependencyIndex?: number;
  /** Whether each section and each box is open. The inspector never keeps it, so that it can outlast the file and the dependency in focus. */
  readonly openPlaces: InspectorOpenPlaces;
  /** Called with the place whose header was pressed, so that the owner of the state flips it. */
  readonly onToggle: (place: InspectorPlace) => void;
};

/** How the file inspector separates and pads its parts, as its page object reads it. */
export type FileInspectorPartSpacing = Pick<
  CSSStyleDeclaration,
  "paddingTop" | "paddingBottom" | "borderTopStyle"
>;
