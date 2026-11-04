import Button from "@mui/material/Button";
import { styled } from "@mui/material/styles";
import type { ReactNode } from "react";

import { PaneHead } from "../common";
import { Icon } from "../icons";

import type { EmptyPaneProps } from "./EmptyPane.types";
import { NodeFrame } from "./NodeFrame";

// The grid of the drafting table: two hairlines every 16 px over the card
const Content = styled("div")({
  display: "grid",
  flex: 1,
  minHeight: 0,
  boxSizing: "border-box",
  placeContent: "center",
  justifyItems: "center",
  gap: 10,
  padding: 24,
  overflow: "auto",
  backgroundColor: "var(--jsb-card)",
  backgroundImage:
    "linear-gradient(var(--jsb-grid) 1px, transparent 1px), linear-gradient(90deg, var(--jsb-grid) 1px, transparent 1px)",
  backgroundSize: "16px 16px",
  textAlign: "center",
});

// A host styles its headings, such as the website's tightened letter spacing, and the title has none in the mockup
const Title = styled("h2")({
  margin: 0,
  fontFamily: "var(--jsb-font-display)",
  fontSize: 16,
  fontWeight: 600,
  letterSpacing: "normal",
  lineHeight: 1.3,
});

const Message = styled("p")({
  maxWidth: "44ch",
  margin: 0,
  color: "var(--jsb-muted)",
});

// A host styles its `code`, such as the chip of the website's docs: here it is the text of the line in the mono font, with no box
const Mono = styled("code")({
  padding: 0,
  border: 0,
  borderRadius: 0,
  backgroundColor: "transparent",
  fontFamily: "var(--jsb-font-mono)",
  fontSize: "inherit",
  lineHeight: "inherit",
  verticalAlign: "baseline",
});

const Actions = styled("div")({
  display: "flex",
  gap: 8,
  marginTop: 6,
});

/**
 * The node pane when nothing is open: what to open, and a button for each way to start.
 * @param props EmptyPane props.
 * @param props.canAddFile Whether the project can have files added.
 * @param props.onOpenConfig Called when the user asks to open the config.
 * @param props.onAddFile Called when the user asks to add a file.
 * @returns The pane.
 */
export function EmptyPane({
  canAddFile,
  onOpenConfig,
  onAddFile,
}: Readonly<EmptyPaneProps>): ReactNode {
  return (
    <NodeFrame>
      <PaneHead label="Nothing open" />
      <Content>
        <Title>Open a file or the config</Title>
        <Message>
          Pick a file in the project to see its dependencies and their verdicts,
          or open <Mono>eslint.config.js</Mono> to edit the settings and the
          rules.
        </Message>
        <Actions>
          <Button variant="outlined" onClick={onOpenConfig}>
            Open eslint.config.js
          </Button>
          {canAddFile ? (
            <Button
              variant="text"
              startIcon={<Icon name="plus" />}
              onClick={onAddFile}
            >
              File
            </Button>
          ) : null}
        </Actions>
      </Content>
    </NodeFrame>
  );
}
