import { useEffect, useMemo, useRef } from "react";
import type { ReactNode } from "react";

import { toText } from "@/domains/project/helpers/sketch";
import { ProjectTextArea } from "@/domains/project/ui/atoms/ProjectTextArea";
import {
  useCapabilities,
  useReadText,
  useSetTextDraft,
  useSettleText,
  useTextDraft,
  useTree,
} from "@/domains/session/data/store";

import { PROJECT_TEXT_TEST_ID, READ_DELAY } from "./ProjectText.constants";

/**
 * The project as text, one path per line: a textarea that edits the same sketch as the tree. What the user types is the draft of the store, which shows instead of the sketch's text and whose lines that cannot be read are listed as problems. The draft is read into the sketch 300 ms after the last keystroke, and on blur, which also goes back to the sketch's text when every line was read. Without `editTree` the text is read only.
 * @returns The textarea, as tall as its container.
 */
export function ProjectText(): ReactNode {
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
   * @param value The whole text after the keystroke.
   */
  function handleChange(value: string): void {
    setTextDraft(value);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(readText, READ_DELAY);
  }

  /** Reads what the user typed without waiting. */
  function handleBlur(): void {
    clearTimeout(timerRef.current);
    settleText();
  }

  return (
    <ProjectTextArea
      value={draft ?? text}
      readOnly={!editTree}
      testId={PROJECT_TEXT_TEST_ID}
      onChange={handleChange}
      onBlur={handleBlur}
    />
  );
}
