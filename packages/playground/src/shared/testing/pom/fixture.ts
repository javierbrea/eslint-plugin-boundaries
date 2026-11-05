import { Pom } from "./pom";
import type { FixtureOptions } from "./pom.types";

/**
 * The page object of the probe markup that a spec renders around the code under test, such as a component that reads a hook. It has no component to take a default test id from, so it requires the `testId` option.
 */
export class FixturePom extends Pom {
  protected readonly defaultTestId = "";

  /**
   * Creates the page object of a probe.
   * @param options Select the probe's root element; `testId` is required.
   */
  constructor(options: FixtureOptions) {
    super(options);
  }
}
