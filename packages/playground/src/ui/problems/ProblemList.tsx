import ButtonBase from "@mui/material/ButtonBase";
import { styled } from "@mui/material/styles";
import type { CSSObject, Theme } from "@mui/material/styles";
import type { ReactNode } from "react";

import type { ProblemLevel } from "@/domains/evaluation/helpers/engine";
import { Icon } from "@/ui/icons";
import type { IconName } from "@/ui/icons";
import type { ProblemItem } from "@/ui/state";
import type { Tone } from "@/ui-kit/helpers/tone";
import { TONE_COLORS } from "@/ui-kit/helpers/tone";

import type { ProblemListProps } from "./Problems.types";

/** The icon and the tone of each level: a deprecation is a warning that the list does not tell apart. */
const LEVELS: Readonly<Record<ProblemLevel, { icon: IconName; tone: Tone }>> = {
  error: { icon: "cross", tone: "bad" },
  warning: { icon: "warn", tone: "warn" },
  deprecation: { icon: "warn", tone: "warn" },
};

/**
 * The look of a row, whether it is a button or plain content. The text is the one of the mockup's rows, in the mono font.
 * @param props The props of the styled component.
 * @param props.theme The theme.
 * @returns The styles.
 */
function getRowStyles({ theme }: { theme: Theme }): CSSObject {
  return {
    display: "grid",
    gridTemplateColumns: "18px minmax(0, 1fr)",
    gap: "1px 8px",
    boxSizing: "border-box",
    width: "100%",
    padding: "6px 16px",
    ...theme.typography.mono,
    lineHeight: 1.5,
    textAlign: "left",
    // A path or a diagnostic without spaces would stretch the row instead of wrapping
    overflowWrap: "anywhere",
  };
}

const Row = styled("div")(getRowStyles);

// A row that opens something is a button, so that it is reached with the keyboard, and it gets its focus ring from the theme, as the rows of the config inspector do. The grid of a row has its own alignment: the button of MUI centers its content
const RowButton = styled(ButtonBase)(getRowStyles, {
  alignItems: "normal",
  justifyContent: "normal",
  "&:hover": { backgroundColor: "var(--jsb-accent-soft)" },
  // Inside the row: the scroll container of the panel would clip a ring drawn outside
  "&:focus-visible": { outlineOffset: -2 },
});

const List = styled("ul")({
  margin: 0,
  padding: 0,
  listStyle: "none",
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

const Empty = styled("p")(({ theme }) => ({
  margin: 0,
  padding: "6px 16px",
  color: "var(--jsb-muted)",
  ...theme.typography.body2,
}));

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
              <RowButton onClick={() => onOpen(target)}>
                <RowContent item={item} />
              </RowButton>
            )}
          </li>
        );
      })}
    </List>
  );
}
