import { Pom } from "@/shared/testing/pom";

/** What the text of the status starts with: the number of files. */
const STATUS_PATTERN = /^\d+ files? ·/;

/** The attributes that the styled parts of the bar use as props and must not leave in the DOM. The `failing` prop is not here: React drops a boolean on an attribute it does not know, so only the console of the spec shows a leak of it. */
const PROP_ATTRIBUTES = ["color"] as const;

/** Page object of the top bar. It has no test id: it finds the status text within its parent and takes the bar that holds the status as its root. A component that is the bar gives it its root with the `root` option. */
export class TopBarPom extends Pom {
  protected readonly defaultTestId = "";

  /** @inheritdoc */
  protected findRoot(): HTMLElement {
    return this.pickMatch(
      this.searchBase
        .queryAllByText(STATUS_PATTERN)
        .flatMap((label) => label.parentElement?.parentElement ?? []),
      `the text ${STATUS_PATTERN}`
    );
  }

  /**
   * The element of the text of the status, which holds the number of files and the count of problems.
   * @returns The element.
   */
  private get label(): HTMLElement {
    return this.scope.getByText(STATUS_PATTERN);
  }

  /**
   * The dot before the text of the status.
   * @returns The element.
   * @throws When the status has no element before its text.
   */
  private get dot(): HTMLElement {
    const { previousElementSibling: dot } = this.label;

    if (dot === null) {
      throw new Error(
        `${this.constructor.name} found no dot before the status`
      );
    }

    return dot as HTMLElement;
  }

  /**
   * The element that says how many problems there are, or that the config has errors: the last element of the text of the status.
   * @returns The element.
   * @throws When the text of the status has no element at its end.
   */
  private get problems(): HTMLElement {
    const { lastElementChild: problems } = this.label;

    if (problems === null) {
      throw new Error(
        `${this.constructor.name} found no problems in the status`
      );
    }

    return problems as HTMLElement;
  }

  /**
   * Everything the status says.
   * @returns The text of the status, such as `6 files · 2 problems`.
   */
  get statusText(): string {
    return this.label.textContent;
  }

  /**
   * What the status says about the problems.
   * @returns The text of the count of problems, or `config has errors`.
   */
  get problemsText(): string {
    return this.problems.textContent;
  }

  /**
   * The color of what the status says about the problems.
   * @returns The computed value.
   */
  get problemsColor(): string {
    return getComputedStyle(this.problems).color;
  }

  /**
   * The element the dot is drawn in.
   * @returns The tag name of the dot, in upper case.
   */
  get dotTagName(): string {
    return this.dot.tagName;
  }

  /**
   * Whether the dot is hidden from assistive technology, which reads the status text and not the dot.
   * @returns True when the `aria-hidden` attribute of the dot is `true`.
   */
  get isDotHidden(): boolean {
    return this.dot.getAttribute("aria-hidden") === "true";
  }

  /**
   * The color of the dot.
   * @returns The computed background color.
   */
  get dotColor(): string {
    return getComputedStyle(this.dot).backgroundColor;
  }

  /**
   * The props of the styled parts that reached the DOM as attributes, which they must not do.
   * @returns The name of each such attribute found in the bar, in document order; empty when there is none.
   */
  get leakedPropAttributes(): string[] {
    return [this.root, ...Array.from(this.root.querySelectorAll("*"))].flatMap(
      (element) =>
        PROP_ATTRIBUTES.filter((attribute) => element.hasAttribute(attribute))
    );
  }

  /**
   * The test id the bar renders, which a component that is the bar gives it.
   * @returns The `data-testid` attribute, or null when the bar has none.
   */
  get renderedTestId(): string | null {
    return this.root.getAttribute("data-testid");
  }
}
