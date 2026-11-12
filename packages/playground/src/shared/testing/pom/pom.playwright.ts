import type { Locator, Page } from "@playwright/test";

import type {
  PomChildOptions,
  PomOptions,
  PomSearchBase,
} from "./pom.types.playwright";

/**
 * The base of every Playwright page object: the only code that knows how a component is found and driven in a browser, so that a spec reads as behavior. It mirrors the jsdom `Pom`, with a `Locator` in place of an element: a subclass names the default test id of its component and exposes value getters, which read once and never wait, and methods that act or wait.
 *
 * The root is a lazy `Locator`: building a page object touches no browser, and a parent can hand out a child before it mounts. A locator resolves nothing until something acts on it, and it resolves again on every action, so a page object never goes stale after a rerender.
 *
 * A getter that reads a value returns a promise and reads it once. A value that settles is asserted with a web-first assertion on a locator or with `expect.poll`, never with a fixed wait.
 */
export abstract class Pom {
  /** The test id of the root element when the options set none. A page object that finds its root another way, such as an atom, sets it to an empty string and overrides {@link Pom.findRoot}. */
  protected abstract readonly defaultTestId: string;

  /** The options the page object was built with. */
  protected readonly options: PomOptions;

  /**
   * Creates a page object.
   * @param options Select the root element of the component, and give the page it is in.
   */
  constructor(options: PomOptions) {
    this.options = options;
  }

  /**
   * The page the component is in.
   * @returns The page of the options.
   */
  protected get page(): Page {
    return this.options.page;
  }

  /**
   * What the root element is searched in: the page when the `portal` option is set or there is no parent, and the parent's root otherwise.
   * @returns The page, or the locator of the parent's root.
   */
  protected get searchBase(): PomSearchBase {
    const { parent: owner, portal, page } = this.options;
    return portal || !owner ? page : owner.root;
  }

  /**
   * Finds the root element by the test id (the `testId` option, or the default one of the component, as the `data-testid` attribute) within the search base. A subclass overrides it to find its root another way, such as by role and name, and then uses {@link Pom.pickMatch} to honor the `containing` and `index` options.
   * @returns The locator of the root element.
   */
  protected findRoot(): Locator {
    const testId = this.options.testId ?? this.defaultTestId;
    return this.pickMatch(this.searchBase.getByTestId(testId));
  }

  /**
   * Finds the root element by a CSS selector within the search base. It is for a layout primitive with no role, label or text.
   * @param selector The selector.
   * @returns The locator of the root element.
   */
  protected findRootBySelector(selector: string): Locator {
    return this.pickMatch(this.searchBase.locator(selector));
  }

  /**
   * Chooses the root element among the candidates: those whose text includes the `containing` option, with its case, and then the one at the `index` option. It chooses nothing until the locator is used, so a position with no element reads as not rendered.
   * @param candidates The locator of every element that matches the query of the page object.
   * @returns The locator of the chosen element.
   */
  protected pickMatch(candidates: Locator): Locator {
    const { containing, index = 0 } = this.options;
    const matches =
      containing === undefined
        ? candidates
        : candidates.filter({
            hasText: new RegExp(
              containing.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
            ),
          });

    return matches.nth(index);
  }

  /**
   * The locator of the root element, which is the `root` option or {@link Pom.findRoot}. It is built on every access and resolves only when something acts on it.
   * @returns The locator of the root element.
   */
  protected get root(): Locator {
    return this.options.root ?? this.findRoot();
  }

  /**
   * The `name` option, for a page object that finds its root by an accessible name or by a visible text.
   * @returns The name.
   * @throws When the option is not set.
   */
  protected requireName(): string | RegExp {
    const { name: accessibleName } = this.options;

    if (accessibleName === undefined) {
      throw new Error(`${this.constructor.name} needs the "name" option`);
    }

    return accessibleName;
  }

  /**
   * Reads an attribute of an element once, without waiting for the element: the `getAttribute` of a locator waits for the element to be in the page, and a value getter never waits.
   * @param attributeName The name of the attribute, such as `aria-expanded`.
   * @param target The locator of the element, which is the root element by default.
   * @returns A promise of the value of the attribute, or null when the element has no such attribute or is not in the page.
   */
  protected async readAttribute(
    attributeName: string,
    target: Locator = this.root
  ): Promise<string | null> {
    const [value] = await target.evaluateAll(
      (elements, attribute) =>
        elements.map((element) => element.getAttribute(attribute)),
      attributeName
    );

    return value ?? null;
  }

  /**
   * Reads the text of an element once (the first one, when the locator matches several), without waiting for it: the `textContent` of a locator waits for the element to be in the page, and a value getter never waits.
   * @param target The locator of the element, which is the root element by default.
   * @returns A promise of the text content of the element, or an empty string when it is not in the page.
   */
  protected async readText(target: Locator = this.root): Promise<string> {
    const [text] = await target.allTextContents();

    return text ?? "";
  }

  /**
   * Whether the component is in the page, which is false when its root element cannot be found. It reads once and does not wait for the component to render.
   * @returns A promise of true when the root element is found.
   */
  get isRendered(): Promise<boolean> {
    return this.root.count().then((count) => count > 0);
  }

  /**
   * Builds the page object of a component inside this one: it searches only within this page object's root, in the same page.
   * @param Ctor The class of the child page object.
   * @param options Select the root element of the child, such as its `index`.
   * @returns The child page object.
   */
  protected childPom<T extends Pom>(
    Ctor: new (options: PomOptions) => T,
    options: PomChildOptions = {}
  ): T {
    return new Ctor({ ...options, page: this.page, parent: this });
  }
}
