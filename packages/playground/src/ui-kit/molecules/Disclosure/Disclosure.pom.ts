import { fireEvent } from "@testing-library/react";

import { OWN_CLASS, getStyle } from "@/shared/testing/emittedStyle";
import { Pom } from "@/shared/testing/pom";
import { IconPom } from "@/ui-kit/atoms/Icon/Icon.pom";

import { DISCLOSURE_TEST_ID } from "./Disclosure.constants";

/** What a disclosure frames itself with, as its page object reads it. */
type DisclosureFrame = {
  readonly borderStyle: string;
  readonly borderRadius: string;
};

/** Page object of a disclosure. It finds its root by the test id, and the `name` option keeps only the disclosures whose label is that text, or matches that pattern. */
export class DisclosurePom extends Pom {
  protected readonly defaultTestId: string = DISCLOSURE_TEST_ID;

  /** @inheritdoc */
  protected findRoot(): HTMLElement {
    const testId = this.options.testId ?? this.defaultTestId;
    const { name: labelName } = this.options;
    const candidates = this.searchBase.queryAllByTestId(testId);

    if (labelName === undefined) {
      return this.pickMatch(candidates, `the test id "${testId}"`);
    }

    return this.pickMatch(
      candidates.filter((candidate) => {
        const label = DisclosurePom.labelOf(candidate).textContent;

        return typeof labelName === "string"
          ? label === labelName
          : labelName.test(label);
      }),
      `the test id "${testId}" and the label ${labelName}`
    );
  }

  /**
   * The button that is the header of a disclosure, which is the first child of its root.
   * @param root The root element of the disclosure.
   * @returns The button.
   */
  private static headerOf(root: HTMLElement): HTMLElement {
    return root.firstElementChild as HTMLElement;
  }

  /**
   * The label of a disclosure, which is the second child of its header, after the chevron.
   * @param root The root element of the disclosure.
   * @returns The element of the label.
   */
  private static labelOf(root: HTMLElement): HTMLElement {
    return DisclosurePom.headerOf(root).children[1] as HTMLElement;
  }

  /**
   * The button that folds and unfolds the body.
   * @returns The header.
   */
  private get header(): HTMLElement {
    return DisclosurePom.headerOf(this.root);
  }

  /**
   * The element that follows the label in the header, if the disclosure has a summary.
   * @returns The element, or null.
   */
  private get summaryElement(): HTMLElement | null {
    return (this.header.children[2] as HTMLElement | undefined) ?? null;
  }

  /**
   * The element that `aria-controls` names, when it is rendered.
   * @returns The body, or null while the disclosure is folded.
   */
  private get body(): HTMLElement | null {
    const controlled = this.header.getAttribute("aria-controls") ?? "";

    return (
      Array.from(this.root.querySelectorAll<HTMLElement>("[id]")).find(
        ({ id }) => id === controlled
      ) ?? null
    );
  }

  /**
   * The id of the element that the header controls, as `aria-controls` names it.
   * @returns The `aria-controls` of the header, or null when it has none.
   */
  get controlledId(): string | null {
    return this.header.getAttribute("aria-controls");
  }

  /**
   * The id of the body, which is rendered only while the disclosure is open.
   * @returns The `id` of the body, or null while the disclosure is folded.
   */
  get bodyId(): string | null {
    return this.body?.id ?? null;
  }

  /**
   * The name of what the disclosure folds.
   * @returns The text of the label.
   */
  get label(): string {
    return DisclosurePom.labelOf(this.root).textContent;
  }

  /**
   * The text after the label.
   * @returns The text of the summary, or null when the disclosure has none.
   */
  get summary(): string | null {
    return this.summaryElement?.textContent ?? null;
  }

  /**
   * What the tooltip of the summary says.
   * @returns The `title` of the summary, or null when the disclosure has none.
   */
  get summaryTitle(): string | null {
    return this.summaryElement?.getAttribute("title") ?? null;
  }

  /**
   * The color of the summary.
   * @returns The computed color of the summary.
   */
  get summaryColor(): string {
    return getComputedStyle(this.requireSummary()).color;
  }

  /**
   * The text styles of the summary.
   * @returns The computed font family, size, weight, and whether the text is cut with an ellipsis instead of wrapping.
   */
  get summaryStyle(): Record<
    "fontFamily" | "fontSize" | "fontWeight" | "textOverflow" | "whiteSpace",
    string
  > {
    const { fontFamily, fontSize, fontWeight, textOverflow, whiteSpace } =
      getComputedStyle(this.requireSummary());

    return { fontFamily, fontSize, fontWeight, textOverflow, whiteSpace };
  }

