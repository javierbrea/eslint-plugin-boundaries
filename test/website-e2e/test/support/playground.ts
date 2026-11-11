import type { PlaygroundPom } from "@boundaries/playground/playwright";
import { expect } from "@playwright/test";
import type { DocItemPom } from "website/playwright";

/** The project of the playground as the user sees it: the files of the tree and the whole text of the config. */
export type ProjectOnScreen = {
  /** The path of every file of the tree, in the order it draws them. */
  readonly files: string[];
  /** The text of the config, which the editor of the config node shows. */
  readonly config: string;
};

/** The name of the example that the playground opens when its URL has no hash. */
export const QUICK_START = "Quick start";

/** What the hash of the URL looks like once the playground has written a project to it: its version, and the packed project. */
export const PROJECT_HASH = /^#v=1&s=.{20,}/;

/** What the link of an Open in playground button looks like: the path of the playground, and the hash that holds the project. */
const OPEN_LINK_PATTERN = /^\/playground\/#v=1&s=.{20,}/;

/**
 * Waits for the playground to show a project whose evaluation has arrived. It is for a playground that has just mounted, such as one that a visit or a client-side navigation opened.
 * @param playground The playground of the page.
 * @returns A promise that settles when the status of the top bar counts the problems.
 */
export async function waitUntilProjectShown(
  playground: PlaygroundPom
): Promise<void> {
  await playground.waitUntilLoaded();
  await playground.topBar.bar.waitUntilEvaluated();
}

/**
 * Reads the project on screen, once the playground has evaluated it. It opens the config in the node pane, so the pane shows the config afterwards.
 * @param playground The playground, loaded and evaluated.
 * @returns The files of the tree and the whole text of the config.
 */
export async function readProject(
  playground: PlaygroundPom
): Promise<ProjectOnScreen> {
  await playground.project.click("eslint.config.js");
  await expect
    .poll(() => playground.shell.node.shown, {
      message: "The config is not open in the node pane yet",
    })
    .toBe("config");

  return {
    files: await playground.project.tree.filePaths,
    config: await playground.shell.node.config.editor.text,
  };
}

/**
 * Picks the first example of the picker that is not the Quick start, and waits for the playground to show it evaluated.
 * @param playground The playground, loaded and evaluated.
 * @returns The name of the example it picked.
 */
export async function pickAnotherExample(
  playground: PlaygroundPom
): Promise<string> {
  const { picker } = playground.topBar;

  await picker.open();
  await expect
    .poll(() => picker.titles, { message: "The list of examples is empty" })
    .not.toEqual([]);

  const title = (await picker.titles).find((name) => name !== QUICK_START);

  if (title === undefined) {
    throw new Error("The picker has no example besides the Quick start");
  }

  await picker.pick(title);
  await picker.waitUntilClosed();
  // The example mounts a new shell: until the picker names it, the status is still the one of the old project, which `waitUntilEvaluated` would take for the new one
  await expect
    .poll(() => picker.title, {
      message: `${title} is not the current example`,
    })
    .toBe(title);
  await playground.topBar.bar.waitUntilEvaluated();

  return title;
}

/**
 * Waits for the docs page to show an Open in playground button, and reads where it leads.
 * @param docItem The docs page.
 * @returns The link of the button: the path of the playground with the hash of its project.
 */
export async function waitForOpenLink(docItem: DocItemPom): Promise<string> {
  await expect
    .poll(() => docItem.openInPlayground.href, {
      message: "The page has no Open in playground button with a link",
    })
    .toMatch(OPEN_LINK_PATTERN);

  return (await docItem.openInPlayground.href) ?? "";
}
