import { styled } from "@mui/material/styles";
import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { Group, Panel, Separator, usePanelRef } from "react-resizable-panels";

import { SHELL_REGIONS_TEST_ID } from "./ShellRegions.constants";
import type { ShellRegionsProps } from "./ShellRegions.types";

/** Widths and heights in pixels: what each region starts with and the least it can have. Numbers are pixels for `react-resizable-panels`. */
const SIZES = {
  project: { initial: 264, text: 420, min: 200 },
  node: { min: 360 },
  inspector: { initial: 320, min: 260 },
  problems: { initial: 212, min: 120, collapsed: 34 },
  // The row above the problems panel: enough for a pane head and a few rows of the tree
  body: { min: 160 },
} as const;

const Frame = styled("div")({
  width: "100%",
  height: "100%",
  minWidth: 0,
  minHeight: 0,
});

// A separator is a 1 px line that the pointer and the keyboard find in a wider area. It thickens under the pointer and the keyboard focus
const ColumnSeparator = styled(Separator)({
  position: "relative",
  flex: "none",
  width: 1,
  backgroundColor: "var(--jsb-line)",
  outline: "none",
  "&[data-separator='hover'], &[data-separator='active'], &[data-separator='focus']":
    {
      backgroundColor: "var(--jsb-accent)",
      boxShadow: "0 0 0 1px var(--jsb-accent)",
    },
});

// The line above the problems panel has a grip at its center: 32 by 4 px, so that the panel looks as draggable as it is
const RowSeparator = styled(Separator)({
  position: "relative",
  flex: "none",
  height: 1,
  backgroundColor: "var(--jsb-line)",
  outline: "none",
  "&::after": {
    content: '""',
    position: "absolute",
    top: -2,
    left: "50%",
    width: 32,
    height: 4,
    marginLeft: -16,
    borderRadius: 2,
    backgroundColor: "var(--jsb-line-strong)",
  },
  "&[data-separator='hover'], &[data-separator='active'], &[data-separator='focus']":
    {
      backgroundColor: "var(--jsb-accent)",
      boxShadow: "0 0 0 1px var(--jsb-accent)",
      "&::after": { backgroundColor: "var(--jsb-accent)" },
    },
});

/**
 * Lays out the four regions of the shell with resizable splits: the project, the node in focus and the inspector in a row, over the problems panel. The project and the inspector keep their width when the page is resized, and the problems panel its height, so the node in focus takes the difference. The project pane widens to 420 px while the text is shown, unless the user made it wider, and gives the room back after; the problems panel collapses to its head.
 * @param props ShellRegions props.
 * @param props.project The project pane.
 * @param props.node The node in focus.
 * @param props.inspector The inspector.
 * @param props.problems The problems panel.
 * @param props.isTextMode Whether the project is shown as text.
 * @param props.isProblemsCollapsed Whether the problems panel is collapsed.
 * @param props.onProblemsCollapsedChange Called when the panel collapses or expands on its own.
 * @param props.testId The test id of the root element, in place of the default one.
 * @returns The regions, as large as their container.
 */
export function ShellRegions({
  project,
  node,
  inspector,
  problems,
  isTextMode,
  isProblemsCollapsed,
  onProblemsCollapsedChange,
  testId = SHELL_REGIONS_TEST_ID,
}: Readonly<ShellRegionsProps>): ReactNode {
  const projectRef = usePanelRef();
  const problemsRef = usePanelRef();
  // The width the project pane had before the text made it wider, to give it back
  const widthBeforeTextRef = useRef<number | undefined>(undefined);

  // The refs are set when the panels mount, before the effects run, so the optional chains only satisfy the types
  useEffect(() => {
    const panel = projectRef.current;

    if (isTextMode) {
      const width = panel?.getSize().inPixels;

      // A pane that the user made as wide as the text needs, or wider, keeps its width, and has none to get back
      if (width !== undefined && width < SIZES.project.text) {
        widthBeforeTextRef.current = width;
        panel?.resize(SIZES.project.text);
      }
    } else if (widthBeforeTextRef.current !== undefined) {
      panel?.resize(widthBeforeTextRef.current);
      widthBeforeTextRef.current = undefined;
    }
  }, [isTextMode, projectRef]);

  useEffect(() => {
    const panel = problemsRef.current;

    if (panel?.isCollapsed() === isProblemsCollapsed) {
      return;
    }
    if (isProblemsCollapsed) {
      panel?.collapse();
    } else {
      panel?.expand();
    }
  }, [isProblemsCollapsed, problemsRef]);

  return (
    <Frame data-testid={testId}>
      <Group orientation="vertical">
        <Panel minSize={SIZES.body.min}>
          <Group orientation="horizontal">
            <Panel
              panelRef={projectRef}
              defaultSize={SIZES.project.initial}
              minSize={SIZES.project.min}
              groupResizeBehavior="preserve-pixel-size"
            >
              {project}
            </Panel>
            <ColumnSeparator aria-label="Resize the project pane" />
            <Panel minSize={SIZES.node.min}>{node}</Panel>
            <ColumnSeparator aria-label="Resize the inspector" />
            <Panel
              defaultSize={SIZES.inspector.initial}
              minSize={SIZES.inspector.min}
              groupResizeBehavior="preserve-pixel-size"
            >
              {inspector}
            </Panel>
          </Group>
        </Panel>
        <RowSeparator aria-label="Resize the problems panel" />
        <Panel
          panelRef={problemsRef}
          defaultSize={SIZES.problems.initial}
          minSize={SIZES.problems.min}
          collapsible
          collapsedSize={SIZES.problems.collapsed}
          groupResizeBehavior="preserve-pixel-size"
          // The user can collapse the panel by dragging its separator down, which the shell has to know
          onResize={() =>
            onProblemsCollapsedChange(
              problemsRef.current?.isCollapsed() === true
            )
          }
        >
          {problems}
        </Panel>
      </Group>
    </Frame>
  );
}
