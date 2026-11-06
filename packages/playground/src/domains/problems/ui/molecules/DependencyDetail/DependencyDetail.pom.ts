import { fireEvent } from "@testing-library/react";

import { Pom } from "@/shared/testing/pom";
import { IconPom } from "@/ui-kit/atoms/Icon/Icon.pom";

import { DEPENDENCY_DETAIL_TEST_ID } from "./DependencyDetail.constants";
import type {
  DependencyDetailTextStyle,
  PolicyCardStyle,
} from "./DependencyDetail.types";

/** The selector of the card of the policy, which is the only `pre` of the body. */
const POLICY_CARD_SELECTOR = "pre";

/** Page object of the body of the dependency tab. */
export class DependencyDetailPom extends Pom {
  protected readonly defaultTestId = DEPENDENCY_DETAIL_TEST_ID;

  /**
   * The line that says what the engine decided.
   * @returns The first element of the text column, which holds the icon and the words.
   */
  private get verdictLine(): HTMLElement {
    return (this.root.firstElementChild as HTMLElement)
      .firstElementChild as HTMLElement;
  }

  /**
   * The sentence under the verdict line, when there is one.
   * @returns The element, or null.
   */
  private get messageElement(): HTMLElement | null {
    return this.root.querySelector("p");
  }

  /**
   * The facts, each one a label followed by its value.
   * @returns The elements of the facts, in order.
   */
  private get factElements(): HTMLElement[] {
    const facts = (this.root.firstElementChild as HTMLElement).children[
      this.messageElement === null ? 1 : 2
    ] as HTMLElement;

    return Array.from(facts.children) as HTMLElement[];
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
   * The color of the verdict line.
   * @returns The computed value.
   */
  get verdictColor(): string {
    return getComputedStyle(this.verdictLine).color;
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
   * The facts about the dependency, as the user reads them.
   * @returns The text of each fact, such as `kind value`, in order.
   */
  get facts(): string[] {
    return this.factElements.map((fact) => fact.textContent);
  }

  /**
   * The color of the value of a fact.
   * @param label The label of the fact, such as `file`.
   * @returns The computed color of its value.
   */
  factValueColor(label: string): string {
    const fact = this.factElements.find((candidate) =>
      candidate.textContent.startsWith(`${label} `)
    ) as HTMLElement;

    return getComputedStyle(fact.querySelector("b") as HTMLElement).color;
  }

  /**
   * The text styles of the facts.
   * @returns The computed color, font family, size and weight of the row of facts.
   */
  get factsStyle(): DependencyDetailTextStyle {
    const { color, fontFamily, fontSize, fontWeight } = getComputedStyle(
      this.factElements[0].parentElement as HTMLElement
    );

    return { color, fontFamily, fontSize, fontWeight };
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
   * The text of the card of the policy.
   * @returns The heading and the policy as the user reads them, or null when the body has no card.
   */
  get policyCardText(): string | null {
    return this.policyCard?.textContent ?? null;
  }

  /**
   * The color of the heading of the card.
   * @returns The computed color of the comment, or null when the body has no card.
   */
  get policyHeadingColor(): string | null {
    const heading = this.policyCard?.firstElementChild;

    return heading ? getComputedStyle(heading).color : null;
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
   * How the body is laid out, which says that the card is at most 420 px wide beside the text.
   * @returns The computed `grid-template-columns`.
   */
  get columns(): string {
    return getComputedStyle(this.root).gridTemplateColumns;
  }

  /** Presses the button that opens the policy. */
  openPolicy(): void {
    fireEvent.click(this.openPolicyButton as HTMLElement);
  }
}
