import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Link from "@mui/material/Link";
import { styled } from "@mui/material/styles";
import { useId } from "react";
import type { ReactNode } from "react";

import { Icon } from "@/ui-kit/atoms/Icon";

import {
  HELP_DIALOG_CLOSE_LABEL,
  HELP_DIALOG_GUIDE_LABEL,
  HELP_DIALOG_LEAD,
  HELP_DIALOG_TITLE,
  HELP_DIALOG_WIDTH,
} from "./HelpDialog.constants";
import type { HelpDialogProps } from "./HelpDialog.types";

const WideDialog = styled(Dialog)({
  // The border is part of the 540 px, as in the mockup
  "& .MuiDialog-paper": { width: HELP_DIALOG_WIDTH, boxSizing: "border-box" },
});

// The title and the actions come with 22 px of side padding, and the content of the dialog is built of parts that take their own, so that the steps and the tips line up with them. The rule that gives the content the padding of what follows a title is reset too
const HelpContent = styled(DialogContent)({
  padding: 0,
  ".MuiDialogTitle-root + &": { paddingTop: 0 },
});

const Lead = styled("p")(({ theme }) => ({
  margin: 0,
  padding: "0 22px 6px",
  color: "var(--jsb-muted)",
  ...theme.typography.bodyLarge,
  lineHeight: 1.5,
}));

const Steps = styled("ol")({
  display: "grid",
  gap: 14,
  margin: 0,
  padding: "14px 22px 6px",
  listStyle: "none",
  counterReset: "step",
});

const Step = styled("li")(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "24px minmax(0, 1fr)",
  gap: 12,
  margin: 0,
  padding: 0,
  ...theme.typography.bodyLarge,
  lineHeight: 1.5,
  counterIncrement: "step",
  // The number is drawn by the list, so that the steps carry only their words
  "&::before": {
    content: "counter(step)",
    display: "grid",
    placeItems: "center",
    boxSizing: "border-box",
    width: 24,
    height: 24,
    border: "1px solid var(--jsb-accent)",
    borderRadius: "50%",
    color: "var(--jsb-accent)",
    ...theme.typography.monoSmall,
    fontWeight: theme.typography.fontWeightMedium,
    lineHeight: 1,
  },
}));

const StepTitle = styled("strong")(({ theme }) => ({
  display: "block",
  fontWeight: theme.typography.fontWeightBold,
}));

const StepText = styled("span")({ color: "var(--jsb-muted)" });

const Tip = styled("p")(({ theme }) => ({
  display: "flex",
  gap: 8,
  margin: "12px 22px 0",
  padding: "10px 12px",
  borderRadius: "var(--jsb-radius)",
  backgroundColor: "var(--jsb-paper)",
  color: "var(--jsb-muted)",
  ...theme.typography.body2,
}));

const TipIcon = styled("span")({
  display: "inline-flex",
  marginTop: 2,
  color: "var(--jsb-accent)",
});

// A host styles its `code`, such as the chip of the website's docs, so this one sets its own box
const Code = styled("code")(({ theme }) => ({
  padding: "1px 5px",
  border: 0,
  borderRadius: 4,
  backgroundColor: "var(--jsb-accent-soft)",
  color: "var(--jsb-ink)",
  ...theme.typography.monoSmall,
  lineHeight: "normal",
  verticalAlign: "baseline",
}));

const GuideLink = styled(Link)(({ theme }) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  marginRight: "auto",
  color: "var(--jsb-accent)",
  ...theme.typography.button,
  lineHeight: "normal",
  textDecoration: "none",
  // A host styles the hover of its links, such as the underline of the website's docs
  "&:hover": { color: "var(--jsb-accent)", textDecoration: "none" },
}));

/**
 * The help of the playground: what it does, in three steps, and two notes that the steps do not cover, with a link to the Quick start guide when the host has one. It is a dialog, so it never opens by itself and it traps the focus while it is open.
 * @param props HelpDialog props.
 * @param props.isOpen Whether the dialog is open.
 * @param props.quickStartUrl The URL of the Quick start guide, if the host has one.
 * @param props.onClose Called when the user closes the dialog.
 * @param props.onExited Called when the dialog is gone from the page after it closed.
 * @returns The dialog.
 */
export function HelpDialog({
  isOpen,
  quickStartUrl,
  onClose,
  onExited,
}: Readonly<HelpDialogProps>): ReactNode {
  const titleId = useId();

  return (
    <WideDialog
      open={isOpen}
      onClose={onClose}
      aria-labelledby={titleId}
      // The dialog keeps the focus while it fades out, so the caller can take it back only when it is gone
      slotProps={{ transition: { onExited } }}
    >
      <DialogTitle id={titleId}>{HELP_DIALOG_TITLE}</DialogTitle>
      <HelpContent>
        <Lead>{HELP_DIALOG_LEAD}</Lead>
        {/* A list that is drawn with `list-style: none` loses its role in some browsers, so it keeps it here */}
        <Steps role="list">
          <Step>
            <div>
              <StepTitle>Sketch the files</StepTitle>
              <StepText>
                Add, rename and delete files in Project, or switch it to text
                and write one path per line.
              </StepText>
            </div>
          </Step>
          <Step>
            <div>
              <StepTitle>Write the config</StepTitle>
              <StepText>
                Open <Code>eslint.config.js</Code> and edit its{" "}
                <Code>settings</Code> and <Code>rules</Code>, the same ones the
                plugin takes. Problems are underlined as you type.
              </StepText>
            </div>
          </Step>
          <Step>
            <div>
              <StepTitle>Add dependencies</StepTitle>
              <StepText>
                Select a file to see its element, then add its imports to see
                which ones the rules allow, and which policy decides.
              </StepText>
            </div>
          </Step>
        </Steps>
        <Tip>
          <TipIcon>
            <Icon name="info" />
          </TipIcon>
          <span>
            Imports are written with the full relative path of their file, such
            as <Code>../helpers/format/index.js</Code>, and that is the path{" "}
            <Code>dependency.source</Code>, <Code>customSourcePatterns</Code>{" "}
            and <Code>{"{{dependency.source}}"}</Code> see. Text mode also reads
            shorter paths, by a rule of its own and not by the resolvers of your
            config: with <Code>eslint-import-resolver-typescript</Code>, ESLint
            takes <Code>./b.js</Code> to a <Code>b.ts</Code> beside it.
          </span>
        </Tip>
        <Tip>
          <TipIcon>
            <Icon name="info" />
          </TipIcon>
          <span>
            The project starts with the example of the Quick start. Reset brings
            it back, and Share copies a link with the whole project.
          </span>
        </Tip>
      </HelpContent>
      <DialogActions>
        {quickStartUrl === undefined ? null : (
          <GuideLink href={quickStartUrl} underline="none">
            {HELP_DIALOG_GUIDE_LABEL}
            <Icon name="arrow" />
          </GuideLink>
        )}
        <Button variant="contained" onClick={onClose}>
          {HELP_DIALOG_CLOSE_LABEL}
        </Button>
      </DialogActions>
    </WideDialog>
  );
}
