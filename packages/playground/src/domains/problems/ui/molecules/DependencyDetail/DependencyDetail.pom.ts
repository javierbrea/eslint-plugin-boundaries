import { fireEvent } from "@testing-library/react";

import { OWN_CLASS, getStyle } from "@/shared/testing/emittedStyle";
import { Pom } from "@/shared/testing/pom";
import { IconPom } from "@/ui-kit/atoms/Icon/Icon.pom";

import { DEPENDENCY_DETAIL_TEST_ID } from "./DependencyDetail.constants";
import type {
  DependencyDetailPiece,
  DependencyDetailTextStyle,
  PolicyCardStyle,
  PolicyColumnStyle,
  PolicyLabelStyle,
} from "./DependencyDetail.types";

/** The selector of the card of the policy, which is the only `pre` of the body. */
const POLICY_CARD_SELECTOR = "pre";

/** Page object of the body of the dependency tab. */
export class DependencyDetailPom extends Pom {
  protected readonly defaultTestId = DEPENDENCY_DETAIL_TEST_ID;

  /**
   * The column of the text: the verdict line, the location and the message.
   * @returns The first element of the body.
   */
  private get textColumn(): HTMLElement {
    return this.root.firstElementChild as HTMLElement;
  }

  /**
   * The line that says what the engine decided.
   * @returns The first element of the text column, which holds the icon and the words.
   */
  private get verdictLine(): HTMLElement {
    return this.textColumn.firstElementChild as HTMLElement;
  }

  /**
   * The line that says where the dependency is.
   * @returns The second element of the text column, which holds the file, the line and the source.
   */
  private get locationElement(): HTMLElement {
    return this.textColumn.children[1] as HTMLElement;
  }

  /**
   * The sentence under the location, when there is one.
   * @returns The element, or null.
   */
  private get messageElement(): HTMLElement | null {
    return this.root.querySelector("p");
  }

  /**
   * The column of the policy, which the body has only when a policy decided the dependency.
   * @returns The second element of the body, or null.
   */
  private get policyColumn(): HTMLElement | null {
    return (this.root.children[1] as HTMLElement | undefined) ?? null;
  }

  /**
   * The head of the column of the policy: its label, its name and the button.
   * @returns The first element of the column.
   */
  private get policyHead(): HTMLElement {
    return (this.policyColumn as HTMLElement).firstElementChild as HTMLElement;
  }

  /**
   * The button that opens the policy.
   * @returns The element, or null when the body has none.
   */
  private get openPolicyButton(): HTMLElement | null {
    return this.scope.queryByRole("button");
  }

  /**
   * The card of the policy.
   * @returns The element, or null when the body has none.
   */
  private get policyCard(): HTMLElement | null {
    return this.root.querySelector(POLICY_CARD_SELECTOR);
  }

  /**
   * What the engine decided, as the verdict line says it.
   * @returns The words of the verdict line, such as `disallowed · policy 2`.
   */
  get verdictText(): string {
    return this.verdictLine.textContent;
  }

  /**
   * The least height of the verdict line, which keeps it one line tall while it says nothing.
   * @returns The computed value.
   */
  get verdictMinHeight(): string {
    return getComputedStyle(this.verdictLine).minHeight;
  }

  /**
   * The color of the verdict line, which is the one that its icon takes.
   * @returns The computed value.
   */
  get verdictColor(): string {
    return getComputedStyle(this.verdictLine).color;
  }

  /**
   * The color of the words of the verdict line, which is not the one of its icon.
   * @returns The computed value.
   */
  get verdictTextColor(): string {
    return getComputedStyle(this.verdictLine.lastElementChild as HTMLElement)
      .color;
  }

  /**
   * The text styles of the verdict line.
   * @returns The computed color, font family, size and weight of the line.
   */
  get verdictStyle(): DependencyDetailTextStyle {
    const { color, fontFamily, fontSize, fontWeight } = getComputedStyle(
      this.verdictLine
    );

    return { color, fontFamily, fontSize, fontWeight };
  }

  /**
   * The text styles of the sentence under the verdict line.
   * @returns The computed color, font family, size and weight of the message.
   */
  get messageStyle(): DependencyDetailTextStyle {
    const { color, fontFamily, fontSize, fontWeight } = getComputedStyle(
      this.messageElement as HTMLElement
    );

    return { color, fontFamily, fontSize, fontWeight };
  }

  /**
   * The icon of the verdict line.
   * @returns The page object of the icon.
   */
  get verdictIcon(): IconPom {
    return this.childPom(IconPom);
  }

  /**
   * The sentence under the verdict line.
   * @returns The message of the plugin or why the dependency is not checked, or null when there is none.
   */
  get message(): string | null {
    return this.messageElement?.textContent ?? null;
  }

  /**
   * What the column of the text says, part by part.
   * @returns The text of each part, in order: the verdict line, the location and the message when there is one.
   */
  get textParts(): string[] {
    return (Array.from(this.textColumn.children) as HTMLElement[]).map(
      (part) => part.textContent
    );
  }

  /**
   * Where the dependency is, as the user reads it.
   * @returns The file, the line and the source, such as `src/modules/checkout/index.js:3 → ../../components/atoms/Button/Button.spec.js`.
   */
  get locationText(): string {
    return this.locationElement.textContent;
  }

  /**
   * The line of the dependency in its file.
   * @returns The position next to the file, such as `:3`.
   */
  get locationPosition(): string {
    return (this.locationElement.firstElementChild as HTMLElement).textContent;
  }

  /**
   * The color of the line of the dependency, which is not the one of the rest of the location.
   * @returns The computed value.
   */
  get locationPositionColor(): string {
    return getComputedStyle(
      this.locationElement.firstElementChild as HTMLElement
    ).color;
  }

