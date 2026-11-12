import type { BrowserContext, Page } from "@playwright/test";

/** A web worker that a page started. */
export type StartedWorker = {
  /** The URL of the script of the worker. */
  readonly scriptUrl: string;
  /** The pathname of the page when it started the worker, such as `/playground/`. */
  readonly pagePath: string;
};

/**
 * The web workers that the pages of a browser context start. Only `/playground/` starts one, to evaluate the project. It listens to every page of the context, the ones a spec opens included, from the moment it is built.
 */
export class StartedWorkers {
  private readonly started: StartedWorker[] = [];

  /**
   * Starts listening.
   * @param context The browser context of the test.
   */
  constructor(context: BrowserContext) {
    context.pages().forEach((page) => this.watch(page));
    context.on("page", (page) => this.watch(page));
  }

  private watch(page: Page): void {
    page.on("worker", (worker) => {
      this.started.push({
        scriptUrl: worker.url(),
        pagePath: new URL(page.url()).pathname,
      });
    });
  }

  /**
   * Every worker started so far.
   * @returns The workers, in the order they started.
   */
  get all(): StartedWorker[] {
    return [...this.started];
  }

  /**
   * The workers that a page started while it was at a path.
   * @param pathname The pathname, such as `/playground/`.
   * @returns The workers, in the order they started.
   */
  startedOn(pathname: string): StartedWorker[] {
    return this.started.filter(({ pagePath }) => pagePath === pathname);
  }
}
