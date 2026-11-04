import { styled } from "@mui/material/styles";
import type { ReactNode } from "react";

import type { DependencyLine } from "./DependencyLines.types";

const List = styled("ol")({
  margin: 0,
  padding: 0,
  listStyle: "none",
});

const Line = styled("li")({
  display: "grid",
  gridTemplateColumns: "44px minmax(0, 1fr)",
  alignItems: "center",
  minHeight: 28,
  paddingRight: 14,
});

const LineNumber = styled("span")({
  paddingRight: 14,
  color: "var(--jsb-code-comment)",
  fontSize: 12,
  textAlign: "right",
});

// A long path wraps instead of being cut: the path is what the line is about
const Statement = styled("span")({
  padding: "3px 0",
  lineHeight: "22px",
  overflowWrap: "anywhere",
});

/** Props of {@link DependencyLines}. */
type DependencyLinesProps = {
  /** The lines of the file, in the order of its code. */
  lines: readonly DependencyLine[];
};

/**
 * The dependency list of a file: one line each, with its number and its statement. It draws nothing for an empty list, so that the pane says there are no dependencies instead.
 * @param props DependencyLines props.
 * @param props.lines The lines of the file.
 * @returns The list, or nothing.
 */
export function DependencyLines({
  lines,
}: Readonly<DependencyLinesProps>): ReactNode {
  if (lines.length === 0) {
    return null;
  }
  return (
    <List>
      {lines.map(({ id, statement }, index) => (
        <Line key={id}>
          <LineNumber>{index + 1}</LineNumber>
          <Statement>{statement}</Statement>
        </Line>
      ))}
    </List>
  );
}
