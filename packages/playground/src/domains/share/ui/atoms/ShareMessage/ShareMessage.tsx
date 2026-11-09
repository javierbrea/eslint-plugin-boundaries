import { styled } from "@mui/material/styles";
import type { ReactNode } from "react";

import { getShareMessage } from "@/domains/share/ui/helpers/shareMessage";
import { Icon } from "@/ui-kit/atoms/Icon";
import { TONE_COLORS } from "@/ui-kit/helpers/tone";

import type { ShareMessageProps } from "./ShareMessage.types";

const Region = styled("span", {
  shouldForwardProp: (prop) => prop !== "textColor",
})<{ textColor?: string }>(({ theme, textColor }) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  // A message that is longer than the room left in the bar shrinks, to be cut by its text, before it pushes the buttons out
  minWidth: 0,
  color: textColor,
  ...theme.typography.caption,
  lineHeight: "normal",
  // Out of the flow while it says nothing, so that the empty region leaves no gap around it in a row of items
  "&:empty": { position: "absolute" },
}));

const Check = styled("span")({
  display: "inline-flex",
  // Never shrunk: the text gives way to it, not the other way around
  flexShrink: 0,
  color: TONE_COLORS.ok,
});

// The text of the message, on one line, cut with an ellipsis where the region has no room for it
const Words = styled("span")({
  minWidth: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});

/**
 * The message that says how the last share went. The region that announces it, which is polite so that it never interrupts, is always there, so that screen readers pick up the text that comes into it. A message that does not fit in the bar is cut with an ellipsis, and its full text is its `title`.
 * @param props ShareMessage props.
 * @param props.outcome How the last share ended. The message is empty when it is unset.
 * @returns The live region.
 */
export function ShareMessage({
  outcome,
}: Readonly<ShareMessageProps>): ReactNode {
  const message = outcome === undefined ? undefined : getShareMessage(outcome);

  return (
    <Region role="status" aria-live="polite" textColor={message?.color}>
      {message === undefined ? null : (
        <>
          {message.hasCheck ? (
            <Check>
              <Icon name="check" />
            </Check>
          ) : null}
          <Words title={message.text}>{message.text}</Words>
        </>
      )}
    </Region>
  );
}
