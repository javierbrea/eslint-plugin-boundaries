import {
  FOLDED_BY_DEFAULT,
  INSPECTOR_PLACES,
} from "./inspectorPlaces.constants";
import type {
  EntityBoxName,
  EntitySide,
  InspectorChoices,
  InspectorOpenPlaces,
  InspectorPlace,
} from "./inspectorPlaces.types";

/**
 * Names the place of a box of the description of an entity.
 * @param side The section that holds the box.
 * @param box The box.
 * @returns The place, such as `from.element`.
 */
export function getBoxPlace(
  side: EntitySide,
  box: EntityBoxName
): InspectorPlace {
  return `${side}.${box}`;
}

/**
 * Tells whether a place is open before the user chooses.
 * @param place The place.
 * @returns False for the boxes of the module, and true for every other place.
 */
export function isOpenByDefault(place: InspectorPlace): boolean {
  return !FOLDED_BY_DEFAULT.includes(place);
}

/**
 * Tells which places are open: what the user chose, and the default for the places the user did not touch.
 * @param choices What the user chose.
 * @returns Whether each place is open.
 */
export function getOpenPlaces(choices: InspectorChoices): InspectorOpenPlaces {
  // `fromEntries` types its result as an index signature, and the places are all of them
  return Object.fromEntries(
    INSPECTOR_PLACES.map((place) => [
      place,
      choices[place] ?? isOpenByDefault(place),
    ])
  ) as InspectorOpenPlaces;
}

/**
 * Records that the user pressed the header of a place: an open place is folded, and a folded one is opened.
 * @param choices What the user chose before.
 * @param place The place that was pressed.
 * @returns The choices with the place the other way round from what it was, open or folded.
 */
export function toggleChoice(
  choices: InspectorChoices,
  place: InspectorPlace
): InspectorChoices {
  return { ...choices, [place]: !(choices[place] ?? isOpenByDefault(place)) };
}
