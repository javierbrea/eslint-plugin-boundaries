import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import OutlinedInput from "@mui/material/OutlinedInput";
import { styled } from "@mui/material/styles";
import { useCallback, useId, useRef } from "react";
import type { FocusEvent as ReactFocusEvent, ReactNode } from "react";

import { CopiedAnnouncement } from "@/domains/share/ui/atoms/CopiedAnnouncement";
import { getShareNotice } from "@/domains/share/ui/helpers/shareNotice";
import { Icon } from "@/ui-kit/atoms/Icon";
import { TONE_COLORS } from "@/ui-kit/helpers/tone";
import type { Tone } from "@/ui-kit/helpers/tone";
import { CopyButton } from "@/ui-kit/molecules/CopyButton";

import {
  SHARE_DIALOG_ACKNOWLEDGE_LABEL,
  SHARE_DIALOG_CLOSE_LABEL,
  SHARE_DIALOG_COPY_LABEL,
  SHARE_DIALOG_COPY_TEST_ID,
  SHARE_DIALOG_LINK_LABEL,
  SHARE_DIALOG_TEST_ID,
  SHARE_DIALOG_WIDTH,
} from "./ShareDialog.constants";
import type { ShareDialogProps } from "./ShareDialog.types";

/** The side of the icon of the title, in pixels. */
const TITLE_ICON_SIZE = 16;

/** The space between the icon of the title and its words, in pixels. */
const TITLE_GAP = 10;

const NarrowDialog = styled(Dialog)({
  // The border is part of the width, as in the help dialog
  "& .MuiDialog-paper": { width: SHARE_DIALOG_WIDTH, boxSizing: "border-box" },
});

const Title = styled(DialogTitle)({
  display: "flex",
  alignItems: "flex-start",
  gap: TITLE_GAP,
});

const TitleIcon = styled("span", {
  shouldForwardProp: (prop) => prop !== "tone",
})<{ tone: Tone }>(({ theme, tone }) => ({
  display: "inline-flex",
  flex: "none",
  // Centered on the first line of the title
  marginTop: `calc((${theme.typography.dialogTitle.lineHeight}em - ${TITLE_ICON_SIZE}px) / 2)`,
  color: TONE_COLORS[tone],
}));

// The content starts where the words of the title start, past its icon
const Content = styled(DialogContent)({
  display: "grid",
  gap: 12,
  paddingLeft: 22 + TITLE_ICON_SIZE + TITLE_GAP,
});

const Message = styled("p")(({ theme }) => ({
  margin: 0,
  color: "var(--jsb-muted)",
  ...theme.typography.bodyLarge,
  lineHeight: 1.5,
}));

const Reason = styled("p")(({ theme }) => ({
  display: "flex",
  gap: 8,
  margin: 0,
  padding: "10px 12px",
  borderRadius: "var(--jsb-radius)",
  backgroundColor: "var(--jsb-paper)",
  color: "var(--jsb-ink)",
  ...theme.typography.body2,
}));

const ReasonIcon = styled("span")({
  display: "inline-flex",
  flex: "none",
  marginTop: 2,
  color: TONE_COLORS.bad,
});

const LinkField = styled(OutlinedInput)({
  backgroundColor: "var(--jsb-paper)",
});

/**
 * Selects the whole link when its field takes the focus, so that the user copies it with one keystroke.
 * @param focusEvent The focus event of the field.
 */
function selectAll(focusEvent: ReactFocusEvent<HTMLInputElement>): void {
  focusEvent.currentTarget.select();
}

