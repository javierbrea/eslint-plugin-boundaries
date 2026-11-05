import Button from "@mui/material/Button";
import { styled } from "@mui/material/styles";
import type { ReactNode } from "react";

import { CONFIG_PATH } from "@/domains/project/helpers/sketch";
import { Icon } from "@/ui-kit/atoms/Icon";
import { Mono } from "@/ui-kit/atoms/Mono";
import { PaneFrame } from "@/ui-kit/atoms/PaneFrame";
import { PaneHead } from "@/ui-kit/atoms/PaneHead";

import type { EmptyPaneProps } from "./EmptyPane.types";

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
    <PaneFrame>
      <PaneHead label="Nothing open" />
      <Content>
        <Title>Open a file or the config</Title>
        <Message>
          Pick a file in the project to see its dependencies and their verdicts,
          or open <Mono>{CONFIG_PATH}</Mono> to edit the settings and the rules.
        </Message>
        <Actions>
          <Button variant="outlined" onClick={onOpenConfig}>
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
