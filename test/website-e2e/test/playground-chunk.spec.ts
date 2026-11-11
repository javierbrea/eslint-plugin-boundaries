import { expect, PLAYGROUND_CHUNK_MARKER, test } from "./fixtures";

const PLAYGROUND_PATH = "/playground/";

test.describe("the chunk of the playground", () => {
  test(
    "a narrow screen shows the desktop-only note and never requests the chunk",
    { tag: "@narrow" },
    async ({ page, playgroundPage, scripts, startedWorkers }) => {
      await page.goto(PLAYGROUND_PATH);

      await playgroundPage.waitForNote();
      // The loading box leaves once the browser has rendered the page, which on a narrow screen renders no playground. The chunk is requested when the playground renders, so a chunk that arrives is already requested by now
      await playgroundPage.waitUntilLoadingBoxGone();

      expect(await scripts.urlsHolding(PLAYGROUND_CHUNK_MARKER)).toEqual([]);
      expect(startedWorkers.all).toEqual([]);
      expect(await playgroundPage.playground.isRendered).toBe(false);
      expect(await playgroundPage.noteText).toContain("needs a wider screen");
    }
  );

  // The control of the test above: the same detection finds the chunk where the playground renders, so that the narrow assertion can fail
  test(
    "a desktop screen requests the chunk, which holds the marker the narrow test looks for",
    { tag: "@desktop" },
    async ({ page, playgroundPage, scripts, startedWorkers }) => {
      await page.goto(PLAYGROUND_PATH);

      await playgroundPage.playground.waitUntilLoaded();
      // The worker starts after the shell renders, and the runner hears about it a moment later. The verdicts come from the worker, so once they arrive it has started and the runner has heard of it
      await playgroundPage.playground.topBar.bar.waitUntilEvaluated();

      expect(await playgroundPage.isNoteVisible).toBe(false);
      expect(await scripts.urlsHolding(PLAYGROUND_CHUNK_MARKER)).toHaveLength(
        1
      );
      expect(startedWorkers.startedOn(PLAYGROUND_PATH)).toHaveLength(1);
    }
  );
});
