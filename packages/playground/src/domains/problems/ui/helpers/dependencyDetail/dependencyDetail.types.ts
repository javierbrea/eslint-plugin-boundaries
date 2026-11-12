import type { ConfigToken } from "@/domains/evaluation/helpers/engine";
import type { VerdictIcon } from "@/domains/evaluation/ui/helpers/verdictText";
import type { DependencyLocation } from "@/domains/problems/ui/helpers/dependencyLocation";
import type { Target } from "@/domains/session/helpers/focus";
import type { StateTone } from "@/ui-kit/helpers/tone";

/** The verdict line of the dependency tab: the icon, the color and the words of what the engine says. */
export type VerdictLineContent = {
  /** The icon of the verdict, or `undefined` while the dependency shows no verdict yet. */
  readonly icon: VerdictIcon | undefined;
  /** The color of the icon and of the words. */
  readonly tone: StateTone;
  /** What the engine says, such as `disallowed · policy 2` or `not checked · external`, or an empty text while the dependency shows no verdict yet. */
  readonly text: string;
};

/** The policy that decided the dependency, as the column of the dependency tab draws it: its name, its text and the button that opens it. */
export type PolicyCardContent = {
  /** Names the policy in the head of its column: `policies[2]` or `default`. */
  readonly ref: string;
  /** The policy as written in the config, split into the pieces that the card colors as the editor does. The pieces joined are the text. */
  readonly tokens: readonly ConfigToken[];
  /** What `Open in config` opens: the config at the range of the policy, with its index and the dependency it came from. */
  readonly target: Target;
};

/** What the body of the dependency tab draws. */
export type DependencyDetailContent = {
  /** What the engine says about the dependency. */
  readonly verdict: VerdictLineContent;
  /** Where the dependency is: its file, its line and the source its statement writes, as the row of its problem says it. */
  readonly location: DependencyLocation;
  /** The sentence under the verdict line: the message of a disallowed dependency, or why a dependency is not checked. `undefined` for the others. */
  readonly message: string | undefined;
  /** The policy that decided it. `undefined` when none did, and then the body has no column for the policy. */
  readonly policy: PolicyCardContent | undefined;
};
