import { styled } from "@mui/material/styles";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, ReactNode } from "react";

import type { Sketch } from "../../contract";
import { fromText, toText } from "../../sketch";

import type { TextModeProps } from "./TextMode.types";

/** Milliseconds after the last keystroke before the text is read */
const READ_DELAY = 300;

const Area = styled("textarea")({
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
  font: "12px/20px var(--jsb-font-mono)",
  resize: "none",
  whiteSpace: "pre",
});

/**
 * Tells whether reading the text left the project as it was.
 * @param current The sketch the text was read against.
 * @param next The sketch that the text makes.
 * @returns Whether the tree and the dependencies are the same.
 */
function isSameSketch(current: Sketch, next: Sketch): boolean {
  const project = ({ tree, dependencies }: Sketch): string =>
    JSON.stringify({ tree, dependencies });

  return project(current) === project(next);
}

/**
 * The project as text, one path per line: a textarea that edits the same sketch as the tree. While the user types it shows the draft, and it reads it 300 ms after the last keystroke and on blur. Lines that cannot be read are reported and stay in the draft until the text is valid, so that the user can fix them; leaving the view drops them.
 * @param props TextMode props.
 * @param props.sketch The sketch to write as text.
 * @param props.readOnly Whether the text cannot be edited.
 * @param props.onSketchChange Called with the new sketch when the text differs from it.
 * @param props.onTextProblems Called with the lines that could not be read.
 * @returns The textarea, as tall as its container.
 */
export function TextMode({
  sketch,
  readOnly,
  onSketchChange,
  onTextProblems,
}: Readonly<TextModeProps>): ReactNode {
  // What the user has typed since the text was last in sync with the sketch; without it the text is the sketch's
  const [draft, setDraft] = useState<string | undefined>(undefined);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const hasProblemsRef = useRef(false);
  // The timer and the unmount read the latest props, not the ones of the render that scheduled them
  const latestRef = useRef({ sketch, onSketchChange, onTextProblems });
  const text = useMemo(() => toText(sketch), [sketch]);

  useEffect(() => {
    latestRef.current = { sketch, onSketchChange, onTextProblems };
  });

  // Going back to the tree drops the lines that were not read, and so does their report
  useEffect(
    () => () => {
      clearTimeout(timerRef.current);
      if (hasProblemsRef.current) {
        latestRef.current.onTextProblems([]);
      }
    },
    []
  );

  /**
   * Reads the text against the latest sketch and reports what came out of it.
   * @param value The text to read.
   * @returns Whether every line could be read.
   */
  function read(value: string): boolean {
    const latest = latestRef.current;
    const result = fromText(value, latest.sketch);

    if (!isSameSketch(latest.sketch, result.sketch)) {
      latest.onSketchChange(result.sketch);
    }
    hasProblemsRef.current = result.problems.length > 0;
    latest.onTextProblems(result.problems);
    return result.problems.length === 0;
  }

  /**
   * Keeps what the user typed and schedules reading it.
   * @param changeEvent The change of the textarea.
   */
  function handleChange(changeEvent: ChangeEvent<HTMLTextAreaElement>): void {
    const value = changeEvent.target.value;

    setDraft(value);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => read(value), READ_DELAY);
  }

  /** Reads what the user typed without waiting, and goes back to the sketch's text if every line could be read. */
  function handleBlur(): void {
    clearTimeout(timerRef.current);
    // Without a draft there is nothing the user typed to read
    if (draft !== undefined && read(draft)) {
      // The sketch has it all: the text goes back to the sketch's, in the order of the tree
      setDraft(undefined);
    }
  }

  return (
    <Area
      aria-label="Project as text"
      value={draft ?? text}
      readOnly={readOnly}
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
