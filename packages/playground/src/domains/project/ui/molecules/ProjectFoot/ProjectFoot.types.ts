import type { ProjectView } from "@/domains/session/helpers/focus";

/** Props of {@link ProjectFoot}. */
export type ProjectFootProps = {
  /** How the project is shown, which is the pressed button of the toggle. */
  readonly view: ProjectView;
  /** Whether nodes can be added, which shows the buttons that add them. */
  readonly editable: boolean;
  /** Called with the kind of node the user asks to add. */
  readonly onAdd: (kind: "file" | "folder") => void;
  /** Called with the view the user switches to. It is not called when the pressed view is pressed again. */
  readonly onViewChange: (view: ProjectView) => void;
};

/** A button of the toggle that switches between the tree and the text, as its page object reads it. */
export type ProjectFootView = {
  /** The text of the button. */
  readonly text: string;
  /** The `aria-pressed` attribute of the button, or null when it has none. */
  readonly pressed: string | null;
};
