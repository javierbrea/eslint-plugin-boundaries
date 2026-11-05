import { styled } from "@mui/material/styles";
import type { ReactNode } from "react";

import { Icon } from "@/ui-kit/atoms/Icon";

import { NOTE_TEST_ID } from "./Note.constants";
import type { NoteProps } from "./Note.types";

const Frame = styled("div")(({ theme }) => ({
  display: "flex",
  gap: 8,
  padding: "8px 10px",
  border: "1px dashed var(--jsb-line-strong)",
  borderRadius: "var(--jsb-radius)",
  color: "var(--jsb-muted)",
  ...theme.typography.body2,
}));

/**
 * A dashed box with the info icon, for a remark that does not fit as a row of a list, such as why there is nothing to list. It has no outer margin: the caller places it with `className`, such as `styled(Note)`.
 * @param props Note props.
 * @param props.children What the note says.
 * @param props.className The class that places the note, such as the one `styled(Note)` passes.
 * @param props.testId The test id of the root element, in place of the default one.
 * @returns The note.
 */
export function Note({
  children,
  className,
  testId = NOTE_TEST_ID,
}: Readonly<NoteProps>): ReactNode {
  return (
    <Frame role="note" className={className} data-testid={testId}>
      <Icon name="info" />
      <span>{children}</span>
    </Frame>
  );
}
