import { expect, NOT_FOUND_PATH, test } from "./fixtures";

test.describe("the website", () => {
  // The navbar and the docs sidebar of a wide screen. Below 997 px the navbar becomes a menu and the sidebar moves into it as a list with no landmark, which would need a path through the page objects of its own
  test(
    "the navbar leads from the home to the docs and the docs sidebar to the Quick start",
    { tag: "@desktop" },
    async ({ page, navbar, docSidebar, docItem, startedWorkers }) => {
      await page.goto("/");

      await navbar.link("Getting Started").follow();

      await expect(page).toHaveURL("/docs/overview/");
      await expect.poll(() => docItem.title).toBe("Overview");

      await docSidebar.link("Quick Start").follow();

      await expect(page).toHaveURL("/docs/quick-start/");
      await expect.poll(() => docItem.title).toBe("Quick Start");
      expect(startedWorkers.all).toEqual([]);
    }
  );

  test("a page that does not exist shows the 404 page of the site, with a way back to the docs", async ({
    page,
    notFoundContent,
    docItem,
    site,
    startedWorkers,
  }) => {
    const response = await page.goto(NOT_FOUND_PATH);

    expect(response?.status()).toBe(404);
    await expect
      .poll(() => notFoundContent.title)
      .toBe("Nothing is drawn here");
    // The 404 page is rendered on the server too: the browser must hydrate it without an error before the test ends
    await site.waitUntilHydrated();

    await notFoundContent.docsLink.follow();

    await expect(page).toHaveURL("/docs/overview/");
    await expect.poll(() => docItem.title).toBe("Overview");
    expect(startedWorkers.all).toEqual([]);
  });

  for (const path of ["/", "/docs/quick-start/"]) {
    test(`${path} hydrates without an error and starts no web worker`, async ({
      page,
      site,
      startedWorkers,
    }) => {
      await page.goto(path);

      // The errors of a hydration come before the browser says that it hydrated, and the web worker of the playground starts only on its own page
      await site.waitUntilHydrated();

      expect(startedWorkers.all).toEqual([]);
    });
  }
});
