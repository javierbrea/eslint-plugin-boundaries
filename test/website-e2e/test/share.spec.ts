import { expect, test } from "./fixtures";
import {
  pickAnotherExample,
  readProject,
  waitUntilProjectShown,
} from "./support/playground";

const PLAYGROUND_PATH = "/playground/";

test.describe("sharing the playground", () => {
  test(
    "Share copies a link that opens the same project, with its config, in a browser that has none of its storage",
    { tag: "@desktop" },
    async ({
      page,
      playgroundPage,
      clipboardWrites,
      openPlaygroundInFreshContext,
    }) => {
      const { playground } = playgroundPage;
      await page.goto(PLAYGROUND_PATH);
      await waitUntilProjectShown(playground);
      const quickStart = await readProject(playground);
      // Another example than the one that opens with no hash, so that a link that the playground ignored would show a different project
      const title = await pickAnotherExample(playground);
      const shared = await readProject(playground);
      expect(shared).not.toEqual(quickStart);
      expect(clipboardWrites.texts).toEqual([]);

      await playground.topBar.actions.pressShare();

      await expect
        .poll(() => playground.topBar.actions.share.visibleText)
        .toBe("Copied");
      expect(clipboardWrites.texts).toHaveLength(1);
      const [link] = clipboardWrites.texts;
      expect(link).toMatch(/\/playground\/#v=1&s=.{20,}$/);

      const received = await openPlaygroundInFreshContext(link);
      await waitUntilProjectShown(received.playground);

      expect(await received.playground.topBar.picker.title).toBe(title);
      expect(await readProject(received.playground)).toEqual(shared);
    }
  );
});
