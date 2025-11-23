import clsx from "clsx";
import { Highlight as PrismHighlight, themes } from "prism-react-renderer";
import type { PrismTheme } from "prism-react-renderer";
import React, { useState } from "react";

import styles from "./styles.module.css";

type CodeDiffProps = { children: React.ReactNode; language?: string };
type CodeDiffBaseProps = CodeDiffProps & { theme: PrismTheme };

// Icon to copy code
function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" className={styles.copyIcon}>
      <path
        fill="currentColor"
        d="M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z"
      />
    </svg>
  );
}

// Icon to indicate successful copy
function SuccessIcon() {
  return (
    <svg viewBox="0 0 24 24" className={styles.successIcon}>
      <path
        fill="currentColor"
        d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z"
      />
    </svg>
  );
}

function CodeDiffBase({
  children,
  language = "typescript",
  theme,
}: CodeDiffBaseProps) {
  // Convert children to string
  const codeString = React.Children.toArray(children)
    .map((child) => (typeof child === "string" ? child : ""))
    .join("\n");

  const lines = codeString.split(/\r?\n/);

  // Remove first and last empty lines from original lines
  const trimmedOriginalLines = [...lines];
  if (trimmedOriginalLines[0] === "") trimmedOriginalLines.shift();
  if (trimmedOriginalLines[trimmedOriginalLines.length - 1] === "")
    trimmedOriginalLines.pop();

  // Clean code without prefixes for copying and display
  // Each line should start with a marker character followed by a space (e.g., "+ ", "- ", ". ")
  // We remove the first 2 characters (marker + space) from each line
  const cleanLines = trimmedOriginalLines.map((line) => {
    if (line.length >= 2 && line[1] === " ") {
      return line.slice(2);
    }
    return line;
  });

  const cleanCode = cleanLines.join("\n");

  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(cleanCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    } catch (e) {
      console.error("Copy failed", e);
    }
  };

  return (
    <div className={styles.codeBlock}>
      {/* Copy button styled like Docusaurus */}
      <button
        type="button"
        aria-label={copied ? "Copied" : "Copy code to clipboard"}
        title="Copy"
        className={clsx(styles.copyButton, copied && styles.copyButtonCopied)}
        onClick={handleCopy}
      >
        <span className={styles.copyButtonIcons} aria-hidden="true">
          <CopyIcon />
          <SuccessIcon />
        </span>
      </button>

      {/* children prop is required by HighlightProps type definition */}
      <PrismHighlight
        code={cleanCode}
        language={language}
        theme={theme}
        // eslint-disable-next-line
        children={({ tokens, getLineProps, getTokenProps }) => (
          <pre style={{ overflowX: "auto", padding: "1em" }}>
            {tokens.map((lineTokens, i) => {
              const line = trimmedOriginalLines[i] || "";
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const { key: _, ...linePropsRest } = getLineProps({
                line: lineTokens,
                key: i,
              });

              // Diff classes based on the first character
              const marker = line.length > 0 ? line[0] : "";
              if (marker === "+")
                linePropsRest.className = clsx(
                  linePropsRest.className,
                  "diff-addition"
                );
              else if (marker === "-")
                linePropsRest.className = clsx(
                  linePropsRest.className,
                  "diff-deletion"
                );
              else
                linePropsRest.className = clsx(
                  linePropsRest.className,
                  "diff-context"
                );

              return (
                <div key={i} {...linePropsRest}>
                  {lineTokens.map((token, tokenKey) => (
                    <span key={tokenKey} {...getTokenProps({ token })} />
                  ))}
                </div>
              );
            })}
          </pre>
        )}
      />
    </div>
  );
}

export default function CodeDiff(props: CodeDiffProps) {
  return (
    <>
      <div className="diff-theme-light">
        <CodeDiffBase {...props} theme={themes.github} />
      </div>
      <div className="diff-theme-dark" aria-hidden="true">
        <CodeDiffBase {...props} theme={themes.vsDark} />
      </div>
    </>
  );
}
