import type { runScenario } from "../src/scenarios/index.js";

declare global {
  interface Window {
    // Assigned by the browser bundle of the scenarios that the static page loads
    scenarios: { runScenario: typeof runScenario };
  }
}
