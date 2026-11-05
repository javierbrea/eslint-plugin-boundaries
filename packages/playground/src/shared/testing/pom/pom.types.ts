import type { BoundFunctions, queries } from "@testing-library/react";

import type { Pom } from "./pom";

/** The Testing Library queries bound to an element, or to the document. */
export type PomQueries = BoundFunctions<typeof queries>;

/** Options of a page object. They select the root element of the component; every one is optional. */
export type PomOptions = {
  /** The root element itself. It wins over every other option. */
  readonly root?: HTMLElement;
  /** The page object whose root is searched. It is how a child scopes itself to its parent; {@link Pom.childPom} sets it. */
  readonly parent?: Pom;
  /** The test id of the root element, in place of the default one of the component. */
  readonly testId?: string;
  /** The accessible name of the root element, for a page object that resolves it by role. */
  readonly name?: string | RegExp;
  /** The position of the root element among those that match, starting at 0. It is 0 by default. */
  readonly index?: number;
  /** Keeps only the matches whose text includes it, such as a row with a given label. */
  readonly containing?: string;
  /** Searches the whole document, for an element that renders outside its parent's root, such as a dialog. */
  readonly portal?: boolean;
};

/** Options of {@link FixturePom}, which needs the test id of its probe markup. */
export type FixtureOptions = PomOptions & { readonly testId: string };
