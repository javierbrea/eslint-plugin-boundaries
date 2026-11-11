import ButtonBase from "@mui/material/ButtonBase";
import IconButton from "@mui/material/IconButton";
import { styled } from "@mui/material/styles";
import Tooltip from "@mui/material/Tooltip";
import { useEffect, useRef } from "react";
import type { ElementType, ReactNode } from "react";

import { Statement } from "@/domains/files/ui/atoms/Statement";
import { Icon } from "@/ui-kit/atoms/Icon";
import { DIMMED, FOCUS_RING, UNDIMMED } from "@/ui-kit/helpers/theme";
import type { StateTone } from "@/ui-kit/helpers/tone";

import {
  DELETE_ACTION_LABEL,
  DEPENDENCY_LINES_TEST_ID,
  EDIT_ACTION_LABEL,
} from "./DependencyLines.constants";
import type { DependencyLinesProps } from "./DependencyLines.types";

/** The color of each verdict inside a code area, from the tokens of the host. */
const CODE_VERDICT_COLORS: Readonly<Record<StateTone, string>> = {
  ok: "var(--jsb-code-string)",
  bad: "var(--jsb-code-error)",
  warn: "var(--jsb-code-number)",
  faint: "var(--jsb-code-comment)",
};

/** The background of the line under the pointer and of the line in focus: 66% of `--jsb-code-line`, so that the number and a `not checked` verdict, in `--jsb-code-comment`, keep 4.5:1 on the code of the light scheme */
const LINE_BACKGROUND =
  "color-mix(in srgb, var(--jsb-code-line) 66%, transparent)";

const List = styled("ol")({
  margin: 0,
  padding: 0,
  listStyle: "none",
});

// The actions are not inside the button that selects the line, so the line is the position that its button stretches over. The actions of a line show under the pointer, while the keyboard is on the line and while the line is the selected one: they are dimmed and not removed, so that the keyboard reaches them
const Line = styled("li")({
  position: "relative",
  display: "grid",
  gridTemplateColumns: "44px minmax(0, 1fr) 64px 176px",
  alignItems: "center",
  minHeight: 28,
  paddingRight: 14,
  "&:hover": { backgroundColor: LINE_BACKGROUND },
  "&[data-selected]": {
    backgroundColor: LINE_BACKGROUND,
    boxShadow: "inset 2px 0 0 var(--jsb-code-keyword)",
  },
  "&:hover [data-actions]": { opacity: 1 },
  "&:focus-within [data-actions]": { opacity: 1 },
  "&[data-selected] [data-actions]": { opacity: 1 },
});

// The weight and the line height are the ones of the code area
const LineNumber = styled("span")(({ theme }) => ({
  paddingRight: 14,
  color: "var(--jsb-code-comment)",
  ...theme.typography.monoSmall,
  fontWeight: "inherit",
  lineHeight: "inherit",
  textAlign: "right",
}));

// A long path wraps instead of being cut: the path is what the line is about. The button is not the position of its own overlay, so that the overlay covers the whole line, the number and the verdict included. The overlay has the keyboard ring, since the button is only the statement
const Select = styled(ButtonBase)<{ component?: ElementType }>({
  position: "static",
  display: "block",
  boxSizing: "border-box",
  width: "100%",
  padding: "3px 0",
  lineHeight: "22px",
  overflowWrap: "anywhere",
  textAlign: "left",
  "&::after": { content: '""', position: "absolute", inset: 0 },
  "&:focus-visible": { outline: "none" },
  "&:focus-visible::after": { outline: FOCUS_RING, outlineOffset: -2 },
});

// Over the overlay of the button that selects the line, so that they get the pointer. The column is 64 px, which holds the two buttons
const Actions = styled("span")({
  position: "relative",
  zIndex: 1,
  gridColumn: 3,
  display: "inline-flex",
  justifyContent: "flex-end",
  gap: 2,
  paddingRight: 8,
  opacity: 0,
  color: "var(--jsb-code-comment)",
});

const ActionButton = styled(IconButton)({
  width: 26,
  height: 26,
  color: "inherit",
  "&:hover": {
    backgroundColor: "var(--jsb-code-line)",
    color: "var(--jsb-code-fg)",
  },
});

