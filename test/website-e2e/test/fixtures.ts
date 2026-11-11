import { test as base, expect } from "@playwright/test";
import { PlaygroundPagePom } from "website/playwright";

import { NOT_FOUND_PATH, PageErrors } from "./support/page-errors";
import {
  PLAYGROUND_CHUNK_MARKER,
  ScriptResponses,
} from "./support/script-responses";
import { StartedWorkers } from "./support/started-workers";

type Fixtures = {
  /** Fails the test when a page logs an error to the console or throws one. It runs in every test. */
  pageErrors: PageErrors;
  /** The page object of the page at `/playground/`. */
  playgroundPage: PlaygroundPagePom;
  /** The scripts that the pages request, to tell whether one of them holds a text. */
  scripts: ScriptResponses;
  /** The web workers that the pages start. */
  startedWorkers: StartedWorkers;
};

/** The `test` of the suite: the one of Playwright, with the page objects of the site and the records of what its pages do. A spec imports it from here, never from `@playwright/test`. */
export const test = base.extend<Fixtures>({
  pageErrors: [
    async ({ context }, use) => {
      const pageErrors = new PageErrors(context);

      await use(pageErrors);

      expect(
        pageErrors.unexpected,
        "The pages logged errors to the console or threw them"
      ).toEqual([]);
    },
    { auto: true },
  ],
  playgroundPage: async ({ page }, use) => {
    await use(new PlaygroundPagePom({ page }));
  },
  scripts: async ({ context }, use) => {
    await use(new ScriptResponses(context));
  },
  startedWorkers: async ({ context }, use) => {
    await use(new StartedWorkers(context));
  },
});

export { expect, NOT_FOUND_PATH, PLAYGROUND_CHUNK_MARKER };
