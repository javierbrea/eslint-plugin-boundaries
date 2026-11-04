import { styled } from "@mui/material/styles";
import type { ReactNode } from "react";

import type { ProblemLevel } from "../../engine";
import { TONE_COLORS } from "../common";
import type { Tone } from "../common";
import { Icon } from "../icons";
import type { IconName } from "../icons";
import type { ProblemItem } from "../state";

import type { ProblemListProps } from "./Problems.types";

/** The icon and the tone of each level: a deprecation is a warning that the list does not tell apart. */
const LEVELS: Readonly<Record<ProblemLevel, { icon: IconName; tone: Tone }>> = {
  error: { icon: "cross", tone: "bad" },
  warning: { icon: "warn", tone: "warn" },
  deprecation: { icon: "warn", tone: "warn" },
};

const List = styled("ul")({
  margin: 0,
  padding: 0,
  listStyle: "none",
});

// The text of a row is the one of the mockup's rows, in the mono font
const ROW_STYLES = {
  display: "grid",
  gridTemplateColumns: "18px minmax(0, 1fr)",
  gap: "1px 8px",
  boxSizing: "border-box",
  width: "100%",
  padding: "6px 16px",
  font: "12.5px/1.5 var(--jsb-font-mono)",
  textAlign: "left",
  // A path or a diagnostic without spaces would stretch the row instead of wrapping
  overflowWrap: "anywhere",
} as const;

const Row = styled("div")(ROW_STYLES);

// A row that opens something is a button, so that it is reached with the keyboard
const RowButton = styled("button")({
  ...ROW_STYLES,
  border: 0,
  background: "transparent",
  color: "inherit",
  cursor: "pointer",
  "&:hover": { backgroundColor: "var(--jsb-accent-soft)" },
  // Inside the ring of the row: the scroll container of the panel would clip one drawn outside
  "&:focus-visible": {
    outline: "2px solid var(--jsb-accent)",
    outlineOffset: -2,
  },
});

const LevelIcon = styled("span", {
  shouldForwardProp: (prop) => prop !== "tone",
})<{ tone: Tone }>(({ tone }) => ({
  display: "inline-flex",
  // Aligns the icon with the first line of the row
  marginTop: 3,
  color: TONE_COLORS[tone],
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
 * What a row shows: an icon for the level, where the problem is, what is wrong and a meta line.
 * @param props RowContent props.
 * @param props.item The row.
 * @returns The content of the row.
 */
function RowContent({ item }: Readonly<{ item: ProblemItem }>): ReactNode {
  return (
    <>
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
    </>
  );
}

/**
 * The problems of a tab as rows: an icon for the level, where the problem is, what is wrong and a meta line. A row with a target is a button that opens it; a row without one, such as a line of text mode that is already in front of the user, is plain content.
 * @param props ProblemList props.
 * @param props.items The rows, in order.
 * @param props.onOpen Called with the target of the row the user presses.
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
      {items.map((item) => {
        const { target } = item;

        return (
          <li key={item.key}>
            {target === undefined ? (
              <Row>
                <RowContent item={item} />
              </Row>
            ) : (
              <RowButton type="button" onClick={() => onOpen(target)}>
                <RowContent item={item} />
              </RowButton>
            )}
          </li>
        );
      })}
    </List>
  );
}
