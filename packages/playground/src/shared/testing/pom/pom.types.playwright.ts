import type { Locator, Page } from "@playwright/test";

import type { Pom } from "./pom.playwright";

/** What a page object searches its root in: the page, or the root of its parent. Both answer the same queries. */
export type PomSearchBase = Page | Locator;

/** Options of a Playwright page object. They are those of the jsdom page object, with a `Locator` in place of an element, and the `page` the browser drives. Only `page` is required. */
export type PomOptions = {
  /** The page the component is in. A child gets the one of its parent from {@link Pom.childPom}. */
  readonly page: Page;
  /** The root locator itself. It wins over every other option. */
  readonly root?: Locator;
  /** The page object whose root is searched. It is how a child scopes itself to its parent; {@link Pom.childPom} sets it. */
  readonly parent?: Pom;
  /** The test id of the root element, in place of the default one of the component. It is the `data-testid` attribute. */
  readonly testId?: string;
  /** The accessible name of the root element, or its visible text for a page object whose TSDoc says so. */
  readonly name?: string | RegExp;
  /** The position of the root element among those that match, starting at 0. It is 0 by default. */
  readonly index?: number;
  /** Keeps only the matches whose text includes it, with the case it has, such as a row with a given label. */
  readonly containing?: string;
  /** Searches the whole page, for an element that renders outside its parent's root, such as a dialog. */
  readonly portal?: boolean;
};

/** Options of a child page object, which takes its page from its parent and its parent from {@link Pom.childPom}. */
export type PomChildOptions = Omit<PomOptions, "page" | "parent">;
