import { styled } from "@mui/material/styles";
import type { ReactNode } from "react";

import type { MonoProps } from "./Mono.types";

const Code = styled("code")({
  padding: 0,
  border: 0,
  borderRadius: 0,
  backgroundColor: "transparent",
  fontFamily: "var(--jsb-font-mono)",
  fontSize: "inherit",
  lineHeight: "inherit",
  verticalAlign: "baseline",
});

/**
 * A name or a path inside a sentence, in the mono font. A host styles its `code`, such as the chip of the website's docs, so this one resets the box and takes the size of the text around it.
 * @param props Mono props.
 * @param props.children The name or the path to draw.
 * @returns The code element.
 */
export function Mono({ children }: Readonly<MonoProps>): ReactNode {
  return <Code>{children}</Code>;
}
