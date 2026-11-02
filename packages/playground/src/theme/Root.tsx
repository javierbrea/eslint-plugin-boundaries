import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import { ThemeProvider } from "@mui/material/styles";
import { useId, useState } from "react";
import type { ReactNode } from "react";

import { CACHE_KEY, ROOT_CLASS, createPlaygroundTheme } from "./Theme";

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
  const [cache] = useState(() => createCache({ key: CACHE_KEY }));
  // MUI calls the getter when an overlay opens, after the root element is in the document
  const [theme] = useState(() =>
    createPlaygroundTheme(() => document.getElementById(rootId))
  );

  return (
    <CacheProvider value={cache}>
      {/* Without a color scheme node, MUI would set the host's data-theme attribute on <html>; without a storage manager, it would write its mode to localStorage */}
      <ThemeProvider theme={theme} colorSchemeNode={null} storageManager={null}>
        <div id={rootId} className={ROOT_CLASS}>
          {children}
        </div>
      </ThemeProvider>
    </CacheProvider>
  );
}
