import { Pom } from "@/shared/testing/pom";
import { ROOT_CLASS } from "@/ui-kit/helpers/theme/theme.constants";

/** Page object of the root element of the playground, which has no role or label: it is found by its class. It renders a test id only when the component that is the playground gives it one, so a page object that must reach it whatever the test id takes it from its parent with the `root` option. */
export class ThemeRootPom extends Pom {
  protected readonly defaultTestId = "";

  /** @inheritdoc */
  protected findRoot(): HTMLElement {
    return this.findRootBySelector(`.${ROOT_CLASS}`);
  }

  /**
   * Whether a text is among the content of the root.
   * @param text The text of an element, or a pattern it matches.
   * @returns True when an element with that text is inside the root.
   */
  holds(text: string | RegExp): boolean {
    return this.scope.queryByText(text) !== null;
  }

  /**
   * Whether the root carries the class that the scoped rules of the theme apply to. A page object that finds the root by its class always gets `true`; the one that gets the root through the `root` option, such as the page object of the playground, tells whether that element is the scoped one.
   * @returns True when the class list of the root has the class of the root.
   */
  get isScoped(): boolean {
    return this.root.classList.contains(ROOT_CLASS);
  }

  /**
   * Whether the content of the root draws no element, as when a component renders nothing.
   * @returns True when the root has no child element.
   */
  get isEmpty(): boolean {
    return this.root.childElementCount === 0;
  }

  /**
   * The background color of the root.
   * @returns The computed value.
   */
  get backgroundColor(): string {
    return getComputedStyle(this.root).backgroundColor;
  }

  /**
   * The text color of the root.
   * @returns The computed value.
   */
  get color(): string {
    return getComputedStyle(this.root).color;
  }

  /**
   * The font family of the root.
   * @returns The computed value.
   */
  get fontFamily(): string {
    return getComputedStyle(this.root).fontFamily;
  }

  /**
   * The font size of the root.
   * @returns The computed value.
   */
  get fontSize(): string {
    return getComputedStyle(this.root).fontSize;
  }

  /**
   * The line height of the root.
   * @returns The computed value.
   */
  get lineHeight(): string {
    return getComputedStyle(this.root).lineHeight;
  }

  /**
   * The height of the root.
   * @returns The computed value.
   */
  get height(): string {
    return getComputedStyle(this.root).height;
  }

  /**
   * What the border and the padding of the root count in its size.
   * @returns The computed `box-sizing`.
   */
  get boxSizing(): string {
    return getComputedStyle(this.root).boxSizing;
  }

  /**
   * The test id the root renders, which the component that is the playground gives it.
   * @returns The `data-testid` attribute, or null when the root has none.
   */
  get renderedTestId(): string | null {
    return this.root.getAttribute("data-testid");
  }
}
