import { screen as view, within } from "@testing-library/react";

import type { PomOptions, PomQueries } from "./pom.types";

/**
 * The base of every page object: the only code that knows how a component is found and driven in a test, so that a spec reads as behavior. A subclass names the default test id of its component and exposes getters that read state and methods that act; the root element is resolved on every access, so a page object never goes stale after a rerender.
 */
export abstract class Pom {
  /** The test id of the root element when the options set none. A page object that finds its root another way, such as an atom, sets it to an empty string and overrides {@link Pom.findRoot}. */
  protected abstract readonly defaultTestId: string;

  /** The options the page object was built with. */
  protected readonly options: PomOptions;

  /**
   * Creates a page object.
   * @param options Select the root element of the component.
   */
  constructor(options: PomOptions = {}) {
    this.options = options;
  }

  /**
   * The queries the root element is searched with: those of the document when the `portal` option is set, those of the parent's root when there is a parent, and those of the document otherwise.
   * @returns The bound queries.
   */
  protected get searchBase(): PomQueries {
    const { parent: owner, portal } = this.options;
    return portal || !owner ? view : within(owner.root);
  }

  /**
   * The element that {@link Pom.searchBase} searches in, for the selectors that Testing Library has no query for.
   * @returns The body of the document, or the parent's root.
   */
  protected get searchBaseElement(): HTMLElement {
    const { parent: owner, portal } = this.options;
    return portal || !owner ? document.body : owner.root;
  }

  /**
   * Finds the root element by the test id (the `testId` option, or the default one of the component) within the search base. A subclass overrides it to find its root another way, such as by role and name, and then uses {@link Pom.pickMatch} to honor the `containing` and `index` options.
   * @returns The root element.
   */
  protected findRoot(): HTMLElement {
    const testId = this.options.testId ?? this.defaultTestId;
    return this.pickMatch(
      this.searchBase.queryAllByTestId(testId),
      `the test id "${testId}"`
    );
  }

  /**
   * Finds the root element by a CSS selector within the search base. It is for a layout primitive with no role, label or text.
   * @param selector The selector.
   * @returns The root element.
   */
  protected findRootBySelector(selector: string): HTMLElement {
    return this.pickMatch(
      Array.from(
        this.searchBaseElement.querySelectorAll<HTMLElement>(selector)
      ),
      `the selector "${selector}"`
    );
  }

  /**
   * Chooses the root element among the candidates: those whose text includes the `containing` option, and then the one at the `index` option.
   * @param candidates The elements that match the query of the page object, in document order.
   * @param description What the candidates were searched by, for the error.
   * @returns The chosen element.
   * @throws When no candidate is left to choose, with what the page object searched by.
   */
  protected pickMatch(
    candidates: readonly HTMLElement[],
    description: string
  ): HTMLElement {
    const { containing, index = 0 } = this.options;
    const matches =
      containing === undefined
        ? candidates
        : candidates.filter((element) =>
            (element.textContent ?? "").includes(containing)
          );
    const match = matches.at(index);

    if (match === undefined) {
      const filter =
        containing === undefined ? "" : ` containing "${containing}"`;
      throw new Error(
        `${this.constructor.name} found no element by ${description}${filter} at index ${index}: ${matches.length} matched`
      );
    }

    return match;
  }

  /**
   * The root element, which is the `root` option or {@link Pom.findRoot}. It is resolved on every access and never cached.
   * @returns The root element.
   */
  protected get root(): HTMLElement {
    return this.options.root ?? this.findRoot();
  }

  /**
   * The Testing Library queries bound to the root element.
   * @returns The bound queries.
   */
  protected get scope(): PomQueries {
    return within(this.root);
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
   * Whether the component is in the document, which is false when its root element cannot be found.
   * @returns True when the root element is found.
   */
  get isRendered(): boolean {
    try {
      return this.root.isConnected;
    } catch {
      return false;
    }
  }

  /**
   * Builds the page object of a component inside this one: it searches only within this page object's root.
   * @param Ctor The class of the child page object.
   * @param options Select the root element of the child, such as its `index`.
   * @returns The child page object.
   */
  protected childPom<T extends Pom>(
    Ctor: new (options: PomOptions) => T,
    options: PomOptions = {}
  ): T {
    return new Ctor({ ...options, parent: this });
  }
}
