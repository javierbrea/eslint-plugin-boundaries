import { styled } from "@mui/material/styles";
import type { ReactNode } from "react";

import {
  SHELL_LAYOUT_LABEL,
  SHELL_LAYOUT_TEST_ID,
} from "./ShellLayout.constants";
import type { ShellLayoutProps } from "./ShellLayout.types";

const Frame = styled("section")({
  boxSizing: "border-box",
  width: "100%",
  height: "100%",
  minWidth: 0,
  minHeight: 0,
});

const Layout = styled("div")({
  display: "grid",
  gridTemplateRows: "44px minmax(0, 1fr)",
  height: "100%",
});

/**
 * The frame of the playground once a sketch is loaded: its landmark and a grid with the top bar in a row of 44 px and the regions in the row under it.
 * @param props ShellLayout props.
 * @param props.topBar The top bar.
 * @param props.regions The regions.
 * @param props.testId The test id of the root element, in place of the default one.
 * @returns The frame, as large as its container.
 */
export function ShellLayout({
  topBar,
  regions,
  testId = SHELL_LAYOUT_TEST_ID,
}: Readonly<ShellLayoutProps>): ReactNode {
  return (
    <Frame aria-label={SHELL_LAYOUT_LABEL} data-testid={testId}>
      <Layout>
        {topBar}
        {regions}
      </Layout>
    </Frame>
  );
}