// In its own column, so that it stays at the end of the line when the line has no actions
const Verdict = styled("span", {
  shouldForwardProp: (prop) => prop !== "tone" && prop !== "dimmed",
})<{ tone: StateTone; dimmed: boolean }>(({ theme, tone, dimmed }) => ({
  ...(dimmed ? DIMMED : UNDIMMED),
  gridColumn: 4,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: 6,
  ...theme.typography.monoCaption,
  color: CODE_VERDICT_COLORS[tone],
  textAlign: "right",
}));

/**
 * The dependency list of a file: one line each, with its number, its statement, its actions and its verdict. A click on a line, or Enter or Space while it has the keyboard focus, selects it. A verdict that has a sentence to explain it, such as why a dependency is not checked, shows it in a tooltip under the pointer and while the verdict has the keyboard focus, and the sentence is its description. The edit and delete actions show under the pointer and on the line that is selected or has the focus. It draws nothing for an empty list, so that the pane shows only what adds a dependency.
 * @param props DependencyLines props.
 * @param props.lines The lines of the file.
 * @param props.selectedIndex The position of the line in focus, if any.
 * @param props.editable Whether the dependencies can be edited and removed.
 * @param props.onSelect Called with the position of the line that the user chose.
 * @param props.onEdit Called with the position of the line whose edit action was pressed.
 * @param props.onRemove Called with the position of the line whose delete action was pressed. The keyboard focus then goes to the line that takes its number, or to the one before it when it was the last, or to `onEmptied` when no line is left, since the button that was pressed is gone or shows another line.
 * @param props.onEmptied Called when the last line was removed, to move the focus to what is left.
 * @returns The list, or nothing.
 */
export function DependencyLines({
  lines,
  selectedIndex,
  editable,
  onSelect,
  onEdit,
  onRemove,
  onEmptied,
}: Readonly<DependencyLinesProps>): ReactNode {
  const selectButtons = useRef<(HTMLElement | null)[]>([]);
  // The position of the line that was removed, until the lines that the store gives after it are drawn
  const removedAt = useRef<number | undefined>(undefined);

  useEffect(() => {
    const removed = removedAt.current;

    if (removed === undefined) {
      return;
    }
    removedAt.current = undefined;

    const target = Math.min(removed, lines.length - 1);

    if (target < 0) {
      onEmptied?.();
    } else {
      // A line that is drawn has its button
      (selectButtons.current[target] as HTMLElement).focus();
    }
  }, [lines, onEmptied]);

  if (lines.length === 0) {
    return null;
  }
  return (
    <List data-testid={DEPENDENCY_LINES_TEST_ID}>
      {lines.map((line, index) => {
        const isSelected = index === selectedIndex;

        return (
          <Line key={line.id} data-selected={isSelected ? "" : undefined}>
            <LineNumber>{index + 1}</LineNumber>
            <Select
              component="div"
              ref={(node: HTMLElement | null) => {
                selectButtons.current[index] = node;
              }}
              aria-current={isSelected ? "true" : undefined}
              onClick={() => onSelect(index)}
            >
              <Statement tokens={line.tokens} />
            </Select>
            {editable ? (
              <Actions data-actions="">
                <Tooltip title="Edit">
                  <ActionButton
                    aria-label={`${EDIT_ACTION_LABEL} ${index + 1}`}
                    onClick={() => onEdit(index)}
                  >
                    <Icon name="edit" />
                  </ActionButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <ActionButton
                    aria-label={`${DELETE_ACTION_LABEL} ${index + 1}`}
                    onClick={() => {
                      removedAt.current = index;
                      onRemove(index);
                    }}
                  >
                    <Icon name="trash" />
                  </ActionButton>
                </Tooltip>
              </Actions>
            ) : null}
            {/* The sentence describes the verdict, which keeps its text as its name, and a verdict that has one takes the keyboard focus, which shows it as the pointer does */}
            <Tooltip title={line.hint ?? ""} describeChild>
              <Verdict
                tone={line.tone}
                dimmed={line.dimmed}
                tabIndex={line.hint === undefined ? undefined : 0}
              >
                {line.icon === undefined ? null : (
                  <Icon name={line.icon} label={line.iconLabel} />
                )}
                {line.label}
              </Verdict>
            </Tooltip>
          </Line>
        );
      })}
    </List>
  );
}
