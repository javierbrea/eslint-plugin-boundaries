// The `@boundaries/playground/playwright` entry: the Playwright page objects of the components and the base that a host extends for its own. It runs in Node.js, inside the Playwright runner, and its build imports nothing but `@playwright/test`. A page object is exported from here, by file, beside the jsdom sibling it mirrors
export { PlaygroundPom } from "@/app/Playground.pom.playwright";
export { ConfigNodePom } from "@/domains/config/modules/ConfigNode/ConfigNode.pom.playwright";
export { ConfigEditorPom } from "@/domains/config/ui/atoms/ConfigEditor/ConfigEditor.pom.playwright";
export { ConfigPanePom } from "@/domains/config/ui/molecules/ConfigPane/ConfigPane.pom.playwright";
export { ExamplePickerPom } from "@/domains/examples/ui/atoms/ExamplePicker/ExamplePicker.pom.playwright";
export { FileNodePom } from "@/domains/files/modules/FileNode/FileNode.pom.playwright";
export { FileInspectorPom } from "@/domains/files/ui/organisms/FileInspector/FileInspector.pom.playwright";
export { FilePanePom } from "@/domains/files/ui/organisms/FilePane/FilePane.pom.playwright";
export { ProblemsPanePom } from "@/domains/problems/modules/ProblemsPane/ProblemsPane.pom.playwright";
export { ProblemsPanelPom } from "@/domains/problems/ui/molecules/ProblemsPanel/ProblemsPanel.pom.playwright";
export { ProjectPanePom } from "@/domains/project/modules/ProjectPane/ProjectPane.pom.playwright";
export { ProjectTreeItemPom } from "@/domains/project/ui/molecules/ProjectTreeItem/ProjectTreeItem.pom.playwright";
export { ProjectTreePom } from "@/domains/project/ui/organisms/ProjectTree/ProjectTree.pom.playwright";
export { InspectorPanePom } from "@/domains/shell/modules/InspectorPane/InspectorPane.pom.playwright";
export { NodePanePom } from "@/domains/shell/modules/NodePane/NodePane.pom.playwright";
export { ShellPom } from "@/domains/shell/modules/Shell/Shell.pom.playwright";
export { ShellPanesPom } from "@/domains/shell/modules/ShellPanes/ShellPanes.pom.playwright";
export { ShellTopBarPom } from "@/domains/shell/modules/ShellTopBar/ShellTopBar.pom.playwright";
export { HelpDialogPom } from "@/domains/shell/ui/atoms/HelpDialog/HelpDialog.pom.playwright";
export { TopBarActionsPom } from "@/domains/shell/ui/molecules/TopBarActions/TopBarActions.pom.playwright";
export { ShellLayoutPom } from "@/domains/shell/ui/templates/ShellLayout/ShellLayout.pom.playwright";
export { TopBarPom } from "@/domains/shell/ui/templates/TopBar/TopBar.pom.playwright";
export { Pom } from "@/shared/testing/pom/pom.playwright";
export { CountBadgePom } from "@/ui-kit/atoms/CountBadge/CountBadge.pom.playwright";
export { PaneHeadPom } from "@/ui-kit/atoms/PaneHead/PaneHead.pom.playwright";
export { CopyButtonPom } from "@/ui-kit/molecules/CopyButton/CopyButton.pom.playwright";
export { DisclosurePom } from "@/ui-kit/molecules/Disclosure/Disclosure.pom.playwright";
export type {
  PomChildOptions,
  PomOptions,
  PomSearchBase,
} from "@/shared/testing/pom/pom.types.playwright";
