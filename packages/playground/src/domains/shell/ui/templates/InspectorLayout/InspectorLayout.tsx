import { styled } from "@mui/material/styles";
import type { ReactNode } from "react";

import { PaneHead } from "@/ui-kit/atoms/PaneHead";
import { DIMMED, UNDIMMED } from "@/ui-kit/helpers/theme";

import {
  INSPECTOR_LAYOUT_LABEL,
  INSPECTOR_LAYOUT_TEST_ID,
} from "./InspectorLayout.constants";
import type { InspectorLayoutProps } from "./InspectorLayout.types";

const Frame = styled("aside")({
  display: "flex",
  flexDirection: "column",
  boxSizing: "border-box",
  height: "100%",
  minWidth: 0,
  minHeight: 0,
});

// Each part keeps the height of what it holds, so that the content scrolls when it is taller than the pane. A part that clips what it holds, such as a list with rounded corners, has no minimum height of its own, and with rows sized to fit the pane the grid would shrink it to share the height that is left, cutting its rows instead of scrolling
const Content = styled("div", {
  shouldForwardProp: (prop) => prop !== "dimmed",
})<{ dimmed: boolean }>(({ dimmed }) => ({
  ...(dimmed ? DIMMED : UNDIMMED),
  display: "grid",
  flex: 1,
  minHeight: 0,
  boxSizing: "border-box",
  alignContent: "start",
  gridAutoRows: "max-content",
  gap: 10,
  padding: "12px 14px",
  overflow: "auto",
}));

/**
 * The frame of the right pane: its landmark, its head and the scrolling content under it, which lays out what the pane describes in a column.
 * @param props InspectorLayout props.
 * @param props.children What the inspector describes.
 * @param props.dimmed Whether what it describes is out of date, which fades it.
 * @param props.testId The test id of the root element, in place of the default one.
 * @returns The pane.
 */
export function InspectorLayout({
  children,
  dimmed = false,
  testId = INSPECTOR_LAYOUT_TEST_ID,
}: Readonly<InspectorLayoutProps>): ReactNode {
  return (
    <Frame aria-label={INSPECTOR_LAYOUT_LABEL} data-testid={testId}>
      <PaneHead label={INSPECTOR_LAYOUT_LABEL} />
      <Content dimmed={dimmed}>{children}</Content>
    </Frame>
  );
}
