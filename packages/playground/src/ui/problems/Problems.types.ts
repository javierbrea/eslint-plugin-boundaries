import type { ReactNode } from "react";

import type {
  ProblemItem,
  ProblemsTab,
} from "@/domains/problems/ui/helpers/problemItems";
import type { Target } from "@/domains/session/helpers/focus";
import type { IconName } from "@/ui-kit/atoms/Icon";

/** A tab of {@link ProblemsPanel}: the tab that the problems give, and an icon the panel can draw after the label. */
export type ProblemsPanelTab<Id extends string = string> = ProblemsTab<Id> & {
  /** An icon after the label, drawn in the tone of the tab. */
  readonly icon?: IconName;
};

/** Props of {@link ProblemsPanel}. */
export type ProblemsPanelProps<Id extends string> = {
  /** The tabs, in order. The panel handles any number of them. */
  readonly tabs: readonly ProblemsPanelTab<Id>[];
  /** The `id` of the selected tab. It must be the id of one of the tabs. */
  readonly selected: Id;
  /** Called with the `id` of the tab the user selects. */
  readonly onSelect: (id: Id) => void;
  /** Whether only the head shows. The workbench resizes the panel. */
  readonly collapsed: boolean;
  /** Called with what the user asks for when they press the collapse button. */
  readonly onCollapsedChange: (collapsed: boolean) => void;
  /** The body of the selected tab: notes and problem lists. It is not drawn while the panel is collapsed. */
  readonly children: ReactNode;
};

/** Props of {@link ProblemList}. */
export type ProblemListProps = {
  /** The rows, in order. */
  readonly items: readonly ProblemItem[];
  /** Called with the target of the row the user presses. Only a row with a target can be pressed. */
  readonly onOpen: (target: Target) => void;
  /** What to say when there are no rows, such as `No problems.` */
  readonly empty: string;
};