  /**
   * Whether the summary sits at the end of the header, as a digest does, instead of right after the label.
   * @returns True when its left margin is automatic.
   */
  get isSummaryAtEnd(): boolean {
    return getComputedStyle(this.requireSummary()).marginLeft === "auto";
  }

  /**
   * The color of the label.
   * @returns The computed color.
   */
  get labelColor(): string {
    return getComputedStyle(DisclosurePom.labelOf(this.root)).color;
  }

  /**
   * The text styles of the label.
   * @returns The computed font family, size, weight, letter spacing and text transform.
   */
  get labelStyle(): Record<
    | "fontFamily"
    | "fontSize"
    | "fontWeight"
    | "letterSpacing"
    | "textTransform",
    string
  > {
    const { fontFamily, fontSize, fontWeight, letterSpacing, textTransform } =
      getComputedStyle(DisclosurePom.labelOf(this.root));

    return { fontFamily, fontSize, fontWeight, letterSpacing, textTransform };
  }

  /**
   * Whether the body is shown, as `aria-expanded` says it.
   * @returns True when the header says it is expanded.
   */
  get isOpen(): boolean {
    return this.header.getAttribute("aria-expanded") === "true";
  }

  /**
   * Whether assistive technology reads the header as a button.
   * @returns True when the header is among the buttons of the disclosure.
   */
  get isButton(): boolean {
    return this.scope
      .queryAllByRole("button", { hidden: true })
      .includes(this.header);
  }

  /**
   * Whether the body is rendered, which is not so while the disclosure is folded.
   * @returns True when an element of the disclosure has the id that `aria-controls` names.
   */
  get hasBody(): boolean {
    return this.body !== null;
  }

  /**
   * What the body holds.
   * @returns The text of the body, or an empty string while the disclosure is folded.
   */
  get bodyText(): string {
    return this.body?.textContent ?? "";
  }

  /**
   * How the body lays out what it folds.
   * @returns The computed display, grid columns, gap and padding of the body.
   */
  get bodyLayout(): Record<
    "display" | "gridTemplateColumns" | "rowGap" | "padding",
    string
  > {
    const { display, gridTemplateColumns, rowGap, padding } = getComputedStyle(
      this.requireBody()
    );

    return { display, gridTemplateColumns, rowGap, padding };
  }

  /**
   * The icon of the chevron.
   * @returns The page object of the chevron, which is the first icon of the disclosure.
   */
  get chevron(): IconPom {
    return this.childPom(IconPom);
  }

  /**
   * How the root frames the disclosure, which only a box does.
   * @returns The computed border style and radius of the root.
   */
  get frame(): DisclosureFrame {
    const { borderTopStyle, borderRadius } = getComputedStyle(this.root);

    return { borderStyle: borderTopStyle, borderRadius };
  }

  /**
   * The padding of the header.
   * @returns The computed padding.
   */
  get headerPadding(): string {
    return getComputedStyle(this.header).padding;
  }

  /**
   * What the header looks like under the pointer, which jsdom cannot compute: it is read from the rule that applies on hover.
   * @returns The declarations of that rule.
   */
  get hoverStyle(): Record<string, string> {
    return getStyle(this.header, `${OWN_CLASS}:hover`);
  }

  /**
   * What the header looks like while it has the keyboard focus, which jsdom cannot compute: it is read from the rule that applies then.
   * @returns The declarations of that rule.
   */
  get focusStyle(): Record<string, string> {
    return getStyle(this.header, `${OWN_CLASS}:focus-visible`);
  }

  /** Presses the header, as the user does to fold or unfold the body. */
  toggle(): void {
    fireEvent.click(this.header);
  }

  /**
   * Narrows the summary, which the caller needs.
   * @returns The element.
   * @throws When the disclosure has no summary.
   */
  private requireSummary(): HTMLElement {
    if (this.summaryElement === null) {
      throw new Error(`${this.constructor.name} found no summary`);
    }

    return this.summaryElement;
  }

  /**
   * Narrows the body, which the caller needs.
   * @returns The element.
   * @throws When the disclosure is folded.
   */
  private requireBody(): HTMLElement {
    if (this.body === null) {
      throw new Error(`${this.constructor.name} found no body`);
    }

    return this.body;
  }
}
