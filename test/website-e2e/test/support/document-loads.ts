import type { BrowserContext } from "@playwright/test";

/**
 * The documents that the pages of a browser context load, which tell a client-side navigation from a page load: the router of the site changes the URL and loads no document, while a link that is followed before the page hydrates, a plain anchor, `page.goto` and a reload each load one. It listens to every page of the context, the ones a spec opens included, from the moment it is built.
 */
export class DocumentLoads {
  private readonly loaded: string[] = [];

  /**
   * Starts listening.
   * @param context The browser context of the test.
   */
  constructor(context: BrowserContext) {
    context.on("request", (request) => {
      if (request.isNavigationRequest() && !request.frame().parentFrame()) {
        this.loaded.push(new URL(request.url()).pathname);
      }
    });
  }

  /**
   * The pathname of every document loaded so far.
   * @returns The pathnames, in the order the documents were requested, such as `["/playground/"]`.
   */
  get paths(): string[] {
    return [...this.loaded];
  }
}
