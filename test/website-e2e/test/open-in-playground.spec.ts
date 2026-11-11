import { expect, test } from "./fixtures";
import {
  pickAnotherExample,
  PROJECT_HASH,
  readProject,
  waitForOpenLink,
  waitUntilProjectShown,
} from "./support/playground";

const PLAYGROUND_PATH = "/playground/";
const QUICK_START_PATH = "/docs/quick-start/";

// The playground opens with the Quick start example, which may be the very project of the button of the Quick start guide, and a link that the playground ignored would still show it. So each test first leaves another example on screen, which the store of the page keeps as the last project: a link that the playground ignored, or that lost against the store, shows that example instead
test.describe("the Open in playground button of the Quick start guide", () => {
  test(
    "opens its project after a client-side navigation, not the example that the playground showed before",
    { tag: "@desktop" },
    async ({
      page,
      playgroundPage,
      navbar,
      docSidebar,
      docItem,
      documentLoads,
      openPlaygroundTab,
    }) => {
      const { playground } = playgroundPage;
      await page.goto(PLAYGROUND_PATH);
      await waitUntilProjectShown(playground);
      await pickAnotherExample(playground);
      const remembered = await readProject(playground);
      // The store writes the project to the hash a moment after the last change. Leaving before that is not what this test is about, and the write would then come while the playground opens again
      await expect.poll(() => new URL(page.url()).hash).toMatch(PROJECT_HASH);

      await navbar.link("Getting Started").follow();
      await docSidebar.link("Quick Start").follow();
      await expect.poll(() => docItem.title).toBe("Quick Start");
      const link = await waitForOpenLink(docItem);
      await docItem.openInPlayground.follow();

      await expect(page).toHaveURL(/\/playground\/#v=1&s=/);
      await waitUntilProjectShown(playground);
      const opened = await readProject(playground);
      // Only the first page was loaded as a document: the rest were moves of the router of the site, which keep the store of the page and what it remembers
      expect(documentLoads.paths).toEqual([PLAYGROUND_PATH]);
      expect(opened).not.toEqual(remembered);
      // What a visitor sees who opens the link in a new tab
      const visit = await openPlaygroundTab(link);
      await waitUntilProjectShown(visit.playground);
      expect(opened).toEqual(await readProject(visit.playground));
    }
  );

  test(
    "opens the same project when its link is visited in the address bar of the open playground, not the example on screen",
    { tag: "@desktop" },
    async ({
      page,
      playgroundPage,
      docItem,
      documentLoads,
      openPlaygroundTab,
    }) => {
      const { playground } = playgroundPage;
      await page.goto(QUICK_START_PATH);
      await expect.poll(() => docItem.title).toBe("Quick Start");
      const link = await waitForOpenLink(docItem);
      // What a visitor sees who opens the link in a new tab
      const visit = await openPlaygroundTab(link);
      await waitUntilProjectShown(visit.playground);
      const expected = await readProject(visit.playground);
      const expectedExample = await visit.playground.topBar.picker.text;
      const expectedStatus = await visit.playground.statusText;
      await page.goto(PLAYGROUND_PATH);
      await waitUntilProjectShown(playground);
      await pickAnotherExample(playground);
      const remembered = await readProject(playground);
      expect(remembered).not.toEqual(expected);
      // A write that is still pending when the link arrives would put the example back in the URL
      await expect.poll(() => new URL(page.url()).hash).toMatch(PROJECT_HASH);

      const documentsBefore = documentLoads.paths;

      // The URL differs from the one of the page only in its hash, so the browser loads no document: the open playground hears the change while its store still holds the example
      await page.goto(link);

      // A document that the browser loaded would be a new playground with an empty store, which shows the link whatever the open one does with it
      expect(documentLoads.paths).toEqual(documentsBefore);
      await expect
        .poll(() => playground.topBar.picker.text)
        .toBe(expectedExample);
      await expect.poll(() => playground.statusText).toBe(expectedStatus);
      expect(await readProject(playground)).toEqual(expected);
    }
  );
});
