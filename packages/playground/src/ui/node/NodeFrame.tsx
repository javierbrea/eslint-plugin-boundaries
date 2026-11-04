import { styled } from "@mui/material/styles";
import type { ReactNode } from "react";

const Frame = styled("section")({
  display: "flex",
  flexDirection: "column",
  boxSizing: "border-box",
  height: "100%",
  minWidth: 0,
  minHeight: 0,
});

/** Props of {@link NodeFrame}. */
type NodeFrameProps = {
  /** The head of the pane and its body. */
  children: ReactNode;
};

/**
 * The landmark of the node in focus, which the three states of the pane share: a column as tall as its container, so that the body takes what the head leaves and scrolls on its own.
 * @param props NodeFrame props.
 * @param props.children The head of the pane and its body.
 * @returns The landmark.
 */
export function NodeFrame({ children }: Readonly<NodeFrameProps>): ReactNode {
  return <Frame aria-label="Node in focus">{children}</Frame>;
}
