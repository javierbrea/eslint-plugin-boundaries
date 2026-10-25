import clsx from "clsx";
import { Highlight as PrismHighlight } from "prism-react-renderer";
import type { ReactNode } from "react";

import { blueprintTheme } from "../../../prism/blueprintTheme";

import styles from "./CodeSnippet.module.css";

/** Props of {@link CodeSnippet}. */
export type CodeSnippetProps = {
  /** Source code to highlight. */
  code: string;
  /** Prism language of the code. */
  language?: string;
  /** Extra class names. */
  className?: string;
};

/**
 * Read-only highlighted code block on the always-dark palette, with a left accent rule.
 * @param props Code snippet props.
 * @returns The code block.
 */
export default function CodeSnippet({
  code,
  language = "js",
  className,
}: CodeSnippetProps): ReactNode {
  return (
    <PrismHighlight code={code} language={language} theme={blueprintTheme}>
      {({ className: prismClassName, tokens, getLineProps, getTokenProps }) => (
        <pre className={clsx(prismClassName, styles.code, className)}>
          <code>
            {tokens.map((line, lineIndex) => {
              // The line style carries the theme background; the block paints the --jsb-code token instead
              const { style: _style, ...lineProps } = getLineProps({ line });
              return (
                <span key={lineIndex} {...lineProps}>
                  {line.map((token, tokenIndex) => (
                    <span key={tokenIndex} {...getTokenProps({ token })} />
                  ))}
                  {"\n"}
                </span>
              );
            })}
          </code>
        </pre>
      )}
    </PrismHighlight>
  );
}
