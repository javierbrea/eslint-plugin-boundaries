import { styled } from "@mui/material/styles";
import type { ReactNode } from "react";

import { PropertyList } from "@/domains/files/ui/atoms/PropertyList";
import { describeEntityBoxes } from "@/domains/files/ui/helpers/descriptionEntries";
import { getBoxPlace } from "@/domains/files/ui/helpers/inspectorPlaces";
import { Disclosure } from "@/ui-kit/molecules/Disclosure";

import { ENTITY_BOXES_TEST_ID } from "./EntityBoxes.constants";
import type { EntityBoxesProps } from "./EntityBoxes.types";

// The boxes are items of the body of their section, whose grid places them: the root takes no box of its own, so that the test id has an element to be on
const Root = styled("div")({ display: "contents" });

/**
 * The description of an entity as the plugin gives it, in three boxes named as the selectors that match them: `element`, `file` and `module`, each with every property of the selector. A box folds with its header, which shows its first property after its name while it is folded. What is open is the owner's to keep, by place.
 * @param props EntityBoxes props.
 * @param props.description What the engine says about the entity.
 * @param props.side The section that holds the boxes.
 * @param props.openPlaces Whether each place of the inspector is open.
 * @param props.onToggle Called with the place of the box whose header was pressed.
 * @param props.testId The test id of the root element, in place of the default one.
 * @returns The three boxes.
 */
export function EntityBoxes({
  description,
  side,
  openPlaces,
  onToggle,
  testId = ENTITY_BOXES_TEST_ID,
}: Readonly<EntityBoxesProps>): ReactNode {
  return (
    <Root data-testid={testId}>
      {describeEntityBoxes(description).map(
        ({ name: boxName, entries, digest }) => {
          const place = getBoxPlace(side, boxName);
          const isOpen = openPlaces[place];

          return (
            <Disclosure
              key={boxName}
              variant="box"
              label={boxName}
              summary={isOpen ? undefined : digest}
              isSummaryMuted
              isOpen={isOpen}
              onToggle={() => onToggle(place)}
            >
              <PropertyList entries={entries} />
            </Disclosure>
          );
        }
      )}
    </Root>
  );
}
