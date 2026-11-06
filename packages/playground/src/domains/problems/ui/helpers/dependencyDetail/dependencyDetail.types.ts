import type { ConfigToken } from "@/domains/evaluation/helpers/engine";
import type { VerdictIcon } from "@/domains/evaluation/ui/helpers/verdictText";
import type { Target } from "@/domains/session/helpers/focus";
import type { StateTone } from "@/ui-kit/helpers/tone";

/** The verdict line of the dependency tab: the icon, the color and the words of what the engine says. */
export type VerdictLineContent = {
  /** The icon of the verdict. */
  readonly icon: VerdictIcon;
  /** The color of the icon and of the words. */
  readonly tone: StateTone;
  /** What the engine says, such as `disallowed · policy 2` or `not checked · external`. */
  readonly text: string;
};

/** A fact about the dependency: a label and, in mono after it, the value. */
export type DependencyFact = {
  /** What the fact is about, such as `to` or `syntax`. */
  readonly label: string;
  /** The value, or `null` when there is none, which is drawn as `null`. */
  readonly value: string | null;
};

/** The policy that decided the dependency, as the card of the dependency tab draws it. */
export type PolicyCardContent = {
  /** The comment that opens the card: `// policies[2]` or `// default`. */
  readonly heading: string;
  /** The policy as written in the config, split into the pieces that the card colors as the editor does. The pieces joined are the text. */
  readonly tokens: readonly ConfigToken[];
  /** What `Open policy in config` opens: the config at the range of the policy, with its index and the dependency it came from. */
  readonly target: Target;
};

/** What the body of the dependency tab draws. */
export type DependencyDetailContent = {
  /** What the engine says about the dependency. */
  readonly verdict: VerdictLineContent;
  /** The sentence under the verdict line: the message of a disallowed dependency, or why a dependency is not checked. `undefined` for the others. */
  readonly message: string | undefined;
  /** The facts about the dependency, in order. */
  readonly facts: readonly DependencyFact[];
  /** The policy that decided it. `undefined` when none did, and then there is no button and no card. */
  readonly policy: PolicyCardContent | undefined;
};
