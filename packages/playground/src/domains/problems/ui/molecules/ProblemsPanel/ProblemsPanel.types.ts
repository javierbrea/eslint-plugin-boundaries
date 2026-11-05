import type { ReactNode } from "react";

import type { ProblemsTab } from "@/domains/problems/ui/helpers/problemItems";
import type { IconName } from "@/ui-kit/atoms/Icon";

/** A tab of {@link ProblemsPanel}: the tab that the problems give, and an icon the panel can draw after the label. */
export type ProblemsPanelTab<Id extends string = string> = ProblemsTab<Id> & {
  /** An icon after the label, drawn in the tone of the tab. It takes the color of the label when the tab has no tone. */
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
  /** Whether only the head shows. The shell resizes the panel. */
  readonly collapsed: boolean;
  /** Called with what the user asks for when they press the collapse button. */
  readonly onCollapsedChange: (collapsed: boolean) => void;
  /** The body of the selected tab: notes and problem lists. It is not drawn while the panel is collapsed. */
  readonly children: ReactNode;
  /** The test id of the root element. It is the one of the panel when it is unset, and a module that is this panel gives it its own. */
  readonly testId?: string;
};

/** The text styles of the label of a tab, as its page object reads them. */
export type ProblemsPanelLabelStyle = Pick<
  CSSStyleDeclaration,
  "fontFamily" | "fontSize" | "fontWeight" | "lineHeight"
>;
