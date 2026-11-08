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
  color: textColor,
  ...theme.typography.caption,
  lineHeight: "normal",
  whiteSpace: "nowrap",
  // Out of the flow while it says nothing, so that the empty region leaves no gap around it in a row of items
  "&:empty": { position: "absolute" },
}));

const Check = styled("span")({
  display: "inline-flex",
  color: TONE_COLORS.ok,
});

/**
 * The message that says how the last share went. The region that announces it, which is polite so that it never interrupts, is always there, so that screen readers pick up the text that comes into it.
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
          {message.text}
        </>
      )}
    </Region>
  );
}
