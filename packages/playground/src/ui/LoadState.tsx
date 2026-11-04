import { styled } from "@mui/material/styles";
import type { ReactNode } from "react";

import type { LoadStateProps } from "./LoadState.types";

const Message = styled("div", {
  shouldForwardProp: (prop) => prop !== "failed",
})<{ failed: boolean }>(({ failed }) => ({
  display: "grid",
  boxSizing: "border-box",
  height: "100%",
  padding: 24,
  placeItems: "center",
  color: failed ? "var(--jsb-bad)" : "var(--jsb-muted)",
  fontFamily: "var(--jsb-font-mono)",
  textAlign: "center",
}));

/**
 * Describes why the sketch is not on screen: it is loading, or it could not be loaded and why. It fills its container, as the workbench does.
 * @param props LoadState props.
 * @param props.load The state of the load of the sketch.
 * @returns The message.
 */
export function LoadState({ load }: Readonly<LoadStateProps>): ReactNode {
  if (load.status === "failed") {
    const reason =
      load.error instanceof Error ? load.error.message : String(load.error);

    return (
      <Message failed role="alert">
        {`The sketch could not be loaded: ${reason}`}
      </Message>
    );
  }
  return (
    <Message failed={false} role="status">
      Loading the sketch…
    </Message>
  );
}
