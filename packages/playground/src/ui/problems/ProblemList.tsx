import { styled } from "@mui/material/styles";
import type { ReactNode } from "react";

import { Icon } from "../icons";
import type { IconName } from "../icons";

import type {
  ProblemLevel,
  ProblemListProps,
  ProblemTone,
} from "./Problems.types";

/** The icon and the tone of each level: a deprecation is a warning that the list does not tell apart. */
const LEVELS: Readonly<
  Record<ProblemLevel, { icon: IconName; tone: ProblemTone }>
> = {
  error: { icon: "cross", tone: "bad" },
  warning: { icon: "warn", tone: "warn" },
  deprecation: { icon: "warn", tone: "warn" },
};

const List = styled("ul")({
  margin: 0,
  padding: 0,
  listStyle: "none",
});

// A button, so that a row is reached with the keyboard; its text is the one of the mockup's rows, in the mono font
const Row = styled("button")({
  display: "grid",
  gridTemplateColumns: "18px minmax(0, 1fr)",
  gap: "1px 8px",
  boxSizing: "border-box",
  width: "100%",
  padding: "6px 16px",
  border: 0,
  background: "transparent",
  color: "inherit",
  font: "12.5px/1.5 var(--jsb-font-mono)",
  textAlign: "left",
  cursor: "pointer",
  // A path or a diagnostic without spaces would stretch the row instead of wrapping
  overflowWrap: "anywhere",
  "&:hover": { backgroundColor: "var(--jsb-accent-soft)" },
  // Inside the ring of the row: the scroll container of the panel would clip one drawn outside
  "&:focus-visible": {
    outline: "2px solid var(--jsb-accent)",
    outlineOffset: -2,
  },
});

const LevelIcon = styled("span", {
  shouldForwardProp: (prop) => prop !== "tone",
})<{ tone: ProblemTone }>(({ tone }) => ({
  display: "inline-flex",
  // Aligns the icon with the first line of the row
  marginTop: 3,
  color: `var(--jsb-${tone})`,
}));

const Where = styled("span")({ color: "var(--jsb-ink)" });

const Position = styled("span")({ color: "var(--jsb-muted)" });

const Message = styled("span")({
  gridColumn: 2,
  color: "var(--jsb-ink)",
  fontFamily: "var(--jsb-font-body)",
});

// The line of text mode is shown as written, indentation included
const Meta = styled("span")({
  gridColumn: 2,
  color: "var(--jsb-muted)",
  whiteSpace: "pre-wrap",
});

const Empty = styled("p")({
  margin: 0,
  padding: "6px 16px",
  color: "var(--jsb-muted)",
  fontSize: 12.5,
});

/**
 * The problems of a tab as rows: an icon for the level, where the problem is, what is wrong and a meta line. A row is a button that asks to open what the problem points at.
 * @param props ProblemList props.
 * @param props.items The rows, in order.
 * @param props.onOpen Called with the id of the row the user presses.
 * @param props.empty What to say when there are no rows.
 * @returns The list, or the text for no rows.
 */
export function ProblemList({
  items,
  onOpen,
  empty,
}: Readonly<ProblemListProps>): ReactNode {
  if (items.length === 0) {
    return <Empty>{empty}</Empty>;
  }

  return (
    <List>
      {items.map((item) => (
        <li key={item.id}>
          <Row type="button" onClick={() => onOpen(item.id)}>
            <LevelIcon tone={LEVELS[item.level].tone}>
              <Icon name={LEVELS[item.level].icon} />
            </LevelIcon>
            <Where>
              {item.location}
              {item.position === undefined ? null : (
                <Position>{item.position}</Position>
              )}
            </Where>
            <Message>{item.message}</Message>
            <Meta>{item.meta}</Meta>
          </Row>
        </li>
      ))}
    </List>
  );
}
