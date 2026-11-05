import { styled } from "@mui/material/styles";
import type { ReactNode } from "react";

import { Note } from "@/ui-kit/molecules/Note";

import { RULES_NOTE_TEST_ID } from "./RulesNote.constants";

// The note sits above the list of a tab, 6 px from the head and 16 px from the sides
const PlacedNote = styled(Note)({ margin: "6px 16px 0" });

/**
 * The note that says why no dependency is evaluated: the options of a rule are invalid.
 * @returns The note, placed above the list of a tab.
 */
export function RulesNote(): ReactNode {
  return (
    <PlacedNote testId={RULES_NOTE_TEST_ID}>
      Dependencies are not evaluated while the rule options are invalid: ESLint
      does not run a rule whose options fail its schema.
    </PlacedNote>
  );
}
