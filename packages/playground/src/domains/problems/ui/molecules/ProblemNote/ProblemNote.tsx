import { styled } from "@mui/material/styles";
import type { ReactNode } from "react";

import { Note } from "@/ui-kit/molecules/Note";

import { PROBLEM_NOTE_TEST_ID } from "./ProblemNote.constants";
import type { ProblemNoteProps } from "./ProblemNote.types";

// The note sits above the list of a tab, 6 px from the head and 16 px from the sides
const PlacedNote = styled(Note)({ margin: "6px 16px 0" });

/**
 * A note above the problems of a tab, such as why no dependency is evaluated or which policy of the config is highlighted.
 * @param props ProblemNote props.
 * @param props.children What the note says.
 * @param props.testId The test id of the root element, in place of the default one.
 * @returns The note, placed above the list of a tab.
 */
export function ProblemNote({
  children,
  testId = PROBLEM_NOTE_TEST_ID,
}: Readonly<ProblemNoteProps>): ReactNode {
  return <PlacedNote testId={testId}>{children}</PlacedNote>;
}
