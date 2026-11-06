import type { DependencyDetailContent } from "@/domains/problems/ui/helpers/dependencyDetail";
import type { Target } from "@/domains/session/helpers/focus";

/** Props of {@link DependencyDetail}. */
export type DependencyDetailProps = {
  /** What the body draws: the verdict, the message, the facts and the card of the policy. */
  readonly detail: DependencyDetailContent;
  /** Called with the target of the button `Open policy in config`, which is the policy that decided the dependency. */
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
