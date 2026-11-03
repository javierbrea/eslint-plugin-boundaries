import createCache from "@emotion/cache";
import type { EmotionCache } from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import { ThemeProvider } from "@mui/material/styles";
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

/** Props of {@link Root}. */
type RootProps = {
  /** Content of the playground. */
  children: ReactNode;
};

/**
 * Root element of the playground, which scopes the MUI theme and the Emotion styles to it. The host keeps its own theme: the root follows its `data-theme` attribute and never changes it.
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
        <div id={rootId} className={ROOT_CLASS}>
          {children}
        </div>
      </ThemeProvider>
    </CacheProvider>
  );
}
