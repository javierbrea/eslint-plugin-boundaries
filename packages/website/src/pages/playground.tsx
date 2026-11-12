import BrowserOnly from "@docusaurus/BrowserOnly";
import { useLocation } from "@docusaurus/router";
import Heading from "@theme/Heading";
import Layout from "@theme/Layout";
import { Suspense, lazy } from "react";
import type { ReactNode } from "react";

import { useMediaQuery } from "../components/motion/useMediaQuery";
import { DOCS_PLAYGROUND_GUIDE, DOCS_QUICK_START } from "../data/site/links";

import {
  PLAYGROUND_PAGE_LOADING_TEST_ID,
  PLAYGROUND_PAGE_NOTE_TEST_ID,
} from "./playground.constants";
import styles from "./playground.module.css";

const LEAD =
  "Paste a boundaries config, sketch a folder tree with the dependencies of each file, and see how each file is classified and which imports are allowed. In the browser, nothing to install.";

// The mobile navbar breakpoint of Docusaurus
const NARROW_QUERY = "(max-width: 996px)";

// The playground and its host objects load in their own chunk, requested only by this page and only in the browser
const LazyPlayground = lazy(async () => {
  const { HashStore, Playground, QUICK_START_EXAMPLE, SketchSource } =
    await import("@boundaries/playground");
  const source = new SketchSource(QUICK_START_EXAMPLE.sketch);
  const store = new HashStore();

  return {
    default: function WebsitePlayground(): ReactNode {
      // A visit to this page that the router makes, such as the navbar entry while the page is open, drops the hash from the URL without any event that the store hears: the playground mounts again, and the store loads the sketch it remembers and writes it back to the hash
      const { key } = useLocation();

      return (
        <Playground
          key={key}
          source={source}
          store={store}
          guideUrl={DOCS_PLAYGROUND_GUIDE}
          quickStartUrl={DOCS_QUICK_START}
        />
      );
    },
  };
});

/**
 * Placeholder of the playground while it loads, and in the server render.
 * @returns The placeholder.
 */
function Loading(): ReactNode {
  return (
    <div
      className={styles.loading}
      aria-busy="true"
      data-testid={PLAYGROUND_PAGE_LOADING_TEST_ID}
    >
      Loading the playground…
    </div>
  );
}

/**
 * The playground, on wide screens only: on narrow ones its chunk is never requested, and the note of the page shows instead.
 * @returns The playground, or nothing on narrow screens.
 */
function Stage(): ReactNode {
  const isNarrow = useMediaQuery(NARROW_QUERY);

  if (isNarrow) {
    return null;
  }

  // The fallback is outside the stage, so that it renders as the loading box of the server render
  return (
    <Suspense fallback={<Loading />}>
      <div className={styles.stage}>
        <LazyPlayground />
      </div>
    </Suspense>
  );
}

/**
 * Page of the playground: it has no visible header, because the navbar's active item is its title, and it fills the page below the navbar on wide screens. The heading, the note and the loading box are in the server render, and the playground loads in the browser.
 * @returns The page.
 */
export default function PlaygroundPage(): ReactNode {
  return (
    <Layout
      title="Playground"
      description={LEAD}
      wrapperClassName={styles.wrapper}
    >
      <main>
        {/* The heading is for screen readers and the outline: the playground has no title of its own */}
        <Heading as="h1" className={styles.hidden}>
          Playground
        </Heading>
        {/* Both are in the server render, and CSS shows the one that fits the screen, so nothing moves when the page loads */}
        <p className={styles.note} data-testid={PLAYGROUND_PAGE_NOTE_TEST_ID}>
          The playground needs a wider screen. Open this page on a desktop
          browser to use it.
        </p>
        <BrowserOnly fallback={<Loading />}>{() => <Stage />}</BrowserOnly>
      </main>
    </Layout>
  );
}
