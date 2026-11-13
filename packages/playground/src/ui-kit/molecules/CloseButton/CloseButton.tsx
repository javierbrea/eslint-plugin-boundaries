import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import type { ReactNode } from "react";

import { Icon } from "@/ui-kit/atoms/Icon";

import {
  CLOSE_BUTTON_LABEL,
  CLOSE_BUTTON_TEST_ID,
} from "./CloseButton.constants";
import type { CloseButtonProps } from "./CloseButton.types";

/**
 * A small button with a cross that closes what a pane shows. Its tooltip says `Close`, and its accessible name says what it closes.
 * @param props CloseButton props.
 * @param props.subject What the button closes.
 * @param props.onClose Called when the user presses the button.
 * @returns The button.
 */
export function CloseButton({
  subject,
  onClose,
}: Readonly<CloseButtonProps>): ReactNode {
  return (
    <Tooltip title={CLOSE_BUTTON_LABEL}>
      <IconButton
        size="small"
        aria-label={`${CLOSE_BUTTON_LABEL} ${subject}`}
        data-testid={CLOSE_BUTTON_TEST_ID}
        onClick={onClose}
      >
        <Icon name="cross" />
      </IconButton>
    </Tooltip>
  );
}
