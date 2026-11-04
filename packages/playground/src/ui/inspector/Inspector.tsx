import { styled } from "@mui/material/styles";
import type { ReactNode } from "react";

import { PaneHead } from "../common";

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
 * @param props.onReveal Called with the range of the config that a row is about.
 * @returns The content for a file, for the config, or for the sketch when nothing is open.
 */
function InspectorContent({
  focus: current,
  evaluation,
  onReveal,
}: Readonly<InspectorProps>): ReactNode {
  if (current.kind === "file") {
    return <FileInspector path={current.path} evaluation={evaluation} />;
  }
  if (current.kind === "config") {
    return <ConfigInspector evaluation={evaluation} onReveal={onReveal} />;
  }
  return <SketchInspector evaluation={evaluation} />;
}

/**
 * The right pane: describes what is in focus, from the evaluation of the engine. A file shows how the plugin describes it, the config lists its entries, and nothing in focus shows the numbers of the sketch.
 * @param props Inspector props.
 * @param props.focus What is in focus.
 * @param props.evaluation What the engine says about the sketch.
 * @param props.onReveal Called with the range of the config that a row is about, so that the workbench opens the config there.
 * @returns The pane.
 */
export function Inspector({
  focus: current,
  evaluation,
  onReveal,
}: Readonly<InspectorProps>): ReactNode {
  return (
    <Frame aria-label="Inspector">
      <PaneHead label="Inspector" />
      <Content>
        <InspectorContent
          focus={current}
          evaluation={evaluation}
          onReveal={onReveal}
        />
      </Content>
    </Frame>
  );
}
