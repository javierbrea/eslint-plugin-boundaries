import { styled } from "@mui/material/styles";
import { Fragment } from "react";
import type { ReactNode } from "react";

import type { StatementToken } from "@/domains/project/helpers/sketch";

import type { StatementProps } from "./Statement.types";

// A host styles its `code`, such as the chip of the website's docs, so the statement resets the box and takes the font of the text around it: the picker and the file pane each set theirs. The alignment is reset too: a `code` aligned to the middle of the line makes the line taller than its line height
const Code = styled("code")({
  padding: 0,
  border: 0,
  borderRadius: 0,
  backgroundColor: "transparent",
  verticalAlign: "baseline",
  fontFamily: "inherit",
  fontSize: "inherit",
  lineHeight: "inherit",
});

const Keyword = styled("span")({ color: "var(--jsb-code-keyword)" });

const Source = styled("span")({ color: "var(--jsb-code-string)" });

/** The element that draws each kind of piece that has a color of its own. */
const COLORED_PIECES = { keyword: Keyword, source: Source } as const;

/**
 * Draws one piece of a statement.
 * @param token The piece.
 * @returns A colored element for a keyword or a source, and the bare text for any other piece, which inherits the color around it.
 */
function renderToken(token: StatementToken): ReactNode {
  if (token.kind === "text") {
    return token.text;
  }

  const Piece = COLORED_PIECES[token.kind];

  return <Piece>{token.text}</Piece>;
}

/**
 * A statement as one inline run of code, with its keywords and its source colored for a code area. The font is the one of the surroundings, so that it reads right in the preview of the picker and in the lines of a file.
 * @param props Statement props.
 * @param props.tokens The pieces of the statement, as the sketch writes them.
 * @returns The code element.
 */
export function Statement({ tokens }: Readonly<StatementProps>): ReactNode {
  return (
    <Code>
      {tokens.map((token, index) => (
        // The pieces never reorder: they are written again from the statement

        <Fragment key={index}>{renderToken(token)}</Fragment>
      ))}
    </Code>
  );
}
