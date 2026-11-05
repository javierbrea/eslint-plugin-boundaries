import { styled } from "@mui/material/styles";
import type { ReactNode } from "react";

import { PaneHead } from "@/ui-kit/atoms/PaneHead";

import {
  PROJECT_PANE_LAYOUT_LABEL,
  PROJECT_PANE_LAYOUT_TEST_ID,
  PROJECT_PANE_LAYOUT_TEXT_HINT,
} from "./ProjectPaneLayout.constants";
import type { ProjectPaneLayoutProps } from "./ProjectPaneLayout.types";

const Pane = styled("section")({
  display: "grid",
  gridTemplateRows: "auto minmax(0, 1fr) 44px",
  width: "100%",
  height: "100%",
  minWidth: 0,
  minHeight: 0,
});

/**
 * The frame of the left pane: its landmark, its head and, in a grid, the body that takes what the head and the foot leave, and the foot.
 * @param props ProjectPaneLayout props.
 * @param props.view How the project is shown.
 * @param props.children The body.
 * @param props.foot The foot.
 * @param props.testId The test id of the root element, in place of the default one.
 * @returns The pane, as tall as its container.
 */
export function ProjectPaneLayout({
  view,
  children,
  foot,
  testId = PROJECT_PANE_LAYOUT_TEST_ID,
}: Readonly<ProjectPaneLayoutProps>): ReactNode {
  return (
    <Pane aria-label={PROJECT_PANE_LAYOUT_LABEL} data-testid={testId}>
      <PaneHead
        label={PROJECT_PANE_LAYOUT_LABEL}
        hint={view === "text" ? PROJECT_PANE_LAYOUT_TEXT_HINT : undefined}
      />
      {children}
      {foot}
    </Pane>
  );
}
