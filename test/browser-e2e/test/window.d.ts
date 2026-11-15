import type { runScenario } from "../src/scenarios/index.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- Declaration merging needs an interface
  interface Window {
    // Assigned by the browser bundle of the scenarios that the static page loads
    scenarios: { runScenario: typeof runScenario };
  }
}
