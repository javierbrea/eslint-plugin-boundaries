import type { ByRoleMatcher } from "@testing-library/react";

import { Pom } from "./pom";
import type { FixtureOptions } from "./pom.types";

/**
 * The page object of the probe markup that a spec renders around the code under test, such as a component that reads a hook. It has no component to take a default test id from, so it requires the `testId` option. Its getters read whatever the probe holds, so a spec mounts the code under test inside the probe to assert on all of its output.
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

  /**
   * Whether a text is among the content of the probe, at any depth.
   * @param text The text of an element, or a pattern it matches.
   * @returns True when an element with that text is inside the probe.
   */
  holds(text: string | RegExp): boolean {
    return this.scope.queryByText(text) !== null;
  }

  /**
   * How many elements of an ARIA role the probe holds, at any depth, whether the role is explicit or implicit.
   * @param role The role, such as `separator`.
   * @returns The number of elements with that role inside the probe.
   */
  countByRole(role: ByRoleMatcher): number {
    return this.scope.queryAllByRole(role).length;
  }
}
