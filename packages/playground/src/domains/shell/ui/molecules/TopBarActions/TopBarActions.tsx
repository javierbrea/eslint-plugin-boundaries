import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import { styled } from "@mui/material/styles";
import Tooltip from "@mui/material/Tooltip";
import type { ReactNode } from "react";

import { CopiedAnnouncement } from "@/domains/share/ui/atoms/CopiedAnnouncement";
import { Icon } from "@/ui-kit/atoms/Icon";
import { CopyButton } from "@/ui-kit/molecules/CopyButton";

import {
  HELP_BUTTON_LABEL,
  RESET_BUTTON_LABEL,
  SHARE_BUTTON_LABEL,
  SHARE_BUTTON_TEST_ID,
  TOP_BAR_ACTIONS_TEST_ID,
} from "./TopBarActions.constants";
import type { TopBarActionsProps } from "./TopBarActions.types";

// The bar spaces its items, so the actions are laid out as items of the bar and not as a box of their own. The buttons keep their size
const Group = styled("div")({
  display: "contents",
  "& > button": { flexShrink: 0 },
});

/**
 * The actions at the end of the top bar: Help as an icon, Reset and Share. Share says itself that it copied the link, and a region that screen readers read says it too. The sketch is not touched here: each button asks its caller.
 * @param props TopBarActions props.
 * @param props.isHelpOpen Whether the help is open, which the Help button shows as pressed.
 * @param props.helpButtonRef Gives the caller the element of the Help button.
 * @param props.isShareCopied Whether Share confirms that it copied the link.
 * @param props.shareButtonRef Gives the caller the element of the Share button.
 * @param props.onHelp Called when the user asks for the help.
 * @param props.onReset Called when the user asks to reset the sketch.
 * @param props.onShare Called when the user asks to share the sketch. Without it there is no Share button and no region that says it copied.
 * @param props.autoFocusReset Whether the Reset button takes the keyboard focus when it is first rendered.
 * @param props.testId The test id of the root element, in place of the default one.
 * @returns The actions, which take their place in the flex row of the bar.
 */
export function TopBarActions({
  isHelpOpen,
  helpButtonRef,
  isShareCopied = false,
  shareButtonRef,
  onHelp,
  onReset,
  onShare,
  autoFocusReset = false,
  testId = TOP_BAR_ACTIONS_TEST_ID,
}: Readonly<TopBarActionsProps>): ReactNode {
  return (
    <Group data-testid={testId}>
      <Tooltip title={HELP_BUTTON_LABEL}>
        <IconButton
          ref={helpButtonRef}
          aria-label={HELP_BUTTON_LABEL}
          aria-haspopup="dialog"
          aria-pressed={isHelpOpen}
          onClick={onHelp}
        >
          <Icon name="help" size={16} />
        </IconButton>
      </Tooltip>
      <Button
        variant="text"
        autoFocus={autoFocusReset}
        startIcon={<Icon name="reset" />}
        onClick={onReset}
      >
        {RESET_BUTTON_LABEL}
      </Button>
      {onShare === undefined ? null : (
        <>
          <CopyButton
            label={SHARE_BUTTON_LABEL}
            icon="share"
            isCopied={isShareCopied}
            buttonRef={shareButtonRef}
            onClick={onShare}
            testId={SHARE_BUTTON_TEST_ID}
          />
          <CopiedAnnouncement isCopied={isShareCopied} />
        </>
      )}
    </Group>
  );
}
