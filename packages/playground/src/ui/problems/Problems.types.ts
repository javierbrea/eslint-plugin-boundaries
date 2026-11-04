import type { ReactNode } from "react";

import type { ProblemLevel } from "../../engine";
import type { IconName } from "../icons";

export type { ProblemLevel };

/** The color of a count or an icon: what fails, or what is worth a look. */
export type ProblemTone = "bad" | "warn";

/** A tab of the problems panel: one level of what is in focus. */
export type ProblemsTab = {
  /** Identifies the tab among the tabs of the panel. It is what `onSelect` receives and what `selected` holds. */
  readonly id: string;
  /** The text of the tab. */
  readonly label: string;
  /** Draws the label in the mono font, for paths and `line 3`. */
  readonly mono?: boolean;
  /** How many problems the tab lists. The badge is drawn for a positive count only. */
  readonly count?: number;
  /** The color of the badge and of the icon. The badge is `bad` when it is unset, and the icon takes the color of the label. */
  readonly tone?: ProblemTone;
  /** An icon after the label, drawn in the tone of the tab. */
  readonly icon?: IconName;
};

/** A row of the problem list. */
export type ProblemItem = {
  /** Identifies the row among the rows of the panel. It is what `onOpen` receives. */
  readonly id: string;
  /** How serious the problem is: the icon of the row follows it. */
  readonly level: ProblemLevel;
  /** What the problem is about, such as `eslint.config.js`, drawn in mono. */
  readonly location: string;
  /** Where in the location, such as `:15:16`, drawn in mono next to it. */
  readonly position?: string;
  /** What is wrong, as a sentence. */
  readonly message: string;
  /** The line below the message, in the muted color: the level and the path of the config entry, or the line of text that could not be read. */
  readonly meta: string;
};

/** Props of {@link ProblemsPanel}. */
export type ProblemsPanelProps = {
  /** The tabs, in order. The panel handles any number of them. */
  readonly tabs: readonly ProblemsTab[];
  /** The `id` of the selected tab. It must be the id of one of the tabs. */
  readonly selected: string;
  /** Called with the `id` of the tab the user selects. */
  readonly onSelect: (id: string) => void;
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
  /** Called with the `id` of the row the user presses. */
  readonly onOpen: (id: string) => void;
  /** What to say when there are no rows, such as `No problems.` */
  readonly empty: string;
};
