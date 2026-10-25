import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

import { NPM_PACKAGE } from "../../../data/site/product";
import { CopyIcon } from "../../ui/Icons/Icons";

import styles from "./InstallCommand.module.css";

const COMMAND = `npm i -D ${NPM_PACKAGE}`;
const COPIED_FEEDBACK_MS = 1200;

/**
 * Install command of the plugin with a button that copies it to the clipboard.
 * @returns The install command box.
 */
export default function InstallCommand(): ReactNode {
  const [copied, setCopied] = useState(false);
  const timeout = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timeout.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(COMMAND);
      setCopied(true);
      window.clearTimeout(timeout.current);
      timeout.current = window.setTimeout(
        () => setCopied(false),
        COPIED_FEEDBACK_MS
      );
    } catch {
      // Clipboard access may be denied; the command stays visible to copy by hand
    }
  };

  return (
    <div className={styles.install}>
      <span className={styles.prompt} aria-hidden="true">
        $
      </span>
      <code className={styles.command}>{COMMAND}</code>
      <button
        type="button"
        className={clsx(styles.copy, copied && styles.copied)}
        aria-label="Copy install command"
        onClick={copy}
      >
        <CopyIcon className={styles.icon} />
      </button>
      <span className={styles.status} aria-live="polite">
        {copied ? "Copied" : ""}
      </span>
    </div>
  );
}
