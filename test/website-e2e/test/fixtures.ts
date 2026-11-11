import { test as base, expect } from "@playwright/test";
import type { BrowserContext } from "@playwright/test";
import {
  DocItemPom,
  DocSidebarPom,
  NavbarPom,
  NotFoundContentPom,
  PlaygroundPagePom,
  RootPom,
} from "website/playwright";

import { ClipboardWrites } from "./support/clipboard-writes";
import { DocumentLoads } from "./support/document-loads";
import { NOT_FOUND_PATH, PageErrors } from "./support/page-errors";
import {
  PLAYGROUND_CHUNK_MARKER,
  ScriptResponses,
} from "./support/script-responses";
import { StartedWorkers } from "./support/started-workers";

/** Opens a URL in a page of its own and gives the page object of the page at `/playground/`. */
type OpenPlayground = (url: string) => Promise<PlaygroundPagePom>;

type Fixtures = {
  /** Fails the test when a page logs an error to the console or throws one. It runs in every test. */
  pageErrors: PageErrors;
  /** The texts that the pages write to the clipboard, which the runner keeps in place of the system clipboard. */
  clipboardWrites: ClipboardWrites;
  /** The documents that the pages load, which tell a client-side navigation from a page load. */
  documentLoads: DocumentLoads;
  /** The article of a docs page, with its title and its Open in playground button. */
  docItem: DocItemPom;
  /** The docs sidebar of a docs page on a wide screen. */
  docSidebar: DocSidebarPom;
  /** The navbar of a page on a wide screen. */
  navbar: NavbarPom;
  /** The content of the 404 page. */
  notFoundContent: NotFoundContentPom;
  /** Opens a URL in a new tab of the browser context of the test, which shares its storage with the tabs the test already has, and waits for nothing: the caller waits for the playground. */
  openPlaygroundTab: OpenPlayground;
  /** Opens a URL in a browser context of its own, which has no storage of the other contexts, as a person who gets a link does, and waits for nothing: the caller waits for the playground. The viewport is that of the project. */
  openPlaygroundInFreshContext: OpenPlayground;
  /** The page object of the page at `/playground/`. */
  playgroundPage: PlaygroundPagePom;
  /** The document of a page, which says whether the browser has hydrated it. */
  site: RootPom;
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
  clipboardWrites: async ({ context }, use) => {
    await use(await ClipboardWrites.install(context));
  },
  documentLoads: async ({ context }, use) => {
    await use(new DocumentLoads(context));
  },
  docItem: async ({ page }, use) => {
    await use(new DocItemPom({ page }));
  },
  docSidebar: async ({ page }, use) => {
    await use(new DocSidebarPom({ page }));
  },
  navbar: async ({ page }, use) => {
    await use(new NavbarPom({ page }));
  },
  notFoundContent: async ({ page }, use) => {
    await use(new NotFoundContentPom({ page }));
  },
  openPlaygroundTab: async ({ context }, use) => {
    await use(async (url) => {
      const tab = await context.newPage();

      await tab.goto(url);

      return new PlaygroundPagePom({ page: tab });
    });
  },
  openPlaygroundInFreshContext: async ({ baseURL, browser, viewport }, use) => {
    const opened: { context: BrowserContext; pageErrors: PageErrors }[] = [];

    await use(async (url) => {
      const context = await browser.newContext({ baseURL, viewport });

      // The context is not the one of the test, so the fixture that fails the test on an error does not hear it
      opened.push({ context, pageErrors: new PageErrors(context) });

      const tab = await context.newPage();

      await tab.goto(url);

      return new PlaygroundPagePom({ page: tab });
    });

    for (const { context, pageErrors } of opened) {
      await context.close();
      expect(
        pageErrors.unexpected,
        "The pages of a fresh context logged errors to the console or threw them"
      ).toEqual([]);
    }
  },
  playgroundPage: async ({ page }, use) => {
    await use(new PlaygroundPagePom({ page }));
  },
  scripts: async ({ context }, use) => {
    await use(new ScriptResponses(context));
  },
  site: async ({ page }, use) => {
    await use(new RootPom({ page }));
  },
  startedWorkers: async ({ context }, use) => {
    await use(new StartedWorkers(context));
  },
});

export { expect, NOT_FOUND_PATH, PLAYGROUND_CHUNK_MARKER };
