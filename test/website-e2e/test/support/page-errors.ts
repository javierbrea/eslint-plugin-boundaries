import type {
  BrowserContext,
  ConsoleMessage,
  Response as PageResponse,
} from "@playwright/test";

/** The only path that answers 404 on purpose, as in `packages/website/scripts/screenshots.mjs`. A spec visits it to see the 404 page of the site, and the browser logs the 404 status of its document as an error. */
export const NOT_FOUND_PATH = "/this-page-does-not-exist/";

// The live stats of the site fall back to static values when these APIs fail, such as when they rate-limit, so their errors are expected. The same hosts as `packages/website/scripts/screenshots.mjs`
const TOLERATED_ERROR_HOSTS = ["api.github.com", "api.npmjs.org"];

type PageError = { readonly text: string; readonly url: string | undefined };

function isToleratedHost(url: string | undefined): boolean {
  if (!url) {
    return false;
  }

  try {
    return TOLERATED_ERROR_HOSTS.includes(new URL(url).hostname);
  } catch {
    return false;
  }
}

/**
 * The errors that the pages of a browser context log to the console or throw, which a test must not leave behind. It listens to every page of the context, the ones a spec opens included, from the moment it is built.
 *
 * Two kinds of error are expected and left out: those of a request to a host of {@link TOLERATED_ERROR_HOSTS}, and the 404 status of the document of {@link NOT_FOUND_PATH}, which the browser logs as an error with the URL of that document. A spec holds no selector or exception for them.
 */
export class PageErrors {
  private readonly errors: PageError[] = [];

  private readonly notFoundDocuments = new Set<string>();

  /**
   * Starts listening.
   * @param context The browser context of the test.
   */
  constructor(context: BrowserContext) {
    context.on("console", (message) => this.onConsole(message));
    context.on("weberror", (webError) => {
      this.errors.push({ text: webError.error().message, url: undefined });
    });
    context.on("response", (response) => this.onResponse(response));
  }

  private onConsole(message: ConsoleMessage): void {
    if (message.type() !== "error") {
      return;
    }

    const { url } = message.location();

    if (!isToleratedHost(url)) {
      this.errors.push({ text: message.text(), url });
    }
  }

  private onResponse(response: PageResponse): void {
    const isNotFoundDocument =
      response.status() === 404 &&
      response.request().isNavigationRequest() &&
      new URL(response.url()).pathname === NOT_FOUND_PATH;

    if (isNotFoundDocument) {
      this.notFoundDocuments.add(response.url());
    }
  }

  /**
   * The errors the pages logged that nothing excuses, as the text of each, followed by the URL it points at when it has one. It is empty when the test has nothing to fix.
   * @returns The errors.
   */
  get unexpected(): string[] {
    return this.errors
      .filter(({ url }) => !(url && this.notFoundDocuments.has(url)))
      .map(({ text, url }) => (url ? `${text} (${url})` : text));
  }
}
