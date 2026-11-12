import type { DependencyDetailContent } from "@/domains/problems/ui/helpers/dependencyDetail";
import type { Target } from "@/domains/session/helpers/focus";

/** Props of {@link DependencyDetail}. */
export type DependencyDetailProps = {
  /** What the body draws: the verdict, where the dependency is, the message and the policy that decided it. */
  readonly detail: DependencyDetailContent;
  /** Called with the target of the button `Open in config`, which is the policy that decided the dependency. */
  readonly onOpen: (target: Target) => void;
  /** The test id of the root element, in place of the default one. */
  readonly testId?: string;
};

/** The text styles of a part of the body, as its page object reads them. */
export type DependencyDetailTextStyle = Pick<
  CSSStyleDeclaration,
  "color" | "fontFamily" | "fontSize" | "fontWeight"
>;

/** The look of the card of the policy, as its page object reads it. */
export type PolicyCardStyle = Pick<
  CSSStyleDeclaration,
  "backgroundColor" | "color" | "fontFamily" | "whiteSpace"
>;

/** The text styles of the label in the head of the policy, as its page object reads them. */
export type PolicyLabelStyle = Pick<
  CSSStyleDeclaration,
  | "color"
  | "fontFamily"
  | "fontSize"
  | "fontWeight"
  | "letterSpacing"
  | "textTransform"
>;

/** How the column of the policy is set apart from the text, as its page object reads it. */
export type PolicyColumnStyle = Pick<
  CSSStyleDeclaration,
  "paddingLeft" | "borderLeftWidth" | "borderLeftStyle" | "borderLeftColor"
>;

/** A piece of the policy in the card, as its page object reads it. */
export type DependencyDetailPiece = {
  /** The text of the piece. */
  readonly text: string;
  /** The computed color of the piece. */
  readonly color: string;
};
