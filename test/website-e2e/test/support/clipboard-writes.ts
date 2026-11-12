import type { BrowserContext } from "@playwright/test";

/** The name of the function that the pages of the context call to hand over a text to the runner. It is not on `window` before the context exposes it. */
const KEEP_FUNCTION = "keepClipboardWrite";

/**
 * The texts that the pages of a browser context write to the clipboard, which the runner keeps in place of the system clipboard: the pages of the test run in a browser that has no clipboard to read, so a spec cannot paste. It replaces `navigator.clipboard.writeText` before any script of a page runs, in every page of the context, the ones a spec opens included, and the replacement resolves as the real one does when the browser accepts the text.
 */
export class ClipboardWrites {
  private readonly written: string[] = [];

  private constructor() {
    // Built by `install`, which needs the context to be ready first
  }

  /**
   * Starts keeping what the pages write to the clipboard. It must run before a page of the context visits the page that writes.
   * @param context The browser context of the test.
   * @returns A promise of the record.
   */
  static async install(context: BrowserContext): Promise<ClipboardWrites> {
    const clipboardWrites = new ClipboardWrites();

    await context.exposeFunction(KEEP_FUNCTION, (text: string) => {
      clipboardWrites.written.push(text);
    });
    await context.addInitScript((keepFunction: string) => {
      // The function is read when the page writes, not when this script runs, since it is the context that exposes it
      navigator.clipboard.writeText = (text: string): Promise<void> => {
        (globalThis as unknown as Record<string, (text: string) => void>)[
          keepFunction
        ](text);
        return Promise.resolve();
      };
    }, KEEP_FUNCTION);

    return clipboardWrites;
  }

  /**
   * Every text written to the clipboard so far.
   * @returns The texts, in the order they were written.
   */
  get texts(): string[] {
    return [...this.written];
  }
}
