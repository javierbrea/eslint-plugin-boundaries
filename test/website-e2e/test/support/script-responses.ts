import type {
  BrowserContext,
  Request as PlaywrightRequest,
} from "@playwright/test";

/**
 * A string that only the chunk of the playground holds: the class of its root element, `ROOT_CLASS` in `packages/playground/src/ui-kit/helpers/theme/theme.constants.ts`. On the production build of the site, no other script of `/`, of a docs page or of `/playground/` holds it. If the playground renames it, the specs that look for the chunk on a wide screen fail, since they no longer find it.
 */
export const PLAYGROUND_CHUNK_MARKER = "jsb-play-root";

type ScriptRead =
  | { readonly url: string; readonly body: string }
  | { readonly url: string; readonly error: unknown };

/**
 * Reads the body of a script once its response arrives.
 * @param request The request of the script.
 * @returns A promise of the URL and the body, or of the error that kept the body from being read. It never rejects.
 */
async function readScript(request: PlaywrightRequest): Promise<ScriptRead> {
  const url = request.url();

  try {
    const response = await request.response();

    return response === null
      ? { url, error: "the request got no response" }
      : { url, body: await response.text() };
  } catch (error: unknown) {
    return { url, error };
  }
}

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
    // Every `.js` file from its request on, whatever its resource type: a body still on its way is awaited, and a chunk that the browser prefetches, as Docusaurus does for the links in sight, has the type `other`
    context.on("request", (request) => {
      if (new URL(request.url()).pathname.endsWith(".js")) {
        this.reads.push(readScript(request));
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
   * Finds the scripts that hold a text. It waits for the body of every script requested so far, and not for a script that nothing has requested yet, so a spec calls it after the page has shown that it settled.
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
