import { styled } from "@mui/material/styles";
import { Fragment } from "react";
import type { ReactNode } from "react";

import { formatValue } from "@/domains/files/ui/helpers/formatValue";

import type { PropertyListProps } from "./PropertyList.types";

// The key column is as wide as the longest key, so that the values line up whatever the keys are. A frame is a box of its own, as a box of the inspector is
const List = styled("dl", {
  shouldForwardProp: (prop) => prop !== "isFramed",
})<{ isFramed: boolean }>(({ theme, isFramed }) => ({
  display: "grid",
  gridTemplateColumns: "max-content minmax(0, 1fr)",
  columnGap: 10,
  rowGap: 1,
  margin: 0,
  ...theme.typography.monoSmall,
  lineHeight: 1.5,
  ...(isFramed && {
    padding: "8px 10px",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "var(--jsb-line)",
    borderRadius: "var(--jsb-radius)",
  }),
}));

const Key = styled("dt", {
  shouldForwardProp: (prop) => prop !== "isNested",
})<{ isNested: boolean }>(({ isNested }) => ({
  paddingLeft: isNested ? 14 : 0,
  color: "var(--jsb-muted)",
}));

const Value = styled("dd", {
  shouldForwardProp: (prop) => prop !== "isNull",
})<{ isNull: boolean }>(({ isNull }) => ({
  margin: 0,
  overflowWrap: "anywhere",
  color: isNull ? "var(--jsb-muted)" : undefined,
}));

/**
 * Lists properties as their key in the muted color over a column of values, formatted as JSON with `null` in the muted color. A value wraps anywhere instead of widening the pane. An entry with no value leaves its value cell empty, and the nested entries after it are indented.
 * @param props PropertyList props.
 * @param props.entries The properties to list.
 * @param props.isFramed Whether to draw a frame around the list.
 * @returns The list.
 */
export function PropertyList({
  entries,
  isFramed = false,
}: Readonly<PropertyListProps>): ReactNode {
  return (
    <List isFramed={isFramed}>
      {entries.map(({ key, value, isNested = false }) => (
        <Fragment key={key}>
          <Key isNested={isNested}>{key}</Key>
          <Value isNull={value === null}>
            {value === undefined ? null : formatValue(value)}
          </Value>
        </Fragment>
      ))}
    </List>
  );
}
