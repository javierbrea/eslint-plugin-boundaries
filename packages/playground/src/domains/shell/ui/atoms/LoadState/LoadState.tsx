import Button from "@mui/material/Button";
import { styled } from "@mui/material/styles";
import type { ReactNode } from "react";

import { Icon } from "@/ui-kit/atoms/Icon";
import { STATE_TEXT } from "@/ui-kit/helpers/tone";

import { LOAD_STATE_RESET_LABEL } from "./LoadState.constants";
import type { LoadStateProps } from "./LoadState.types";

const Frame = styled("div")({
  display: "grid",
  boxSizing: "border-box",
  height: "100%",
  padding: 24,
  placeContent: "center",
  justifyItems: "center",
  gap: 12,
});

const Message = styled("div", {
  shouldForwardProp: (prop) => prop !== "failed",
})<{ failed: boolean }>(({ failed }) => ({
  color: failed ? STATE_TEXT.bad : "var(--jsb-muted)",
  fontFamily: "var(--jsb-font-mono)",
  textAlign: "center",
}));

/**
 * Describes why the sketch is not on screen: it is loading, or it could not be loaded and why. A failure comes with a button to reset the sketch when the host gives one, so that a link that cannot be read is not a dead end. It fills its container, as the shell does.
 * @param props LoadState props.
 * @param props.load The state of the load of the sketch.
 * @param props.onReset Called when the user asks to reset the sketch after a failure. Without it the failure has no button.
 * @returns The message.
 */
export function LoadState({
  load,
  onReset,
}: Readonly<LoadStateProps>): ReactNode {
  if (load.status === "failed") {
    const reason =
      load.error instanceof Error ? load.error.message : String(load.error);

    return (
      <Frame>
        <Message failed role="alert">
          {`The sketch could not be loaded: ${reason}`}
        </Message>
        {onReset === undefined ? null : (
          <Button
            variant="outlined"
            startIcon={<Icon name="reset" />}
            onClick={onReset}
          >
            {LOAD_STATE_RESET_LABEL}
          </Button>
        )}
      </Frame>
    );
  }
  return (
    <Frame>
      <Message failed={false} role="status">
        Loading the sketch…
      </Message>
    </Frame>
  );
}
