import { StrictMode, useState } from "react";
import type { ReactNode } from "react";
import { createRoot } from "react-dom/client";

import "../../website/src/css/tokens.css";
import "../../website/src/css/fonts.css";
import "./harness.css";
import {
  HashStore,
  Playground,
  QUICK_START_EXAMPLE,
  SketchSource,
} from "../src";

const source = new SketchSource(QUICK_START_EXAMPLE.sketch);
// The hash of the URL keeps the sketch, as on the website, so Share and Reset work. The harness has no Quick start page, so it passes no `quickStartUrl` and the help draws no link
const store = new HashStore();

/**
 * Host page of the harness: a bar that toggles the theme as the website does, and the playground below it, with the Quick start example.
 * @returns The page.
 */
function Harness(): ReactNode {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", next);
    setTheme(next);
  };

  return (
    <>
      <div className="harness-bar">
        <button type="button" onClick={toggleTheme}>
          {theme === "light" ? "Dark theme" : "Light theme"}
        </button>
      </div>
      {/* The playground fills its container, so the stage takes the viewport below the bar */}
      <div className="harness-stage">
        <Playground source={source} store={store} />
      </div>
    </>
  );
}

createRoot(document.getElementById("harness") as HTMLElement).render(
  <StrictMode>
    <Harness />
  </StrictMode>
);
