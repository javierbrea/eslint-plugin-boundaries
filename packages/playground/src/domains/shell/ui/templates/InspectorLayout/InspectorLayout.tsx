import { styled } from "@mui/material/styles";
import type { ReactNode } from "react";

import { PaneHead } from "@/ui-kit/atoms/PaneHead";

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

const Content = styled("div")({
  display: "grid",
  flex: 1,
  minHeight: 0,
  boxSizing: "border-box",
  alignContent: "start",
  gap: 10,
  padding: "12px 14px",
  overflow: "auto",
});

/**
 * The frame of the right pane: its landmark, its head and the scrolling content under it, which lays out what the pane describes in a column.
 * @param props InspectorLayout props.
 * @param props.children What the inspector describes.
 * @param props.testId The test id of the root element, in place of the default one.
 * @returns The pane.
 */
export function InspectorLayout({
  children,
  testId = INSPECTOR_LAYOUT_TEST_ID,
}: Readonly<InspectorLayoutProps>): ReactNode {
  return (
    <Frame aria-label={INSPECTOR_LAYOUT_LABEL} data-testid={testId}>
      <PaneHead label={INSPECTOR_LAYOUT_LABEL} />
      <Content>{children}</Content>
    </Frame>
  );
}
