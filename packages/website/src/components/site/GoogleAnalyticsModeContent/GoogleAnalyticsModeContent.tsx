import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import type { ReactNode } from "react";

import type { GoogleAnalyticsMode } from "../../../data/site/googleAnalyticsMode";
import {
  isShownInGoogleAnalyticsMode,
  readGoogleAnalyticsMode,
} from "../../../data/site/googleAnalyticsMode";

/** Props of {@link GoogleAnalyticsModeContent}. */
export type GoogleAnalyticsModeContentProps = {
  /** The modes of Google Analytics in which the content shows. */
  modes: readonly GoogleAnalyticsMode[];
  /** The content, shown only in a build of one of `modes`. */
  children: ReactNode;
};

/**
 * Shows its content only in a build whose mode of Google Analytics is one of `modes`, so that a page describes what the site does in the mode it was built with.
 * @param props GoogleAnalyticsModeContent props.
 * @param props.modes The modes of Google Analytics in which the content shows.
 * @param props.children The content, shown only in a build of one of `modes`.
 * @returns `children` in a build of one of `modes`, `null` in any other build.
 * @throws {Error} When an entry of `modes` is not a mode, so that a typo in an MDX page fails the build.
 */
export default function GoogleAnalyticsModeContent({
  modes,
  children,
}: Readonly<GoogleAnalyticsModeContentProps>): ReactNode {
  const mode = readGoogleAnalyticsMode(
    useDocusaurusContext().siteConfig.customFields
  );
  return isShownInGoogleAnalyticsMode(mode, modes) ? children : null;
}
