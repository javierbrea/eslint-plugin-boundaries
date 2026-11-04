import { styled } from "@mui/material/styles";
import { useEffect, useMemo, useRef } from "react";
import type { ChangeEvent, ReactNode } from "react";

import { toText } from "../../sketch";
import {
  useCapabilities,
  useReadText,
  useSetTextDraft,
  useSettleText,
  useTextDraft,
  useTree,
} from "../state";

/** Milliseconds after the last keystroke before the text is read */
const READ_DELAY = 300;

const Area = styled("textarea")(({ theme }) => ({
  boxSizing: "border-box",
  width: "100%",
  height: "100%",
  margin: 0,
  padding: "10px 12px",
  overflow: "auto",
  border: 0,
  // The text is always the one being edited, so the ring is always there, as in the mockup
  outline: "none",
  boxShadow: "inset 0 0 0 1px var(--jsb-accent)",
  background: "var(--jsb-paper-2)",
  color: "var(--jsb-ink)",
  ...theme.typography.monoSmall,
  // A line is 20 px tall
  lineHeight: "20px",
  resize: "none",
  whiteSpace: "pre",
}));

/**
 * The project as text, one path per line: a textarea that edits the same sketch as the tree. What the user types is the draft of the store, which shows instead of the sketch's text and whose lines that cannot be read are listed as problems. The draft is read into the sketch 300 ms after the last keystroke, and on blur, which also goes back to the sketch's text when every line was read. Without `editTree` the text is read only.
 * @returns The textarea, as tall as its container.
 */
export function TextMode(): ReactNode {
  const tree = useTree();
  const draft = useTextDraft();
  const { editTree } = useCapabilities();
  const setTextDraft = useSetTextDraft();
  const readText = useReadText();
  const settleText = useSettleText();
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const text = useMemo(() => toText({ tree }), [tree]);

  // Going back to the tree drops the draft in the store; the read that was waiting goes with it
  useEffect(() => () => clearTimeout(timerRef.current), []);

  /**
   * Keeps what the user typed and schedules reading it.
   * @param changeEvent The change of the textarea.
   */
  function handleChange(changeEvent: ChangeEvent<HTMLTextAreaElement>): void {
    setTextDraft(changeEvent.target.value);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(readText, READ_DELAY);
  }

  /** Reads what the user typed without waiting. */
  function handleBlur(): void {
    clearTimeout(timerRef.current);
    settleText();
  }

  return (
    <Area
      aria-label="Project as text"
      value={draft ?? text}
      readOnly={!editTree}
      spellCheck={false}
      autoCapitalize="off"
      autoComplete="off"
      autoCorrect="off"
      wrap="off"
      onChange={handleChange}
      onBlur={handleBlur}
    />
  );
}
