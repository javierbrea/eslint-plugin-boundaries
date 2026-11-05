import { styled } from "@mui/material/styles";
import type { ReactNode } from "react";

import { PaneHead } from "@/ui/common";

import { ConfigInspector } from "./ConfigInspector";
import { FileInspector } from "./FileInspector";
import type { InspectorProps } from "./Inspector.types";
import { SketchInspector } from "./SketchInspector";

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
 * Picks what the inspector shows for the focus.
 * @param props Inspector props.
 * @param props.focus What is in focus.
 * @param props.evaluation What the engine says about the sketch.
 * @param props.onOpen Called with what a row opens.
 * @returns The content for a file, for the config, or for the sketch when nothing is open.
 */
function InspectorContent({
  focus: current,
  evaluation,
  onOpen,
}: Readonly<InspectorProps>): ReactNode {
  if (current.kind === "file") {
    return <FileInspector path={current.path} evaluation={evaluation} />;
  }
  if (current.kind === "config") {
    return <ConfigInspector evaluation={evaluation} onOpen={onOpen} />;
  }
  return <SketchInspector evaluation={evaluation} />;
}

/**
 * The right pane: describes what is in focus, from the evaluation of the engine. A file shows how the plugin describes it, the config lists its entries, and nothing in focus shows the numbers of the sketch.
 * @param props Inspector props.
 * @param props.focus What is in focus.
 * @param props.evaluation What the engine says about the sketch.
 * @param props.onOpen Called with what a row opens, such as the entry of the config that a row of the config inspector is about.
 * @returns The pane.
 */
export function Inspector({
  focus: current,
  evaluation,
  onOpen,
}: Readonly<InspectorProps>): ReactNode {
  return (
    <Frame aria-label="Inspector">
      <PaneHead label="Inspector" />
      <Content>
        <InspectorContent
          focus={current}
          evaluation={evaluation}
          onOpen={onOpen}
        />
      </Content>
    </Frame>
  );
}
