import Button from "@mui/material/Button";
import { styled } from "@mui/material/styles";
import type { ReactNode } from "react";

import { CONFIG_PATH } from "@/domains/project/helpers/sketch";
import { Icon } from "@/ui-kit/atoms/Icon";
import { Mono } from "@/ui-kit/atoms/Mono";
import { PaneFrame } from "@/ui-kit/atoms/PaneFrame";
import { PaneHead } from "@/ui-kit/atoms/PaneHead";

import { EMPTY_NODE_LABEL, EMPTY_NODE_TEST_ID } from "./EmptyNode.constants";
import type { EmptyNodeProps } from "./EmptyNode.types";

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
const Title = styled("h2")(({ theme }) => ({
  margin: 0,
  ...theme.typography.title,
}));

const Message = styled("p")({
  maxWidth: "44ch",
  margin: 0,
  color: "var(--jsb-muted)",
});

const Actions = styled("div")({
  display: "flex",
  gap: 8,
  marginTop: 6,
});

/**
 * The node pane when nothing is open: what to open, and a button for each way to start.
 * @param props EmptyNode props.
 * @param props.canAddFile Whether the project can have files added.
 * @param props.onOpenConfig Called when the user asks to open the config.
 * @param props.onAddFile Called when the user asks to add a file.
 * @param props.autoFocusOpenConfig Whether the button that opens the config takes the keyboard focus when it is first rendered.
 * @param props.frameLabel The accessible name of the landmark of the pane.
 * @param props.testId The test id of the root element, in place of the default one.
 * @returns The pane.
 */
export function EmptyNode({
  canAddFile,
  onOpenConfig,
  onAddFile,
  autoFocusOpenConfig = false,
  frameLabel,
  testId = EMPTY_NODE_TEST_ID,
}: Readonly<EmptyNodeProps>): ReactNode {
  return (
    <PaneFrame label={frameLabel} testId={testId}>
      <PaneHead label={EMPTY_NODE_LABEL} />
      <Content>
        <Title>Open a file or the config</Title>
        <Message>
          Pick a file in the project to see its dependencies and their verdicts,
          or open <Mono>{CONFIG_PATH}</Mono> to edit the settings and the rules.
        </Message>
        <Actions>
          <Button
            variant="outlined"
            autoFocus={autoFocusOpenConfig}
            onClick={onOpenConfig}
          >
            Open {CONFIG_PATH}
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
    </PaneFrame>
  );
}
