import { styled } from "@mui/material/styles";
import type { ReactNode } from "react";

import type { ProjectTextAreaProps } from "./ProjectTextArea.types";

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
 * The project as text, one path per line: a textarea as tall as its container, that the browser neither corrects nor wraps.
 * @param props ProjectTextArea props.
 * @param props.value The text it shows.
 * @param props.readOnly The text can be selected and copied, and not edited.
 * @param props.testId The test id of the root element, when the component that is the textarea has one.
 * @param props.onChange Called with the whole text after each edit of the user.
 * @param props.onBlur Called when the textarea loses the focus.
 * @returns The textarea.
 */
export function ProjectTextArea({
  value,
  readOnly,
  testId,
  onChange,
  onBlur,
}: Readonly<ProjectTextAreaProps>): ReactNode {
  return (
    <Area
      aria-label="Project as text"
      data-testid={testId}
      value={value}
      readOnly={readOnly}
      spellCheck={false}
      autoCapitalize="off"
      autoComplete="off"
      autoCorrect="off"
      wrap="off"
      onChange={(changeEvent) => onChange(changeEvent.target.value)}
      onBlur={() => onBlur()}
    />
  );
}
