import { CONFIG_SCENARIOS } from "./config.js";
import { ELEMENTS_SCENARIOS } from "./elements.js";

/**
 * @typedef {object} Scenario
 * @property {string} name The unique name of the scenario, which is the title of its test.
 * @property {() => unknown} run Calls the packages and returns what they return. It never reads the environment, so it returns the same result in Node.js and in every browser.
 */

/**
 * Every scenario, run in Node.js and in each browser.
 * @type {Scenario[]}
 */
export const SCENARIOS = [...ELEMENTS_SCENARIOS, ...CONFIG_SCENARIOS];

/**
 * Runs a scenario.
 * @param {string} name The name of the scenario.
 * @returns {unknown} The result of the scenario, converted to plain JSON values, so the results of Node.js and of the browsers can be compared.
 */
export function runScenario(name) {
  const scenario = SCENARIOS.find((candidate) => candidate.name === name);
  if (!scenario) {
    throw new Error(`There is no scenario named "${name}"`);
  }
  return JSON.parse(JSON.stringify(scenario.run()));
}
