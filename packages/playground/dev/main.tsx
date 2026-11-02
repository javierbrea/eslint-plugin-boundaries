import { StrictMode, useState } from "react";
import type { ReactNode } from "react";
import { createRoot } from "react-dom/client";

import "../../website/src/css/tokens.css";
import "../../website/src/css/fonts.css";
import "./harness.css";
import { MemoryStore, Playground, SketchSource } from "../src";
import type { Sketch } from "../src";

const SKETCH: Sketch = {
  config: `{
  settings: {
    "boundaries/elements": [
      { type: "component", pattern: "src/components/*" },
      { type: "helper", pattern: "src/helpers/*" },
    ],
  },
  rules: {
    "boundaries/dependencies": [2, { default: "allow" }],
  },
}
`,
  tree: [
    { path: "src/components/Button/index.ts", kind: "file" },
    { path: "src/components/Price/index.ts", kind: "file" },
    { path: "src/helpers/format/index.ts", kind: "file" },
  ],
  dependencies: [
    {
      from: "src/components/Price/index.ts",
      target: { kind: "node", path: "src/helpers/format/index.ts" },
      syntax: "import",
      importKind: "value",
      specifiers: [{ kind: "named", name: "format" }],
    },
  ],
};

const source = new SketchSource(SKETCH);
const store = new MemoryStore();

/**
 * Host page of the harness: a bar that toggles the theme as the website does, and the playground.
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
      <Playground source={source} store={store} />
    </>
  );
}

createRoot(document.getElementById("harness") as HTMLElement).render(
  <StrictMode>
    <Harness />
  </StrictMode>
);