/**
 * The dialog that tells the user what a share has to say beyond a link that was copied: a long link, a link that could not be copied or made, or a project that cannot be shared. Its title starts with an icon in the tone of the notice, and its text and its reason are its description. A link that could not be copied is shown in a field, selected, beside a button that copies it again and says so; a field is selected again when the copy fails again. Every other notice has one button that closes it, which takes the keyboard focus. The field or the button takes the focus again once the dialog has come in.
 * @param props ShareDialog props.
 * @param props.notice What the share has to tell the user about.
 * @param props.isOpen Whether the dialog is open.
 * @param props.isCopiedAgain Whether the last copy of the link from the dialog worked.
 * @param props.onCopyAgain Copies the link again, and tells whether it was copied.
 * @param props.onClose Called when the user closes the dialog.
 * @param props.onExited Called when the dialog is gone from the page after it closed.
 * @returns The dialog.
 */
export function ShareDialog({
  notice,
  isOpen,
  isCopiedAgain,
  onCopyAgain,
  onClose,
  onExited,
}: Readonly<ShareDialogProps>): ReactNode {
  const titleId = useId();
  const messageId = useId();
  const reasonId = useId();
  const fieldRef = useRef<HTMLInputElement>(null);
  const acknowledgeRef = useRef<HTMLButtonElement>(null);
  const { tone, title, text, reason, link } = getShareNotice(notice);

  // `autoFocus` gives the focus to the field, or to Got it, as soon as the dialog mounts. Under React's strict mode, the focus trap of the dialog runs its effect twice on mount, and the second run hands the focus to the paper; so the focus goes to them again once the dialog is in
  const focusFirstControl = useCallback(() => {
    const field = fieldRef.current;

    if (field === null) {
      (acknowledgeRef.current as HTMLButtonElement).focus();
    } else {
      field.focus();
      field.select();
    }
  }, []);

  const copyAgain = useCallback(
    async (linkToCopy: string) => {
      const isCopied = await onCopyAgain(linkToCopy);
      // The field is gone when the dialog closed while the copy was running
      const field = fieldRef.current;

      if (!isCopied && field !== null) {
        field.focus();
        field.select();
      }
    },
    [onCopyAgain]
  );

  return (
    <NarrowDialog
      open={isOpen}
      onClose={onClose}
      aria-labelledby={titleId}
      // The focus goes to a control, so screen readers read what happened only as the description of the dialog
      aria-describedby={
        reason === undefined ? messageId : `${messageId} ${reasonId}`
      }
      data-testid={SHARE_DIALOG_TEST_ID}
      // The dialog keeps the focus while it fades out, so the caller can take it back only when it is gone
      slotProps={{ transition: { onEntered: focusFirstControl, onExited } }}
    >
      <Title id={titleId}>
        <TitleIcon tone={tone}>
          <Icon
            name={tone === "warn" ? "warn" : "cross"}
            size={TITLE_ICON_SIZE}
          />
        </TitleIcon>
        {title}
      </Title>
      <Content>
        <Message id={messageId}>{text}</Message>
        {reason === undefined ? null : (
          <Reason id={reasonId}>
            <ReasonIcon>
              <Icon name="cross" />
            </ReasonIcon>
            <span>{reason}</span>
          </Reason>
        )}
        {link === undefined ? null : (
          <>
            <LinkField
              inputRef={fieldRef}
              value={link}
              readOnly
              fullWidth
              autoFocus
              onFocus={selectAll}
              inputProps={{ "aria-label": SHARE_DIALOG_LINK_LABEL }}
            />
            <CopiedAnnouncement isCopied={isCopiedAgain} />
          </>
        )}
      </Content>
      <DialogActions>
        {link === undefined ? (
          <Button
            ref={acknowledgeRef}
            variant="contained"
            autoFocus
            onClick={onClose}
          >
            {SHARE_DIALOG_ACKNOWLEDGE_LABEL}
          </Button>
        ) : (
          <>
            <Button variant="text" onClick={onClose}>
              {SHARE_DIALOG_CLOSE_LABEL}
            </Button>
            <CopyButton
              label={SHARE_DIALOG_COPY_LABEL}
              isCopied={isCopiedAgain}
              onClick={() => {
                void copyAgain(link);
              }}
              testId={SHARE_DIALOG_COPY_TEST_ID}
            />
          </>
        )}
      </DialogActions>
    </NarrowDialog>
  );
}
