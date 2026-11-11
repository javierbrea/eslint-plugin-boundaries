import { expect, test } from "./fixtures";
import {
  parseStatus,
  pickAnotherExample,
  PROJECT_HASH,
  QUICK_START,
  readProject,
  waitUntilProjectShown,
} from "./support/playground";

const PLAYGROUND_PATH = "/playground/";
const PLAYGROUND_GUIDE_PATH = "/docs/guides/playground/";

test.describe("the playground page", () => {
  test(
    "a visit with no hash loads the Quick start example, which the tree, the problems and the status describe",
    { tag: "@desktop" },
    async ({ page, playgroundPage }) => {
      const { playground } = playgroundPage;

      await page.goto(PLAYGROUND_PATH);
      await waitUntilProjectShown(playground);

      const counts = parseStatus(await playground.statusText);

      expect(await playground.topBar.picker.text).toBe(
        `Example ${QUICK_START}`
      );
      expect(counts.files).toBeGreaterThan(0);
      expect(await playground.project.tree.filePaths).toHaveLength(
        counts.files
      );
      // The project count is the sum of the problems of the evaluation, which is the number that the top bar says
      await expect
        .poll(() => playground.shell.problems.tab(/^Project/).badge.count)
        .toBe(String(counts.problems));
    }
  );

  test(
    "a file opened from the tree is what the node pane and the inspector describe",
    { tag: "@desktop" },
    async ({ page, playgroundPage }) => {
      const { playground } = playgroundPage;

      await page.goto(PLAYGROUND_PATH);
      await waitUntilProjectShown(playground);

      const [first, second] = await playground.project.tree.filePaths;

      expect(first).toBeDefined();
      expect(second).toBeDefined();
      expect(second).not.toBe(first);

      for (const path of [first, second]) {
        await playground.project.click(path);

        await expect.poll(() => playground.shell.node.shown).toBe("file");
        await expect
          .poll(() => playground.shell.node.file.head.path)
          .toBe(path);
        await expect
          .poll(() => playground.shell.inspector.file.section("from").summary)
          .toBe(path);
      }
    }
  );

  test(
    "the example picker loads another example and changes the hash of the URL",
    { tag: "@desktop" },
    async ({ page, playgroundPage }) => {
      const { playground } = playgroundPage;

      await page.goto(PLAYGROUND_PATH);
      await waitUntilProjectShown(playground);

      const quickStart = await playground.statusText;
      const files = await playground.project.tree.filePaths;
      const hash = new URL(page.url()).hash;

      const title = await pickAnotherExample(playground);

      expect(await playground.topBar.picker.text).toBe(`Example ${title}`);
      expect(await playground.project.tree.filePaths).not.toEqual(files);
      expect(await playground.statusText).not.toBe(quickStart);
      // The store writes the project to the hash a moment after the last change
      await expect.poll(() => new URL(page.url()).hash).toMatch(PROJECT_HASH);
      expect(new URL(page.url()).hash).not.toBe(hash);
    }
  );

  test(
    "Help opens with a link to the playground guide and closes",
    { tag: "@desktop" },
    async ({ page, playgroundPage }) => {
      const { help, actions } = playgroundPage.playground.topBar;

      await page.goto(PLAYGROUND_PATH);
      await playgroundPage.playground.waitUntilLoaded();
      expect(await help.isRendered).toBe(false);

      await actions.pressHelp();

      await expect.poll(() => help.isRendered).toBe(true);
      expect(await help.playgroundGuideLink.href).toBe(PLAYGROUND_GUIDE_PATH);

      await help.close();
      await help.waitUntilGone();
    }
  );

  test(
    "the guide link of Help reaches the playground guide",
    { tag: "@desktop" },
    async ({ page, playgroundPage, docItem }) => {
      const { help, actions } = playgroundPage.playground.topBar;

      await page.goto(PLAYGROUND_PATH);
      await playgroundPage.playground.waitUntilLoaded();
      await actions.pressHelp();
      await expect.poll(() => help.isRendered).toBe(true);

      await help.playgroundGuideLink.follow();

      await expect(page).toHaveURL(PLAYGROUND_GUIDE_PATH);
      await expect.poll(() => docItem.title).toBe("Playground");
    }
  );

  test(
    "Reset brings back the Quick start after another example was picked",
    { tag: "@desktop" },
    async ({ page, playgroundPage }) => {
      const { playground } = playgroundPage;

      await page.goto(PLAYGROUND_PATH);
      await waitUntilProjectShown(playground);

      const quickStart = await readProject(playground);
      const quickStartStatus = await playground.statusText;
      await pickAnotherExample(playground);
      expect(await playground.statusText).not.toBe(quickStartStatus);

      await playground.topBar.actions.pressReset();

      // An example that nobody edited is replaced at once, with no confirmation
      await expect
        .poll(() => playground.topBar.picker.text)
        .toBe(`Example ${QUICK_START}`);
      await playground.topBar.bar.waitUntilEvaluated();
      expect(await playground.statusText).toBe(quickStartStatus);
      expect(await readProject(playground)).toEqual(quickStart);
    }
  );

  test(
    "a reload keeps the project on screen",
    { tag: "@desktop" },
    async ({ page, playgroundPage }) => {
      const { playground } = playgroundPage;

      await page.goto(PLAYGROUND_PATH);
      await waitUntilProjectShown(playground);
      const title = await pickAnotherExample(playground);
      const project = await readProject(playground);
      // A reload that comes before the store writes the project to the hash would load the default example
      await expect.poll(() => new URL(page.url()).hash).toMatch(PROJECT_HASH);

      await page.reload();
      await waitUntilProjectShown(playground);

      expect(await playground.topBar.picker.text).toBe(`Example ${title}`);
      expect(await readProject(playground)).toEqual(project);
    }
  );
});