  /**
   * The text styles of the location.
   * @returns The computed color, font family, size and weight of the line.
   */
  get locationStyle(): DependencyDetailTextStyle {
    const { color, fontFamily, fontSize, fontWeight } = getComputedStyle(
      this.locationElement
    );

    return { color, fontFamily, fontSize, fontWeight };
  }

  /**
   * Whether the body has the column of the policy.
   * @returns True when a policy decided the dependency.
   */
  get hasPolicyColumn(): boolean {
    return this.policyColumn !== null;
  }

  /**
   * What the head of the column of the policy says, part by part.
   * @returns The text of each part, in order: the label, the name of the policy and the button, such as `["Policy", "policies[2]", "Open in config"]`. It is empty when the body has no column of the policy.
   */
  get policyHeadTexts(): string[] {
    return this.policyColumn === null
      ? []
      : (Array.from(this.policyHead.children) as HTMLElement[]).map(
          (part) => part.textContent
        );
  }

  /**
   * The text styles of the label of the head of the policy, which is drawn in capitals by its style and not by its text.
   * @returns The computed color, font family, size, weight, letter spacing and text transform.
   */
  get policyLabelStyle(): PolicyLabelStyle {
    const {
      color,
      fontFamily,
      fontSize,
      fontWeight,
      letterSpacing,
      textTransform,
    } = getComputedStyle(this.policyHead.children[0]);

    return {
      color,
      fontFamily,
      fontSize,
      fontWeight,
      letterSpacing,
      textTransform,
    };
  }

  /**
   * The text styles of the name of the policy in its head.
   * @returns The computed color, font family, size and weight.
   */
  get policyRefStyle(): DependencyDetailTextStyle {
    const { color, fontFamily, fontSize, fontWeight } = getComputedStyle(
      this.policyHead.children[1]
    );

    return { color, fontFamily, fontSize, fontWeight };
  }

  /**
   * How the column of the policy is set apart from the text.
   * @returns The computed padding on the left and the width, style and color of the border on the left, which is the divider.
   */
  get policyColumnStyle(): PolicyColumnStyle {
    const { paddingLeft, borderLeftWidth, borderLeftStyle, borderLeftColor } =
      getComputedStyle(this.policyColumn as HTMLElement);

    return { paddingLeft, borderLeftWidth, borderLeftStyle, borderLeftColor };
  }

  /**
   * Whether the body offers to open the policy.
   * @returns True when the button is drawn.
   */
  get canOpenPolicy(): boolean {
    return this.openPolicyButton !== null;
  }

  /**
   * What the button that opens the policy says.
   * @returns The text of the button, or null when the body has none.
   */
  get openPolicyText(): string | null {
    return this.openPolicyButton?.textContent ?? null;
  }

  /**
   * The type of the button that opens the policy.
   * @returns The `type` attribute, or null when the body has no button.
   */
  get openPolicyType(): string | null {
    return this.openPolicyButton?.getAttribute("type") ?? null;
  }

  /**
   * The arrow that the button that opens the policy draws after its text.
   * @returns The page object of the icon.
   */
  get openPolicyIcon(): IconPom {
    return this.childPom(IconPom, {
      root: (this.openPolicyButton as HTMLElement).querySelector<HTMLElement>(
        "svg"
      ) as HTMLElement,
    });
  }

  /**
   * How the button that opens the policy is placed in the head.
   * @returns The computed margin on the left, which takes the button to the end of the head.
   */
  get openPolicyMarginLeft(): string {
    return getComputedStyle(this.openPolicyButton as HTMLElement).marginLeft;
  }

  /**
   * The ring that shows the keyboard focus on the button, which jsdom cannot compute: it is read from the rule that applies on keyboard focus.
   * @returns The declarations of that rule.
   */
  get openPolicyFocusStyle(): Record<string, string> {
    return getStyle(
      this.openPolicyButton as HTMLElement,
      `${OWN_CLASS}:focus-visible`
    );
  }

  /**
   * The text of the card of the policy.
   * @returns The policy as the user reads it, or null when the body has no card.
   */
  get policyCardText(): string | null {
    return this.policyCard?.textContent ?? null;
  }

  /**
   * The policy in the card, piece by piece as the user sees it colored.
   * @returns The text and the computed color of each piece, in order. The text that is not in an element of its own has the color of the card.
   */
  get policyPieces(): DependencyDetailPiece[] {
    const card = this.policyCard as HTMLElement;
    const cardColor = getComputedStyle(card).color;

    return Array.from(card.childNodes).map((node) => ({
      text: node.textContent as string,
      color:
        node instanceof HTMLElement ? getComputedStyle(node).color : cardColor,
    }));
  }

  /**
   * The look of the card of the policy.
   * @returns The computed background, color, font family and white space.
   */
  get policyCardStyle(): PolicyCardStyle {
    const { backgroundColor, color, fontFamily, whiteSpace } = getComputedStyle(
      this.policyCard as HTMLElement
    );

    return { backgroundColor, color, fontFamily, whiteSpace };
  }

  /**
   * How the body is laid out, which says whether the policy sits beside the text and at most 460 px wide, or the text has the width.
   * @returns The computed `grid-template-columns`.
   */
  get columns(): string {
    return getComputedStyle(this.root).gridTemplateColumns;
  }

  /**
   * The space between the columns of the body.
   * @returns The computed `gap`.
   */
  get gap(): string {
    return getComputedStyle(this.root).gap;
  }

  /** Presses the button that opens the policy. */
  openPolicy(): void {
    fireEvent.click(this.openPolicyButton as HTMLElement);
  }
}
