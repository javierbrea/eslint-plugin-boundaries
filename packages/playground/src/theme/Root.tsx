import createCache from "@emotion/cache";
import type { EmotionCache } from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import { ThemeProvider, styled } from "@mui/material/styles";
import { useId, useState } from "react";
import type { ReactNode } from "react";

import { CACHE_KEY, ROOT_CLASS, createPlaygroundTheme } from "./Theme";

/** The Emotion cache of every mount of the playground, created on first use: a new cache per mount would insert every rule again */
let sharedCache: EmotionCache | undefined;

/**
 * Returns the Emotion cache of the playground, and creates it the first time.
 * @returns The cache.
 */
function getCache(): EmotionCache {
  sharedCache ??= createCache({ key: CACHE_KEY });
  return sharedCache;
}

// The base of the playground: the card, the ink and the body text of the theme. Dialogs, menus and tooltips render inside this element and not inside the workbench, so they take their text from it: without it, a dialog's text takes the 16 px of the host
const Base = styled("div")(({ theme }) => ({
  boxSizing: "border-box",
  height: "100%",
  backgroundColor: "var(--jsb-card)",
  color: "var(--jsb-ink)",
  ...theme.typography.body1,
}));

/** Props of {@link Root}. */
type RootProps = {
  /** Content of the playground. */
  children: ReactNode;
};

/**
 * Root element of the playground, which scopes the MUI theme and the Emotion styles to it, and gives the playground its base: the card background, the ink color and the 13 px body font. It is as tall as its container, which the host sizes. The host keeps its own theme: the root follows its `data-theme` attribute and never changes it.
 * @param props Root props.
 * @param props.children Content of the playground.
 * @returns The root element.
 */
export function Root({ children }: Readonly<RootProps>): ReactNode {
  const rootId = useId();
  const [cache] = useState(getCache);
  // MUI calls the getter when an overlay opens, after the root element is in the document
  const [theme] = useState(() =>
    createPlaygroundTheme(() => document.getElementById(rootId))
  );

  return (
    <CacheProvider value={cache}>
      {/* Without a color scheme node, MUI would set its own data-theme on <html>; without a storage manager, it would read and follow the mode saved in localStorage */}
      <ThemeProvider theme={theme} colorSchemeNode={null} storageManager={null}>
        <Base id={rootId} className={ROOT_CLASS}>
          {children}
        </Base>
      </ThemeProvider>
    </CacheProvider>
  );
}
