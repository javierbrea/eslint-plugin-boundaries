import type { BrowserContext } from "@playwright/test";

/**
 * A string that only the chunk of the playground holds: the class of its root element, `ROOT_CLASS` in `packages/playground/src/ui-kit/helpers/theme/theme.constants.ts`. On the production build of the site, no other script of `/`, of a docs page or of `/playground/` holds it. If the playground renames it, the specs that look for the chunk on a wide screen fail, since they no longer find it.
 */
export const PLAYGROUND_CHUNK_MARKER = "jsb-play-root";

type ScriptRead =
  | { readonly url: string; readonly body: string }
  | { readonly url: string; readonly error: unknown };

/**
 * The scripts that the pages of a browser context request, which tell whether a page loaded a chunk without knowing how the site names it. It listens to every page of the context from the moment it is built, so a spec builds it before it visits a page.
 */
export class ScriptResponses {
  private readonly reads: Promise<ScriptRead>[] = [];

  /**
   * Starts listening.
   * @param context The browser context of the test.
   */
  constructor(context: BrowserContext) {
    context.on("response", (response) => {
      if (response.request().resourceType() === "script") {
        this.reads.push(
          response.text().then(
            (body): ScriptRead => ({ url: response.url(), body }),
            (error: unknown): ScriptRead => ({ url: response.url(), error })
          )
        );
      }
    });
  }

  /**
   * Reads the scripts that the pages requested so far, waiting for each body to arrive.
   * @returns The URL and the body of every script.
   * @throws When a body cannot be read, since "no script holds the text" would then be true for nothing.
   */
  private async bodies(): Promise<{ url: string; body: string }[]> {
    const reads = await Promise.all(this.reads);
    const unread = reads.filter((read) => "error" in read);

    if (unread.length > 0) {
      throw new Error(
        `The body of these scripts could not be read: ${unread.map(({ url }) => url).join(", ")}`
      );
    }

    return reads.filter((read) => "body" in read);
  }

  /**
   * Finds the scripts that hold a text. It reads once and does not wait for a script that nothing has requested yet, so a spec calls it after the page has shown that it settled.
   * @param text The text to look for in the bodies of the scripts.
   * @returns The URLs of the scripts that hold the text, in the order they were requested.
   */
  async urlsHolding(text: string): Promise<string[]> {
    const scripts = await this.bodies();

    return scripts
      .filter(({ body }) => body.includes(text))
      .map(({ url }) => url);
  }
}
