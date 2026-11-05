import { styled } from "@mui/material/styles";
import type { ReactNode } from "react";

import type { PaneFrameProps } from "./PaneFrame.types";

const Frame = styled("section")({
  display: "flex",
  flexDirection: "column",
  boxSizing: "border-box",
  height: "100%",
  minWidth: 0,
  minHeight: 0,
});

/**
 * The landmark of a pane, which the states of the pane share: a column as tall as its container, so that the body takes what the head leaves and scrolls on its own.
 * @param props PaneFrame props.
 * @param props.label The accessible name of the landmark.
 * @param props.testId The test id of the root element, when the component that is the frame has one.
 * @param props.children The head of the pane and its body.
 * @returns The landmark.
 */
export function PaneFrame({
  label,
  testId,
  children,
}: Readonly<PaneFrameProps>): ReactNode {
  return (
    <Frame aria-label={label} data-testid={testId}>
      {children}
    </Frame>
  );
}
